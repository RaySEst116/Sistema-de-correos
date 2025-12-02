const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const imap = require('imap-simple');
const { simpleParser } = require('mailparser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// --- TUS CREDENCIALES ---
const GMAIL_USER = 'mcskipper16@gmail.com'; 
const GMAIL_PASS = 'vzok rdpj syjt fjut'; 

// --- CONEXIÓN BD ---
const dbConfig = {
    host: 'localhost', port: 3307, user: 'root', password: '1234', database: 'alhmail_security'
};

let db;
async function connectDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('✅ BD Conectada (Modo Promesas)');
    } catch (e) {
        console.error('❌ Error BD:', e.message);
    }
}
connectDB();

const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });

// ================= RUTAS =================

// 1. GET EMAILS (FILTRADO POR DUEÑO)
// Ahora recibe ?userEmail=... para mostrar solo los correos de ese usuario
app.get('/emails', async (req, res) => {
    const userEmail = req.query.userEmail;
    if (!userEmail) return res.json([]); 

    try {
        // BUSCAMOS SOLO DONDE owner_email SEA EL USUARIO ACTUAL
        const [rows] = await db.query(
            'SELECT * FROM emails WHERE owner_email = ? ORDER BY date DESC, id DESC', 
            [userEmail]
        );
        
        const parsed = rows.map(row => ({
            ...row,
            unread: Boolean(row.unread),
            hasAttachments: Boolean(row.hasAttachments),
            attachments: row.attachments ? JSON.parse(row.attachments) : []
        }));
        res.json(parsed);
    } catch (e) { res.status(500).send(e.message); }
});

