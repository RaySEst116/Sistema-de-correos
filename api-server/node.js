const express = require('express');
const mysql = require('mysql2/promise');
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

// --- CONFIGURACIÓN ---
const GEN_AI_KEY = 'TU_API_KEY_NUEVA_AQUI'; // <--- PEGA TU CLAVE AQUÍ
const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
// CAMBIO: Usamos 'gemini-pro' para evitar el error 404
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const GMAIL_USER = 'mcskipper16@gmail.com'; 
const GMAIL_PASS = 'vzok rdpj syjt fjut'; 

const dbConfig = {
    host: 'localhost', port: 3307, user: 'root', password: '1234', database: 'alhmail_security',
    waitForConnections: true, connectionLimit: 10, queueLimit: 0
};

// CAMBIO CRÍTICO: Usamos createPool para que funcione .getConnection()
const db = mysql.createPool(dbConfig); 

// Verificar conexión
db.getConnection().then(c => { console.log('✅ BD Pool Activo'); c.release(); }).catch(e => console.error('❌ Error BD:', e.message));

const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });

// --- RUTAS ---

// IA
app.post('/ai/draft', async (req, res) => {
    const { prompt, subject } = req.body;
    try {
        const result = await model.generateContent(`Escribe un correo HTML. Asunto: ${subject}. Prompt: ${prompt}. Solo el cuerpo en HTML.`);
        res.json({ success: true, text: (await result.response).text() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// EMAILS
app.get('/emails', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM emails WHERE owner_email = ? ORDER BY date DESC, id DESC', [req.query.userEmail]);
        const parsed = rows.map(r => ({...r, unread: !!r.unread, hasAttachments: !!r.hasAttachments, attachments: JSON.parse(r.attachments||'[]'), securityAnalysis: JSON.parse(r.securityAnalysis||'{}') }));
        res.json(parsed);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/emails/downloaded', async (req, res) => {
    if (!req.body.ids?.length) return res.json({success:true});
    try { await db.query(`DELETE FROM emails WHERE id IN (${req.body.ids.map(()=>'?').join(',')})`, req.body.ids); res.json({success:true}); } catch(e){res.status(500).send(e.message);}
});

app.post('/emails', async (req, res) => {
    const { from, to, cc, bcc, subject, body, isDraft, attachments, idToDelete } = req.body;
    let connection;
    try {
        connection = await db.getConnection(); // ESTO AHORA FUNCIONARÁ
        await connection.beginTransaction();

        if (idToDelete) await connection.query('DELETE FROM emails WHERE id = ?', [idToDelete]);

        const dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const previewText = body.replace(/<[^>]*>?/gm, '').substring(0, 50) + '...';
        const attachStr = JSON.stringify(attachments || []);
        const hasAttach = (attachments && attachments.length > 0) ? 1 : 0;

        // Guardar en Enviados
        await connection.query('INSERT INTO emails SET ?', {
            owner_email: from, folder: isDraft ? 'drafts' : 'sent', sender: 'Yo', to_address: to, 
            subject: subject || '(Sin Asunto)', preview: `Para: ${to} - ${previewText}`, body: body,
            date: dateNow, unread: 0, hasAttachments: hasAttach, attachments: attachStr,
            securityAnalysis: JSON.stringify({ status: "clean" })
        });

        if (!isDraft && to) {
            const [users] = await connection.query("SELECT email FROM users WHERE email = ?", [to]);
            if (users.length > 0) {
                await connection.query('INSERT INTO emails SET ?', {
                    owner_email: to, folder: 'inbox', sender: from, to_address: 'Mí',
                    subject: subject || '(Sin Asunto)', preview: previewText, body: body,
                    date: dateNow, unread: 1, hasAttachments: hasAttach, attachments: attachStr,
                    securityAnalysis: JSON.stringify({ status: "clean" })
                });
            } else {
                try { await transporter.sendMail({ from: GMAIL_USER, to, cc, bcc, subject, html: body, attachments }); } catch (err) {}
            }
        }
        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally { if(connection) connection.release(); }
});

// ... (Mantén tus rutas de login/users aquí abajo igual que antes) ...
// LOGIN
app.post('/login', async (req, res) => { try { const [r] = await db.query("SELECT * FROM users WHERE email=? AND password=?", [req.body.email, req.body.password]); r.length ? res.json({success:true, user:r[0]}) : res.status(401).send(); } catch(e){res.status(500).send();} });
app.get('/contacts', async (req, res) => { try { const [r] = await db.query('SELECT * FROM contacts'); res.json(r); } catch(e){} });
app.get('/users', async (req, res) => { try { const [r] = await db.query('SELECT id, name, email, role FROM users'); res.json(r); } catch(e){} });
app.post('/users', async (req, res) => { try { await db.query("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)", [req.body.name, req.body.email, req.body.password, req.body.role]); res.json({success:true}); } catch(e){res.status(500).send(e.message);} });
app.put('/users/:id', async (req, res) => { try { await db.query("UPDATE users SET name=?, role=? WHERE id=?", [req.body.name, req.body.role, req.params.id]); res.json({success:true}); } catch(e){} });
app.delete('/users/:id', async (req, res) => { try { await db.query('DELETE FROM users WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e){} });
app.delete('/emails/:id', async (req, res) => { try { await db.query('DELETE FROM emails WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e){} });
app.put('/emails/:id', async (req, res) => { try { await db.query('UPDATE emails SET unread=? WHERE id=?', [req.body.unread, req.params.id]); res.json({success:true}); } catch(e){} });

async function syncGmailInbox() {
    /* ... Tu lógica IMAP ... */
}
setInterval(syncGmailInbox, 20000);
app.listen(3001, () => console.log('🚀 Servidor Listo'));