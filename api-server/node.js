const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const imap = require('imap-simple');
const { simpleParser } = require('mailparser');

const app = express();
app.use(cors());

// --- AUMENTAR LÍMITE DE TAMAÑO (Para recibir archivos) ---
// Esto es vital para que no falle al subir fotos/videos
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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
    port: 3307, 
    user: 'root',
    password: '1234', 
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
app.get('/emails', async (req, res) => {
    try {
        await syncGmailInbox();
        db.query('SELECT * FROM emails ORDER BY id DESC', (err, results) => {
            if (err) return res.status(500).send(err);
            const parsed = results.map(row => {
                let analysis = {};
                try {
                    if (typeof row.securityAnalysis === 'string' && !row.securityAnalysis.includes('[object')) {
                        analysis = JSON.parse(row.securityAnalysis);
                    }
                } catch (e) {}
                return { ...row, unread: Boolean(row.unread), hasAttachments: Boolean(row.hasAttachments), securityAnalysis: analysis };
            });
            res.json(parsed);
        });
    } catch (error) { res.status(500).send("Error"); }
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
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: "Error de servidor" });
        if (results.length > 0) {
            const user = results[0];
            res.json({ success: true, user: { id: user.id, name: user.name, email: user.email }, token: "fake-jwt-" + Date.now() });
        } else {
            res.status(401).json({ success: false, message: "Credenciales incorrectas" });
        }
    });
});

// --- ENVIAR / GUARDAR EMAIL (CON ADJUNTOS) ---
app.post('/emails', async (req, res) => {
    // AQUI ES DONDE RECIBIMOS 'attachments'
    const { to, cc, bcc, subject, body, preview, isDraft, attachments } = req.body; 

    let finalTo = to;
    if (!finalTo && preview && preview.startsWith("Para:")) {
        finalTo = preview.split(" - ")[0].replace("Para: ", "").trim();
    }

    if (!isDraft && !finalTo) return res.status(400).send("Falta destinatario");

    try {
        let folder = 'sent';
        
        if (!isDraft) {
            const mailOptions = {
                from: GMAIL_USER,
                to: finalTo,
                subject: subject,
                text: body,
                html: `<p>${body}</p>`,
                attachments: attachments // <--- PASAMOS LOS ARCHIVOS A GMAIL
            };

            if (cc) mailOptions.cc = cc;
            if (bcc) mailOptions.bcc = bcc;

            await transporter.sendMail(mailOptions);
            console.log(`📨 Enviado a ${finalTo} con ${attachments ? attachments.length : 0} archivos.`);
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
            preview: `Para: ${finalTo} - ${body ? body.substring(0, 30) : ''}...`,
            body: body || '',
            date: new Date().toLocaleDateString(),
            unread: 0,
            hasAttachments: attachments && attachments.length > 0 ? 1 : 0,
            securityAnalysis: JSON.stringify({ status: "clean" }),
            // Si tienes las columnas cc/bcc en la BD descomenta esto:
            // recipient_cc: cc || '',
            // recipient_bcc: bcc || ''
        };

        db.query(sql, emailData, (err, result) => {
            if (err) {
                // Fallback si no existen columnas cc/bcc
                delete emailData.recipient_cc;
                delete emailData.recipient_bcc;
                db.query(sql, emailData, (e, r) => { if(e) throw e; res.json({ success: true }); });
            } else {
                res.json({ success: true });
            }
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
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

// = NUEVA RUTA: ACTUALIZAR PERFIL (PUT) =
app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, password } = req.body;

    // Si envía password, actualizamos todo, si no, solo el nombre
    let sql = "UPDATE users SET name = ? WHERE id = ?";
    let params = [name, userId];

    if (password && password.trim() !== "") {
        sql = "UPDATE users SET name = ?, password = ? WHERE id = ?";
        params = [name, password, userId];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: "Error al actualizar" });
        res.json({ success: true });
    });
});

// ==========================================
// RECUPERAR CONTRASEÑA (NUEVA RUTA)
// ==========================================
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Falta el correo" });

    // 1. Verificar si el usuario existe
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ message: "Error de base de datos" });

        if (results.length === 0) {
            return res.status(404).json({ message: "Este correo no está registrado." });
        }

        // 2. Generar contraseña temporal (8 caracteres aleatorios)
        const tempPassword = Math.random().toString(36).slice(-8);

        // 3. Actualizar la contraseña en la Base de Datos
        // NOTA: En un sistema real, aquí deberíamos encriptar la contraseña (hash)
        db.query('UPDATE users SET password = ? WHERE email = ?', [tempPassword, email], async (updateErr) => {
            if (updateErr) return res.status(500).json({ message: "No se pudo actualizar la contraseña" });

            // 4. Enviar el correo con la nueva contraseña
            try {
                await transporter.sendMail({
                    from: `"Soporte Alhmail" <${GMAIL_USER}>`,
                    to: email,
                    subject: 'Recuperación de Contraseña - Alhmail',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; max-width: 500px;">
                            <h2 style="color: #D50032;">Restablecimiento de Contraseña</h2>
                            <p>Hola,</p>
                            <p>Hemos recibido una solicitud para recuperar tu acceso.</p>
                            <p>Tu nueva contraseña temporal es:</p>
                            <h1 style="background: #f3f4f6; padding: 10px; text-align: center; letter-spacing: 2px;">${tempPassword}</h1>
                            <p>Por favor ingresa con esta clave.</p>
                            <hr>
                            <small style="color: #888;">Si no solicitaste esto, ignora este correo.</small>
                        </div>
                    `
                });

                res.json({ success: true, message: "Correo enviado con la nueva contraseña." });

            } catch (mailError) {
                console.error("Error enviando correo:", mailError);
                res.status(500).json({ message: "Error al enviar el correo." });
            }
        });
    });
});

app.listen(3001, () => console.log('🚀 Servidor Listo (Con soporte de Archivos Grandes)'));