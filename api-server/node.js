const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const imap = require('imap-simple');
const { simpleParser } = require('mailparser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==========================================
// 1. TUS CREDENCIALES (¡EDITA ESTO!)
// ==========================================
const GMAIL_USER = 'mcskipper16@gmail.com'; 
const GMAIL_PASS = 'vzok rdpj syjt fjut'; // TU CONTRASEÑA DE APLICACIÓN

// ==========================================
// 2. CONEXIÓN BASE DE DATOS
// ==========================================
const db = mysql.createConnection({
    host: 'localhost',
    port: 3307, // Tu puerto
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
// REEMPLAZA SOLO LA PARTE DEL app.post('/emails'...) EN TU SERVER.JS

// --- ENVIAR / GUARDAR EMAIL (CON CC y BCC) ---
app.post('/emails', async (req, res) => {
    const { to, cc, bcc, subject, body, preview, isDraft } = req.body; // <--- Aceptamos cc y bcc

    // Validación
    let finalTo = to;
    if (!finalTo && preview && preview.startsWith("Para:")) {
        finalTo = preview.split(" - ")[0].replace("Para: ", "").trim();
    }

    if (!isDraft && !finalTo) return res.status(400).send("Falta destinatario");

    try {
        let folder = 'sent';
        
        if (!isDraft) {
            // Configuración para Nodemailer (Gmail)
            const mailOptions = {
                from: GMAIL_USER,
                to: finalTo,
                subject: subject,
                text: body,
                html: `<p>${body}</p>`
            };

            // Solo agregamos si existen
            if (cc) mailOptions.cc = cc;
            if (bcc) mailOptions.bcc = bcc;

            await transporter.sendMail(mailOptions);
            console.log(`📨 Enviado a ${finalTo} (Cc: ${cc || 'none'}, Bcc: ${bcc || 'none'})`);
        } else {
            folder = 'drafts';
            console.log(`💾 Guardado en borradores`);
        }

        // Guardar en MySQL
        const sql = `INSERT INTO emails SET ?`;
        const emailData = {
            folder: folder,
            sender: isDraft ? 'Borrador' : 'Yo',
            subject: subject || '(Sin Asunto)',
            // Guardamos To, Cc y Bcc en el preview o en columnas nuevas si las creaste
            preview: `Para: ${finalTo} - ${body ? body.substring(0, 30) : ''}...`,
            body: body || '',
            date: new Date().toLocaleDateString(),
            unread: 0,
            hasAttachments: 0,
            securityAnalysis: JSON.stringify({ status: "clean" }),
            // Si creaste las columnas en el PASO 1, descomenta estas lineas:
            recipient_cc: cc || '',
            recipient_bcc: bcc || ''
        };

        db.query(sql, emailData, (err, result) => {
            if (err) {
                console.error("Error SQL:", err); 
                // Si falla por columnas faltantes, intentamos guardar sin ellas
                delete emailData.recipient_cc;
                delete emailData.recipient_bcc;
                db.query(sql, emailData, (err2, res2) => {
                    if(err2) throw err2;
                    res.json({ success: true });
                });
            } else {
                res.json({ success: true });
            }
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- OBTENER CONTACTOS (NUEVO) ---
app.get('/contacts', (req, res) => {
    db.query('SELECT * FROM contacts ORDER BY name ASC', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// --- ENVIAR / GUARDAR EMAIL ---
app.post('/emails', async (req, res) => {
    const { to, subject, body, preview, isDraft } = req.body;
    let finalTo = to;
    if (!finalTo && preview && preview.startsWith("Para:")) {
        finalTo = preview.split(" - ")[0].replace("Para: ", "").trim();
    }

    if (!isDraft && !finalTo) return res.status(400).send("Falta destinatario");

    try {
        let folder = 'sent';
        if (!isDraft) {
            await transporter.sendMail({ from: GMAIL_USER, to: finalTo, subject, text: body, html: `<p>${body}</p>` });
            console.log(`📨 Enviado a ${finalTo}`);
        } else {
            folder = 'drafts';
            console.log(`💾 Guardado en borradores`);
        }

        const sql = `INSERT INTO emails SET ?`;
        const emailData = {
            folder: folder,
            sender: isDraft ? 'Borrador' : 'Yo',
            subject: subject || '(Sin Asunto)',
            preview: `Para: ${finalTo || '?'} - ${body ? body.substring(0, 30) : ''}...`,
            body: body || '',
            date: new Date().toLocaleDateString(),
            unread: 0,
            hasAttachments: 0,
            securityAnalysis: JSON.stringify({ status: "clean" })
        };

        db.query(sql, emailData, (err, result) => {
            if (err) throw err;
            res.json({ success: true });
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// RUTA DE LOGIN (NUEVA)
// ==========================================
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Consulta simple (Advertencia: En producción usa hash para passwords)
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: "Error de servidor" });

        if (results.length > 0) {
            // Usuario encontrado
            const user = results[0];
            res.json({ 
                success: true, 
                user: { id: user.id, name: user.name, email: user.email },
                token: "fake-jwt-token-" + Date.now() // Token simulado
            });
        } else {
            // Credenciales incorrectas
            res.status(401).json({ success: false, message: "Credenciales incorrectas" });
        }
    });
});

// --- FUNCIÓN IMAP ---
async function syncGmailInbox() {
    const config = {
        imap: { user: GMAIL_USER, password: GMAIL_PASS, host: 'imap.gmail.com', port: 993, tls: true, authTimeout: 5000, tlsOptions: { rejectUnauthorized: false } }
    };
    try {
        const connection = await imap.connect(config);
        await connection.openBox('INBOX');
        const messages = await connection.search(['UNSEEN'], { bodies: ['HEADER', 'TEXT'], markSeen: true });
        for (const item of messages) {
            const all = item.parts.find(part => part.which === 'TEXT');
            if (all) {
                const parsed = await simpleParser(all.body);
                const newEmail = {
                    folder: 'inbox',
                    sender: parsed.from ? parsed.from.text : "Desconocido",
                    subject: parsed.subject || "(Sin Asunto)",
                    preview: parsed.text ? parsed.text.substring(0, 50) + "..." : "...",
                    body: parsed.text || parsed.html || "",
                    date: new Date().toLocaleDateString(),
                    unread: 1,
                    hasAttachments: parsed.attachments.length > 0 ? 1 : 0,
                    securityAnalysis: JSON.stringify({ status: "clean" })
                };
                db.query(`INSERT INTO emails SET ?`, newEmail, (err) => {});
            }
        }
        connection.end();
    } catch (err) { console.log("Info IMAP:", err.message); }
}

app.listen(3001, () => console.log('🚀 Servidor listo con Contactos'));