const express = require('express');
const mysql = require('mysql2/promise'); // <--- CAMBIO IMPORTANTE: Promesas
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

// --- CONEXIÓN BD (MODERNA) ---
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

// ================= RUTAS (MODERNIZADAS) =================

// 1. GET EMAILS
app.get('/emails', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM emails ORDER BY date DESC, id DESC');
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

// 4.5. CREATE USER (CREAR USUARIO NUEVO)
app.post('/users', async (req, res) => {
    const { name, email, password, role } = req.body;

    // Validación básica
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Faltan datos" });
    }

    try {
        // 1. Verificar si el email ya existe para evitar duplicados
        const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (exists.length > 0) {
            return res.status(409).json({ success: false, message: "El email ya existe" });
        }

        // 2. Insertar el usuario
        // Nota: En un entorno real, la contraseña debería encriptarse (ej. bcrypt)
        const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        await db.query(sql, [name, email, password, role || 'user']);

        res.json({ success: true });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// 5. UPDATE USER / PASSWORD / ROLE
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

// 7. EMAILS ACTIONS (DELETE / MARK READ)
app.delete('/emails/:id', async (req, res) => {
    try { await db.query('DELETE FROM emails WHERE id = ?', [req.params.id]); res.json({success:true}); } catch(e){res.status(500).send(e.message);}
});
app.put('/emails/:id', async (req, res) => {
    try { await db.query('UPDATE emails SET unread = ? WHERE id = ?', [req.body.unread, req.params.id]); res.json({success:true}); } catch(e){res.status(500).send(e.message);}
});

// 8. ENVIAR / GUARDAR (POST)
app.post('/emails', async (req, res) => {
    const { to, cc, bcc, subject, body, isDraft, attachments, idToDelete } = req.body;
    
    try {
        if (idToDelete) await db.query('DELETE FROM emails WHERE id = ?', [idToDelete]);
        
        let folder = 'sent';
        if (!isDraft) {
            if(!to) return res.status(400).send("Falta destino");
            await transporter.sendMail({ from: GMAIL_USER, to, cc, bcc, subject, html: body, attachments });
            console.log(`📨 Enviado a ${to}`);
        } else {
            folder = 'drafts';
            console.log(`💾 Guardado Borrador`);
        }

        const sql = `INSERT INTO emails SET ?`;
        const emailData = {
            folder, sender: isDraft ? 'Borrador' : 'Yo', to_address: to, 
            subject: subject || '(Sin Asunto)',
            preview: `Para: ${to || '?'} - ${body.replace(/<[^>]*>?/gm, '').substring(0, 30)}...`,
            body: body || '',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            unread: 0,
            hasAttachments: attachments && attachments.length > 0 ? 1 : 0,
            attachments: JSON.stringify(attachments || []),
            securityAnalysis: JSON.stringify({ status: "clean" })
        };

        await db.query(sql, emailData);
        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// --- SYNC GMAIL ---
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
                
                // Detectar SPAM simple
                let folder = 'inbox';
                const content = (subject + " " + parsed.text).toLowerCase();
                if (content.includes('oferta') || content.includes('premio') || content.includes('urgente')) folder = 'spam';

                // Check duplicados
                const [exists] = await db.query("SELECT id FROM emails WHERE subject = ? AND sender = ? AND date > DATE_SUB(NOW(), INTERVAL 1 DAY) LIMIT 1", [subject, sender]);
                
                if (exists.length === 0) {
                    const newEmail = {
                        folder, sender, subject, preview: parsed.text ? parsed.text.substring(0, 60) : "...",
                        body: parsed.html || parsed.textAsHtml || "",
                        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        unread: 1, hasAttachments: parsed.attachments.length > 0 ? 1 : 0
                    };
                    await db.query(`INSERT INTO emails SET ?`, newEmail);
                    console.log(`📥 Recibido: ${subject}`);
                }
            }
        }
        connection.end();
    } catch (e) { if(e.message !== 'Nothing to fetch') console.log("IMAP:", e.message); }
}

setInterval(syncGmailInbox, 20000);
app.listen(3001, () => console.log('🚀 Servidor Listo (v2.0 Promesas)'));