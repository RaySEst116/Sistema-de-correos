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
const GEN_AI_KEY = 'TU_API_KEY_NUEVA_AQUI'; 
const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const GMAIL_USER = 'mcskipper16@gmail.com'; 
const GMAIL_PASS = 'vzok rdpj syjt fjut'; 

const dbConfig = {
    host: 'localhost', port: 3307, user: 'root', password: '1234', database: 'alhmail_security',
    waitForConnections: true, connectionLimit: 10, queueLimit: 0
};
const db = mysql.createPool(dbConfig); 

// Verificar conexión
db.getConnection().then(c => { console.log('✅ BD Pool Activo'); c.release(); }).catch(e => console.error(e));
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });

// ==========================================
// 🛡️ MOTOR DE SEGURIDAD HEURÍSTICO
// ==========================================
async function analyzeEmailSecurity(sender, subject, body, attachments) {
    let score = 0;
    let threats = [];
    let status = "clean"; 
    let folder = "inbox"; // Por defecto a entrada

    // 1. VERIFICAR LISTAS EN SQL
    // Extraemos solo el email si viene como "Nombre <email>"
    const cleanSender = sender.includes('<') ? sender.match(/<([^>]+)>/)[1] : sender;
    
    const [rules] = await db.query("SELECT type FROM email_rules WHERE email = ?", [cleanSender]);
    
    if (rules.length > 0) {
        if (rules[0].type === 'block') {
            return { score: 100, threats: ["Remitente en Lista Negra (SQL)"], status: "blocked", folder: "spam" };
        }
        if (rules[0].type === 'allow') {
            return { score: 0, threats: ["Remitente en Lista Blanca (SQL)"], status: "verified", folder: "inbox" };
        }
    }

    // 2. ESCANEO DE CONTENIDO (Palabras clave)
    const content = (subject + " " + body).toLowerCase();
    const spamKeywords = ['ganaste', 'urgente', 'lotería', 'hacked', 'bitcoin', 'herencia', 'verify your account', 'premio'];
    
    spamKeywords.forEach(word => {
        if (content.includes(word)) {
            score += 25;
            threats.push(`Palabra sospechosa: '${word}'`);
        }
    });

    // 3. ESCANEO DE ADJUNTOS (Extensiones Peligrosas)
    const dangerousExts = ['.exe', '.bat', '.sh', '.js', '.vbs', '.scr', '.jar', '.cmd'];
    if (attachments && Array.isArray(attachments)) {
        attachments.forEach(file => {
            const fname = file.filename || file.fileName || "";
            if (fname) {
                const ext = fname.slice(((fname.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
                if (dangerousExts.includes('.' + ext)) {
                    score += 100; 
                    threats.push(`Archivo ejecutable detectado: ${fname}`);
                }
            }
        });
    }

    // 4. EVALUACIÓN FINAL
    if (score >= 100) {
        status = "infected";
        folder = "spam";
    } else if (score >= 25) {
        status = "suspicious";
        folder = "spam";
    }

    return { score, threats, status, folder };
}

// ================= RUTAS =================

// ENVIAR CORREO (CON ANÁLISIS)
app.post('/emails', async (req, res) => {
    const { from, to, cc, bcc, subject, body, isDraft, attachments, idToDelete } = req.body;
    
    let connection;
    try {
        connection = await db.getConnection(); 
        await connection.beginTransaction();

        if (idToDelete) await connection.query('DELETE FROM emails WHERE id = ?', [idToDelete]);

        const dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const cleanBody = body || '';
        const previewText = cleanBody.replace(/<[^>]*>?/gm, '').substring(0, 50) + '...';
        const attachStr = JSON.stringify(attachments || []);
        const hasAttach = attachments && attachments.length > 0 ? 1 : 0;

        // A. REMITENTE (Sin análisis, es saliente)
        await connection.query('INSERT INTO emails SET ?', {
            owner_email: from, folder: isDraft ? 'drafts' : 'sent', sender: 'Yo', to_address: to, 
            subject: subject || '(Sin Asunto)', preview: `Para: ${to} - ${previewText}`, body: cleanBody,
            date: dateNow, unread: 0, hasAttachments: hasAttach, attachments: attachStr,
            securityAnalysis: JSON.stringify({ status: "clean", score: 0, threats: [] })
        });

        if (!isDraft && to) {
            // --- EJECUTAR ESCÁNER DE SEGURIDAD ---
            const securityReport = await analyzeEmailSecurity(from, subject, cleanBody, attachments);
            console.log(`🛡️ Análisis para ${to}: ${securityReport.status} (Score: ${securityReport.score})`);

            // B. DESTINATARIO
            const [users] = await connection.query("SELECT email FROM users WHERE email = ?", [to]);
            
            if (users.length > 0) {
                // ENTREGA INTERNA (Usando la carpeta que decidió el escáner)
                await connection.query('INSERT INTO emails SET ?', {
                    owner_email: to, 
                    folder: securityReport.folder, // Puede ir a SPAM o INBOX
                    sender: from,
                    to_address: 'Mí',
                    // Si es virus, avisamos en el asunto
                    subject: securityReport.status === 'infected' ? `[PELIGRO] ${subject}` : subject,
                    preview: previewText,
                    body: cleanBody,
                    date: dateNow,
                    unread: 1,
                    hasAttachments: hasAttach,
                    attachments: attachStr,
                    securityAnalysis: JSON.stringify(securityReport) // Guardamos el reporte
                });
            } else {
                // EXTERNO (Intentar enviar aunque sea spam, o bloquearlo si prefieres)
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

// IA DRAFT
app.post('/ai/draft', async (req, res) => {
    const { prompt, subject } = req.body;
    try {
        const result = await model.generateContent(`Escribe correo HTML. Asunto: ${subject}. Prompt: ${prompt}.`);
        res.json({ success: true, text: (await result.response).text() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// LEER EMAILS
app.get('/emails', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM emails WHERE owner_email = ? ORDER BY date DESC, id DESC', [req.query.userEmail]);
        const parsed = rows.map(r => ({
            ...r, 
            unread: !!r.unread, 
            hasAttachments: !!r.hasAttachments, 
            attachments: JSON.parse(r.attachments||'[]'),
            // Parseamos el reporte de seguridad
            securityAnalysis: r.securityAnalysis ? JSON.parse(r.securityAnalysis) : { status: 'clean', score: 0, threats: [] }
        }));
        res.json(parsed);
    } catch (e) { res.status(500).send(e.message); }
});

// POP3 CLEANUP
app.post('/emails/downloaded', async (req, res) => {
    if (!req.body.ids || !req.body.ids.length) return res.json({success:true});
    try { await db.query(`DELETE FROM emails WHERE id IN (${req.body.ids.map(()=>'?').join(',')})`, req.body.ids); res.json({success:true}); } catch(e){res.status(500).send(e.message);}
});

// BASIC CRUD (Login, Users, etc - Igual que antes)
app.post('/login', async (req, res) => { try { const [r] = await db.query("SELECT * FROM users WHERE email=? AND password=?", [req.body.email, req.body.password]); r.length ? res.json({success:true, user:r[0]}) : res.status(401).send(); } catch(e){res.status(500).send();} });
app.get('/contacts', async (req, res) => { try { const [r] = await db.query('SELECT * FROM contacts'); res.json(r); } catch(e){} });
app.get('/users', async (req, res) => { try { const [r] = await db.query('SELECT id, name, email, role FROM users'); res.json(r); } catch(e){} });
app.post('/users', async (req, res) => { try { await db.query("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)", [req.body.name, req.body.email, req.body.password, req.body.role]); res.json({success:true}); } catch(e){res.status(500).send(e.message);} });
app.put('/users/:id', async (req, res) => { try { await db.query("UPDATE users SET name=?, role=? WHERE id=?", [req.body.name, req.body.role, req.params.id]); res.json({success:true}); } catch(e){} });
app.delete('/users/:id', async (req, res) => { try { await db.query('DELETE FROM users WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e){} });
app.delete('/emails/:id', async (req, res) => { try { await db.query('DELETE FROM emails WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e){} });
app.put('/emails/:id', async (req, res) => { try { await db.query('UPDATE emails SET unread=? WHERE id=?', [req.body.unread, req.params.id]); res.json({success:true}); } catch(e){} });

// SYNC GMAIL (CON ANÁLISIS)
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
                const sender = parsed.from?.text || "Desconocido";
                const subject = parsed.subject || "(Sin Asunto)";
                const [exists] = await db.query("SELECT id FROM emails WHERE owner_email = ? AND subject = ? AND sender = ? AND date > DATE_SUB(NOW(), INTERVAL 1 DAY) LIMIT 1", [GMAIL_USER, subject, sender]);
                
                if (exists.length === 0) {
                    // Analizar correo entrante externo
                    const report = await analyzeEmailSecurity(sender, subject, parsed.text||"", []);
                    
                    await db.query(`INSERT INTO emails SET ?`, {
                        owner_email: GMAIL_USER, folder: report.folder, sender, 
                        subject: report.status === 'infected' ? `[VIRUS] ${subject}` : subject,
                        preview: (parsed.text||"").substring(0,60), body: parsed.html||parsed.textAsHtml||"",
                        date: new Date().toISOString().slice(0,19).replace('T',' '), unread: 1, hasAttachments: 0, attachments: '[]',
                        securityAnalysis: JSON.stringify(report)
                    });
                    console.log(`📥 IMAP: ${subject} -> [${report.status}]`);
                }
            }
        }
        connection.end();
    } catch (e) { if(e.message !== 'Nothing to fetch') console.log("IMAP:", e.message); }
}
setInterval(syncGmailInbox, 20000);
app.listen(3001, () => console.log('🚀 Servidor Listo (Security Engine Active)'));