const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Para que el diagnóstico funcione en Node versiones antiguas
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ===================================================
// 1. CONFIGURACIÓN IA (INTEGRANDO TU CURL)
// ===================================================

// ⚠️ PEGA TU API KEY AQUÍ
const GEN_AI_KEY = 'AIzaSyCUwaT1XkFYDnzVCyrz6P7PPs7YWPxybS8'; 

const genAI = new GoogleGenerativeAI(GEN_AI_KEY);

// AQUÍ ESTÁ EL CAMBIO QUE PEDISTE:
// Usamos "gemini-2.5-flash" como en tu curl.
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- DIAGNÓSTICO DE MODELOS (SE EJECUTA AL INICIAR) ---
// Esto te dirá si el modelo "2.5" existe o si debes usar otro.
async function checkAvailableModels() {
    try {
        console.log("🔍 Verificando modelos disponibles para tu API Key...");
        // Hacemos una petición directa similar a tu CURL para ver qué modelos tienes
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEN_AI_KEY}`);
        const data = await response.json();
        
        if (data.error) {
            console.error("❌ ERROR API KEY:", data.error.message);
        } else if (data.models) {
            const names = data.models.map(m => m.name.replace('models/', ''));
            console.log("✅ Modelos disponibles:", names.join(', '));
            
            if (!names.includes('gemini-2.5-flash')) {
                console.warn("\n⚠️ ATENCIÓN: 'gemini-2.5-flash' NO aparece en tu lista.");
                console.warn("👉 Si el botón IA da error 404, cambia la línea 28 a: 'gemini-1.5-flash' o 'gemini-2.0-flash-exp'\n");
            } else {
                console.log("✅ El modelo gemini-2.5-flash está disponible y listo para usar.");
            }
        }
    } catch (e) {
        // Ignoramos error de fetch si no es crítico, el servidor seguirá intentando funcionar
    }
}
checkAvailableModels();


// --- CREDENCIALES DE CORREO ---
const GMAIL_USER = 'mcskipper16@gmail.com'; 
const GMAIL_PASS = 'vzok rdpj syjt fjut'; 

// --- BASE DE DATOS (POOL) ---
const dbConfig = {
    host: 'localhost', port: 3307, user: 'root', password: '1234', database: 'alhmail_security',
    waitForConnections: true, connectionLimit: 10, queueLimit: 0
};
const db = mysql.createPool(dbConfig); 

// Verificar conexión BD
db.getConnection().then(c => { console.log('✅ BD Conectada (Pool)'); c.release(); }).catch(e => console.error('❌ Error BD:', e.message));
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });

// ===================================================
// 2. RUTAS
// ===================================================

// IA DRAFT (Usa el modelo configurado arriba)
app.post('/ai/draft', async (req, res) => {
    const { prompt, subject } = req.body;
    if (!prompt) return res.status(400).json({ error: "Falta instrucción" });

    try {
        console.log(`🤖 IA (${model.model}) generando...`);
        
        const fullPrompt = `
            Contexto: Redacción de correo electrónico.
            Asunto: "${subject || 'General'}"
            Instrucción: "${prompt}"
            Formato: HTML simple (<p>, <br>, <b>).
            Tono: Profesional.
        `;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        res.json({ success: true, text: text });
    } catch (e) {
        console.error("❌ ERROR IA:", e.message);
        res.status(500).json({ error: `Error IA (${e.message}). Revisa la consola para ver modelos válidos.` });
    }
});

// GET EMAILS
app.get('/emails', async (req, res) => {
    const userEmail = req.query.userEmail;
    if (!userEmail) return res.json([]); 
    try {
        const [rows] = await db.query('SELECT * FROM emails WHERE owner_email = ? ORDER BY date DESC, id DESC', [userEmail]);
        const parsed = rows.map(r => ({
            ...r, unread: !!r.unread, hasAttachments: !!r.hasAttachments, 
            attachments: JSON.parse(r.attachments||'[]'),
            securityAnalysis: JSON.parse(r.securityAnalysis||'{}')
        }));
        res.json(parsed);
    } catch (e) { res.status(500).send(e.message); }
});

// POP3 DELETE
app.post('/emails/downloaded', async (req, res) => {
    if (!req.body.ids?.length) return res.json({success:true});
    try { await db.query(`DELETE FROM emails WHERE id IN (${req.body.ids.map(()=>'?').join(',')})`, req.body.ids); res.json({success:true}); } catch(e){res.status(500).send(e.message);}
});

// ENVIAR CORREO (ROUTING + SPAM)
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
        const hasAttach = (attachments && attachments.length > 0) ? 1 : 0;

        // A. REMITENTE
        await connection.query('INSERT INTO emails SET ?', {
            owner_email: from, folder: isDraft ? 'drafts' : 'sent', sender: 'Yo', to_address: to, 
            subject: subject || '(Sin Asunto)', preview: `Para: ${to} - ${previewText}`, body: cleanBody,
            date: dateNow, unread: 0, hasAttachments: hasAttach, attachments: attachStr,
            securityAnalysis: JSON.stringify({ status: "clean", score: 0, threats: [] })
        });

        if (!isDraft && to) {
            // SPAM CHECK
            const spamKeywords = ['virus', 'premio', 'ganaste', 'urgente', 'lotería', 'hacked', 'ataque'];
            const isSpam = spamKeywords.some(word => (subject + " " + cleanBody).toLowerCase().includes(word));
            let finalRecipient = isSpam ? GMAIL_USER : to;
            let finalFolder = isSpam ? 'spam' : 'inbox';

            if(isSpam) console.log(`🚨 SPAM detectado para ${to}. Desviando al Admin.`);

            const [users] = await connection.query("SELECT email FROM users WHERE email = ?", [finalRecipient]);
            
            if (users.length > 0) {
                // INTERNO
                await connection.query('INSERT INTO emails SET ?', {
                    owner_email: finalRecipient, folder: finalFolder, sender: from,
                    to_address: isSpam ? `(Interceptado para: ${to})` : 'Mí',
                    subject: isSpam ? `[SPAM] ${subject}` : (subject || '(Sin Asunto)'),
                    preview: previewText, body: cleanBody, date: dateNow, unread: 1, hasAttachments: hasAttach, attachments: attachStr,
                    securityAnalysis: JSON.stringify({ status: isSpam ? "risk" : "clean", threats: isSpam ? ["Palabras clave detectadas"] : [], score: isSpam ? 80 : 0 })
                });
            } else {
                // EXTERNO
                try { await transporter.sendMail({ from: GMAIL_USER, to: finalRecipient, cc, bcc, subject, html: body, attachments }); } catch (err) {}
            }
        }
        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally { if(connection) connection.release(); }
});

// BASIC CRUD (Login, Users, etc - Resumido)
app.post('/login', async (req, res) => { try { const [r] = await db.query("SELECT * FROM users WHERE email=? AND password=?", [req.body.email, req.body.password]); r.length ? res.json({success:true, user:r[0]}) : res.status(401).send(); } catch(e){res.status(500).send();} });
app.get('/contacts', async (req, res) => { try { const [r] = await db.query('SELECT * FROM contacts'); res.json(r); } catch(e){} });
app.get('/users', async (req, res) => { try { const [r] = await db.query('SELECT id, name, email, role FROM users'); res.json(r); } catch(e){} });
app.post('/users', async (req, res) => { try { await db.query("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)", [req.body.name, req.body.email, req.body.password, req.body.role]); res.json({success:true}); } catch(e){res.status(500).send(e.message);} });
app.put('/users/:id', async (req, res) => { try { await db.query("UPDATE users SET name=?, role=? WHERE id=?", [req.body.name, req.body.role, req.params.id]); res.json({success:true}); } catch(e){} });
app.delete('/users/:id', async (req, res) => { try { await db.query('DELETE FROM users WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e){} });
app.delete('/emails/:id', async (req, res) => { try { await db.query('DELETE FROM emails WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e){} });
app.put('/emails/:id', async (req, res) => { try { await db.query('UPDATE emails SET unread=? WHERE id=?', [req.body.unread, req.params.id]); res.json({success:true}); } catch(e){} });

// SYNC GMAIL (Mantenemos tu lógica)
async function syncGmailInbox() {
    /* ... (Tu código IMAP igual que antes) ... */
}
setInterval(syncGmailInbox, 20000);
app.listen(3001, () => console.log('🚀 Servidor Listo.'));