// 2. GET CONTACTS
app.get('/contacts', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM contacts ORDER BY name ASC');
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

// 3. LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
        if (rows.length > 0) {
            res.json({ success: true, user: rows[0], token: "jwt-" + Date.now() });
        } else {
            res.status(401).json({ success: false, message: "Credenciales incorrectas" });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. GET USERS (ADMIN)
app.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, role FROM users ORDER BY name ASC');
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

// 4.5 CREATE USER
app.post('/users', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Faltan datos" });

    try {
        const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (exists.length > 0) return res.status(409).json({ success: false, message: "El email ya existe" });

        const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        await db.query(sql, [name, email, password, role || 'user']);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. UPDATE USER
app.put('/users/:id', async (req, res) => {
    const { name, password, role } = req.body;
    let sql = "UPDATE users SET name = ?, role = ? WHERE id = ?";
    let params = [name, role, req.params.id];
    if (password) { sql = "UPDATE users SET name = ?, role = ?, password = ? WHERE id = ?"; params = [name, role, password, req.params.id]; }
    try {
        await db.query(sql, params);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. DELETE USER
app.delete('/users/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// 7. EMAILS ACTIONS
app.delete('/emails/:id', async (req, res) => {
    try { await db.query('DELETE FROM emails WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).send(e.message);}
});
app.put('/emails/:id', async (req, res) => {
    try { await db.query('UPDATE emails SET unread = ? WHERE id = ?', [req.body.unread, req.params.id]); res.json({success:true}); } catch(e){res.status(500).send(e.message);}
});

// 8. ENVIAR CORREO (LÓGICA DE DOBLE COPIA)
app.post('/emails', async (req, res) => {
    // Recibimos 'from' (quien envía)
    const { from, to, cc, bcc, subject, body, isDraft, attachments, idToDelete } = req.body;
    
    // Usamos una conexión dedicada para transacción
    const connection = await db.getConnection(); 
    try {
        await connection.beginTransaction();

        if (idToDelete) await connection.query('DELETE FROM emails WHERE id = ?', [idToDelete]);

        const dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const cleanBody = body || '';
        const previewText = `Para: ${to || '?'} - ${cleanBody.replace(/<[^>]*>?/gm, '').substring(0, 30)}...`;
        const attachStr = JSON.stringify(attachments || []);
        const hasAttach = attachments && attachments.length > 0 ? 1 : 0;

        // 
        // Esta imagen representaría cómo el servidor divide el mensaje en dos rutas: base de datos interna y SMTP externo.

        // --- COPIA 1: PARA EL REMITENTE (TÚ) ---
        // Se guarda en 'sent' y el dueño eres TÚ (from)
        const emailSenderData = {
            owner_email: from, 
            folder: isDraft ? 'drafts' : 'sent',
            sender: 'Yo',
            to_address: to, 
            subject: subject || '(Sin Asunto)',
            preview: previewText,
            body: cleanBody,
            date: dateNow,
            unread: 0,
            hasAttachments: hasAttach,
            attachments: attachStr,
            securityAnalysis: JSON.stringify({ status: "clean" })
        };
        await connection.query('INSERT INTO emails SET ?', emailSenderData);

        // --- COPIA 2: PARA EL DESTINATARIO (INTERNO) ---
        if (!isDraft && to) {
            // A. Intentar enviar por Gmail real (para correos externos)
            transporter.sendMail({ from: GMAIL_USER, to, cc, bcc, subject, html: body, attachments }).catch(err => console.log("SMTP externo omitido o fallido (OK si es local)"));

            // B. Verificar si es usuario interno
            const [users] = await connection.query("SELECT email FROM users WHERE email = ?", [to]);
            
            if (users.length > 0) {
                // Es usuario interno -> LE PONEMOS EL EMAIL EN SU INBOX
                const emailRecipientData = {
                    owner_email: to, // El dueño es EL DESTINATARIO
                    folder: 'inbox',
                    sender: from,    // El remitente eres TÚ
                    to_address: 'Mí',
                    subject: subject || '(Sin Asunto)',
                    preview: cleanBody.replace(/<[^>]*>?/gm, '').substring(0, 30) + '...',
                    body: cleanBody,
                    date: dateNow,
                    unread: 1, // Nuevo para él
                    hasAttachments: hasAttach,
                    attachments: attachStr,
                    securityAnalysis: JSON.stringify({ status: "clean" })
                };
                await connection.query('INSERT INTO emails SET ?', emailRecipientData);
                console.log(`🔀 Entrega interna exitosa a ${to}`);
            }
        }

        await connection.commit();
        res.json({ success: true });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// --- SYNC GMAIL (ACTUALIZADO) ---
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
                
                let folder = 'inbox';
                const content = (subject + " " + parsed.text).toLowerCase();
                if (content.includes('oferta') || content.includes('premio')) folder = 'spam';

                // Evitar duplicados (Ahora revisamos owner_email también)
                const [exists] = await db.query("SELECT id FROM emails WHERE owner_email = ? AND subject = ? AND sender = ? AND date > DATE_SUB(NOW(), INTERVAL 1 DAY) LIMIT 1", [GMAIL_USER, subject, sender]);
                
                if (exists.length === 0) {
                    const newEmail = {
                        owner_email: GMAIL_USER, // <--- ESTO ASIGNA EL CORREO AL ADMIN (O AL DUEÑO DE LA CUENTA GMAIL)
                        folder, 
                        sender, 
                        subject, 
                        preview: parsed.text ? parsed.text.substring(0, 60) : "...",
                        body: parsed.html || parsed.textAsHtml || "",
                        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        unread: 1, 
                        hasAttachments: parsed.attachments.length > 0 ? 1 : 0,
                        attachments: '[]', // Simplificado para IMAP
                        securityAnalysis: JSON.stringify({ status: "clean" })
                    };
                    await db.query(`INSERT INTO emails SET ?`, newEmail);
                    console.log(`📥 IMAP Recibido para Admin: ${subject}`);
                }
            }
        }
        connection.end();
    } catch (e) { if(e.message !== 'Nothing to fetch') console.log("IMAP Info:", e.message); }
}

setInterval(syncGmailInbox, 20000);
app.listen(3001, () => console.log('🚀 Servidor Listo (Doble Copia + OwnerID)'));