const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const imap = require('imap-simple');
const { simpleParser } = require('mailparser');

const app = express();
app.use(cors());
// Límite alto para adjuntos
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 1. TUS CREDENCIALES
// ==========================================
const GMAIL_USER = 'mcskipper16@gmail.com'; 
const GMAIL_PASS = 'vzok rdpj syjt fjut'; // TU CONTRASEÑA DE APLICACIÓN

// ==========================================
// 2. CONEXIÓN BASE DE DATOS
// ==========================================
const db = mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '1234', // TU CONTRASEÑA
    database: 'alhmail_security'
});

db.connect(err => {
    if (err) console.error('❌ Error MySQL:', err.message);
    else console.log('✅ Conectado a MySQL Workbench');
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
});

// ================= RUTAS =================

// --- OBTENER EMAILS ---
app.get('/emails', (req, res) => {
    db.query('SELECT * FROM emails ORDER BY date DESC, id DESC', (err, results) => {
        if (err) return res.status(500).send(err);
        const parsed = results.map(row => {
            let analysis = {};
            let attachments = [];
            try {
                if (row.securityAnalysis) analysis = JSON.parse(row.securityAnalysis);
                if (row.attachments) attachments = JSON.parse(row.attachments);
            } catch (e) {}

            return {
                ...row,
                unread: Boolean(row.unread),
                hasAttachments: Boolean(row.hasAttachments),
                securityAnalysis: analysis,
                attachments: attachments
            };
        });
        res.json(parsed);
    });
});

// --- OBTENER CONTACTOS ---
app.get('/contacts', (req, res) => {
    db.query('SELECT * FROM contacts ORDER BY name ASC', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// --- LOGIN ---
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, results) => {
        if (results.length > 0) res.json({ success: true, user: results[0], token: "jwt-" + Date.now() });
        else res.status(401).json({ success: false, message: "Credenciales incorrectas" });
    });
});

// --- ACTUALIZAR USUARIO ---
app.put('/users/:id', (req, res) => {
    const { name, password } = req.body;
    let sql = "UPDATE users SET name = ? WHERE id = ?";
    let params = [name, req.params.id];
    if (password) { sql = "UPDATE users SET name = ?, password = ? WHERE id = ?"; params = [name, password, req.params.id]; }
    db.query(sql, params, (err) => { if(err) return res.status(500).send(err); res.json({success:true}); });
});

// --- ACTUALIZAR EMAIL (LEÍDO/MOVER) ---
app.put('/emails/:id', (req, res) => {
    const { unread } = req.body;
    db.query("UPDATE emails SET unread = ? WHERE id = ?", [unread, req.params.id], (err) => {
        if(err) return res.status(500).send(err);
        res.json({success: true});
    });
});

// --- ELIMINAR EMAIL ---
app.delete('/emails/:id', (req, res) => {
    db.query("DELETE FROM emails WHERE id = ?", [req.params.id], (err) => {
        if(err) return res.status(500).send(err);
        res.json({success: true});
    });
});

// --- ENVIAR / GUARDAR EMAIL ---
app.post('/emails', async (req, res) => {
    const { to, cc, bcc, subject, body, preview, isDraft, attachments, idToDelete } = req.body;

    // Si enviamos un borrador, borramos el viejo
    if(idToDelete) db.query('DELETE FROM emails WHERE id = ?', [idToDelete]);

    let finalTo = to;
    if (!finalTo && preview && preview.startsWith("Para:")) {
        finalTo = preview.split(" - ")[0].replace("Para: ", "").trim();
    }

    if (!isDraft && !finalTo) return res.status(400).send("Falta destinatario");

    try {
        let folder = 'sent';
        if (!isDraft) {
            const mailOptions = {
                from: GMAIL_USER, to: finalTo, cc, bcc, subject, html: body, attachments
            };
            await transporter.sendMail(mailOptions);
            console.log(`📨 Enviado a ${finalTo}`);
        } else {
            folder = 'drafts';
            console.log(`💾 Guardado borrador`);
        }

        const sql = `INSERT INTO emails SET ?`;
        const emailData = {
            folder, sender: isDraft ? 'Borrador' : 'Yo',
            subject: subject || '(Sin Asunto)',
            preview: `Para: ${finalTo || '?'} - ${body ? body.replace(/<[^>]*>?/gm, '').substring(0, 30) : ''}...`,
            body: body || '',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            unread: 0,
            hasAttachments: attachments && attachments.length > 0 ? 1 : 0,
            attachments: JSON.stringify(attachments || []), // Guardamos JSON en BD
            securityAnalysis: JSON.stringify({ status: "clean" })
        };

        db.query(sql, emailData, (err) => {
            if (err) throw err;
            res.json({ success: true });
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- SINCRONIZACIÓN IMAP MEJORADA ---
async function syncGmailInbox() {
    const config = {
        imap: { user: GMAIL_USER, password: GMAIL_PASS, host: 'imap.gmail.com', port: 993, tls: true, tlsOptions: { rejectUnauthorized: false } }
    };
    try {
        const connection = await imap.connect(config);
        await connection.openBox('INBOX');
        // Traemos los últimos 10 mensajes (leídos o no) para asegurar recepción
        const searchCriteria = [['1:10']]; 
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: false };
        const messages = await connection.search(searchCriteria, fetchOptions);

        for (const item of messages) {
            const all = item.parts.find(part => part.which === 'TEXT');
            if (all) {
                const parsed = await simpleParser(all.body);
                const sender = parsed.from ? parsed.from.text : "Desconocido";
                const subject = parsed.subject || "(Sin Asunto)";
                
                // Evitar duplicados simples (Verifica si ya existe este correo hoy)
                const checkSql = "SELECT id FROM emails WHERE subject = ? AND sender = ? AND date > DATE_SUB(NOW(), INTERVAL 1 DAY) LIMIT 1";
                
                db.query(checkSql, [subject, sender], (err, exists) => {
                    if (!exists || exists.length === 0) {
                        const newEmail = {
                            folder: 'inbox',
                            sender: sender,
                            subject: subject,
                            preview: parsed.text ? parsed.text.substring(0, 60) : "...",
                            body: parsed.html || parsed.textAsHtml || "",
                            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                            unread: 1,
                            hasAttachments: parsed.attachments.length > 0 ? 1 : 0
                        };
                        db.query(`INSERT INTO emails SET ?`, newEmail, (e) => {
                            if(!e) console.log(`📥 Recibido: ${subject}`);
                        });
                    }
                });
            }
        }
        connection.end();
    } catch (err) { if(err.message !== 'Nothing to fetch') console.log("IMAP:", err.message); }
}

// Revisar cada 20 segundos
setInterval(syncGmailInbox, 20000);

app.listen(3001, () => console.log('🚀 Servidor Listo'));