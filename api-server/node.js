const express = require('express');
const mysql = require('mysql2/promise'); // <--- IMPORTANTE: mysql2/promise
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// --- 1. CONFIGURACIÓN IA (GEMINI) ---
// Asegúrate de que esta clave sea la correcta y tenga permisos habilitados
const GEN_AI_KEY = 'AIzaSyDIZEA0rjRuTv35Dfncq3gE8qk67VheGLM'; 
const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
// Usamos 'gemini-1.5-flash' que es el estándar actual.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- 2. CREDENCIALES GMAIL ---
const GMAIL_USER = 'mcskipper16@gmail.com'; 
const GMAIL_PASS = 'vzok rdpj syjt fjut'; 

// --- 3. CONEXIÓN BD (CORREGIDO A POOL) ---
const dbConfig = {
    host: 'localhost', 
    port: 3307, 
    user: 'root', 
    password: '1234', 
    database: 'alhmail_security',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// !!! AQUÍ ESTABA EL ERROR ANTES !!!
// Usamos createPool (NO createConnection) para poder usar .getConnection() más abajo
const db = mysql.createPool(dbConfig); 

// Prueba de conexión al iniciar
db.getConnection()
    .then(conn => {
        console.log('✅ BD Conectada correctamente (Modo Pool)');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Error fatal al conectar BD:', err.message);
    });

const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });

// ================= RUTAS =================

// RUTA IA: Generar Borrador
app.post('/ai/draft', async (req, res) => {
    const { prompt, subject } = req.body;
    if (!prompt) return res.status(400).json({ error: "Falta la instrucción" });

    try {
        console.log("🤖 IA procesando prompt:", prompt);
        
        const fullPrompt = `
            Eres un asistente de correo. Escribe el cuerpo de un email.
            Asunto: "${subject || 'General'}"
            Instrucción: "${prompt}"
            Salida: Solo el texto en HTML (p, br, b). Sin saludos del sistema.
        `;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        res.json({ success: true, text: text });

    } catch (e) {
        console.error("❌ ERROR IA:", e);
        // Si falla la IA, devolvemos un mensaje claro al frontend
        res.status(500).json({ error: "Error de IA (Revisa tu API Key): " + e.message });
    }
});

// GET EMAILS
app.get('/emails', async (req, res) => {
    const userEmail = req.query.userEmail;
    if (!userEmail) return res.json([]); 
    try {
        const [rows] = await db.query('SELECT * FROM emails WHERE owner_email = ? ORDER BY date DESC, id DESC', [userEmail]);
        const parsed = rows.map(row => ({
            ...row,
            unread: Boolean(row.unread),
            hasAttachments: Boolean(row.hasAttachments),
            attachments: row.attachments ? JSON.parse(row.attachments) : []
        }));
        res.json(parsed);
    } catch (e) { console.error("GET Error:", e.message); res.status(500).send(e.message); }
});

// POP3: Borrar correos descargados
app.post('/emails/downloaded', async (req, res) => {
    const { ids } = req.body; 
    if (!ids || ids.length === 0) return res.json({ success: true });
    try {
        const placeholder = ids.map(() => '?').join(',');
        await db.query(`DELETE FROM emails WHERE id IN (${placeholder})`, ids);
        console.log(`🧹 POP3: ${ids.length} correos eliminados.`);
        res.json({ success: true });
    } catch (e) { console.error("POP3 Error:", e.message); res.status(500).json({ error: e.message }); }
});

// ENVIAR CORREO (Routing Interno/Externo)
app.post('/emails', async (req, res) => {
    const { from, to, cc, bcc, subject, body, isDraft, attachments, idToDelete } = req.body;
    
    // AHORA ESTO FUNCIONARÁ PORQUE 'db' ES UN POOL
    let connection;
    try {
        connection = await db.getConnection(); // Obtiene conexión del pool
        await connection.beginTransaction();

        if (idToDelete) await connection.query('DELETE FROM emails WHERE id = ?', [idToDelete]);

        const dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const cleanBody = body || '';
        const previewText = cleanBody.replace(/<[^>]*>?/gm, '').substring(0, 50) + '...';
        const attachStr = JSON.stringify(attachments || []);
        const hasAttach = attachments && attachments.length > 0 ? 1 : 0;

        // A. Guardar en Enviados
        await connection.query('INSERT INTO emails SET ?', {
            owner_email: from, folder: isDraft ? 'drafts' : 'sent', sender: 'Yo', to_address: to, 
            subject: subject || '(Sin Asunto)', preview: `Para: ${to} - ${previewText}`, body: cleanBody,
            date: dateNow, unread: 0, hasAttachments: hasAttach, attachments: attachStr,
            securityAnalysis: JSON.stringify({ status: "clean" })
        });

        if (!isDraft && to) {
            // B. Verificar destinatario
            const [users] = await connection.query("SELECT email FROM users WHERE email = ?", [to]);
            
            if (users.length > 0) {
                // Interno
                await connection.query('INSERT INTO emails SET ?', {
                    owner_email: to, folder: 'inbox', sender: from, to_address: 'Mí',
                    subject: subject || '(Sin Asunto)', preview: previewText, body: cleanBody,
                    date: dateNow, unread: 1, hasAttachments: hasAttach, attachments: attachStr,
                    securityAnalysis: JSON.stringify({ status: "clean" })
                });
                console.log(`🔀 Interno: Enviado a ${to}`);
            } else {
                // Externo
                try {
                    await transporter.sendMail({ from: GMAIL_USER, to, cc, bcc, subject, html: body, attachments });
                    console.log(`🌎 SMTP: Enviado a ${to}`);
                } catch (err) { console.error("SMTP Error:", err.message); }
            }
        }

        await connection.commit();
        res.json({ success: true });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ ERROR AL ENVIAR:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// AUXILIARES
app.get('/contacts', async (req, res) => {
    try { const [rows] = await db.query('SELECT * FROM contacts ORDER BY name ASC'); res.json(rows); } catch (e) { res.status(500).send(e.message); }
});
app.get('/users', async (req, res) => {
    try { const [rows] = await db.query('SELECT id, name, email, role FROM users ORDER BY name ASC'); res.json(rows); } catch (e) { res.status(500).send(e.message); }
});
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
        if (rows.length > 0) res.json({ success: true, user: rows[0], token: "jwt-" + Date.now() });
        else res.status(401).json({ success: false, message: "Credenciales incorrectas" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/users', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (exists.length > 0) return res.status(409).json({ success: false, message: "Email existe" });
        await db.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, password, role || 'user']);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/users/:id', async (req, res) => {
    const { name, password, role } = req.body;
    let sql = "UPDATE users SET name = ?, role = ? WHERE id = ?";
    let params = [name, role, req.params.id];
    if (password) { sql = "UPDATE users SET name = ?, role = ?, password = ? WHERE id = ?"; params = [name, role, password, req.params.id]; }
    try { await db.query(sql, params); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/users/:id', async (req, res) => {
    try { await db.query('DELETE FROM users WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).send(e.message); }
});
app.delete('/emails/:id', async (req, res) => {
    try { await db.query('DELETE FROM emails WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).send(e.message);}
});
app.put('/emails/:id', async (req, res) => {
    try { await db.query('UPDATE emails SET unread = ? WHERE id = ?', [req.body.unread, req.params.id]); res.json({success:true}); } catch(e){res.status(500).send(e.message);}
});

// SYNC GMAIL
async function syncGmailInbox() {
    const config = { imap: { user: GMAIL_USER, password: GMAIL_PASS, host: 'imap.gmail.com', port: 993, tls: true, tlsOptions: { rejectUnauthorized: false } } };
    try {
        const connection = await imap.connect(config);
        await connection.openBox('INBOX');
        const messages = await connection.search([['1:10']], { bodies: ['HEADER', 'TEXT'], markSeen: false });
        for (const item of messages) {
            const all = item.parts.find(part => part.which === 'TEXT');
            if (all) {
                const parsed = await simpleParser(all.body);
                const sender = parsed.from ? parsed.from.text : "Desconocido";
                const subject = parsed.subject || "(Sin Asunto)";
                const [exists] = await db.query("SELECT id FROM emails WHERE owner_email = ? AND subject = ? AND sender = ? AND date > DATE_SUB(NOW(), INTERVAL 1 DAY) LIMIT 1", [GMAIL_USER, subject, sender]);
                if (exists.length === 0) {
                    await db.query(`INSERT INTO emails SET ?`, {
                        owner_email: GMAIL_USER, folder: 'inbox', sender, subject, 
                        preview: parsed.text ? parsed.text.substring(0, 60) : "...",
                        body: parsed.html || parsed.textAsHtml || "",
                        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        unread: 1, hasAttachments: parsed.attachments.length > 0 ? 1 : 0, attachments: '[]',
                        securityAnalysis: JSON.stringify({ status: "clean" })
                    });
                    console.log(`📥 IMAP: ${subject}`);
                }
            }
        }
        connection.end();
    } catch (e) { if(e.message !== 'Nothing to fetch') console.log("IMAP Sync:", e.message); }
}

setInterval(syncGmailInbox, 20000);
app.listen(3001, () => console.log('🚀 Servidor Listo en Puerto 3001'));