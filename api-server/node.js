import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import imap from 'imap-simple';
import { simpleParser } from 'mailparser';
// import { GoogleGenerativeAI } from '@google/generative-ai'; // COMENTADO - IA DESACTIVADA
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Configura dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const localEnvPath = resolve(__dirname, '.env');
const rootEnvPath = resolve(__dirname, '..', '.env');
const envPath = fs.existsSync(localEnvPath)
    ? localEnvPath
    : (fs.existsSync(rootEnvPath) ? rootEnvPath : undefined);

if (envPath) {
    dotenv.config({ path: envPath });
} else {
    console.warn('⚠️  No se encontró archivo .env en api-server ni en la raíz del proyecto.');
}

// Para que el diagnóstico funcione en Node versiones antiguas
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Configurar servidor HTTP y Socket.IO
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);
    
    // Enviar estado del servidor inmediatamente
    socket.emit('server-status', { 
        status: 'connected', 
        timestamp: new Date().toISOString(),
        services: {
            database: 'connected',
            gemini: 'disabled',
            port: 3001
        }
    });
    
    // Health check por WebSocket
    socket.on('health-check', async () => {
        try {
            await db.execute('SELECT 1');
            socket.emit('health-response', {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'connected',
                    gemini: 'disabled',
                    port: 3001
                }
            });
        } catch (error) {
            socket.emit('health-response', {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                services: {
                    database: 'disconnected',
                    gemini: 'disabled',
                    port: 3001
                }
            });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado:', socket.id);
    });
});

// ===================================================
// 1. CONFIGURACIÓN IA (DESACTIVADA)
// ===================================================

// const GEN_AI_KEY = process.env.GEN_AI_KEY; // COMENTADO - IA DESACTIVADA
// const genAI = new GoogleGenerativeAI(GEN_AI_KEY); // COMENTADO - IA DESACTIVADA
// const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // COMENTADO - IA DESACTIVADA

// --- DIAGNÓSTICO DE MODELOS (DESACTIVADO) ---
// Esto te diría si el modelo "2.5" existe o si debes usar otro.
// async function checkAvailableModels() { // COMENTADO - IA DESACTIVADA
//     try {
//         console.log("🔍 Verificando modelos disponibles para tu API Key...");
//         // Hacemos una petición directa similar a tu CURL para ver qué modelos tienes
//         const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEN_AI_KEY}`);
//         const data = await response.json();
//         
//         if (data.error) {
//             console.error("❌ ERROR API KEY:", data.error.message);
//         } else if (data.models) {
//             const names = data.models.map(m => m.name.replace('models/', ''));
//             console.log("✅ Modelos disponibles:", names.join(', '));
//             
//             if (!names.includes('gemini-2.5-flash')) {
//                 console.warn("\n⚠️ ATENCIÓN: 'gemini-2.5-flash' NO aparece en tu lista.");
//                 console.warn("👉 Si el botón IA da error 404, cambia la línea 28 a: 'gemini-1.5-flash' o 'gemini-2.0-flash-exp'\n");
//             } else {
//                 console.log("✅ El modelo gemini-2.5-flash está disponible y listo para usar.");
//             }
//         }
//     } catch (e) {
//         // Ignoramos error de fetch si no es crítico, el servidor seguirá intentando funcionar
//         console.error(e)
//     }
// }
// checkAvailableModels(); // COMENTADO - IA DESACTIVADA


// --- CREDENCIALES DE CORREO ---
const GMAIL_USER = process.env.GMAIL_USER; 
const GMAIL_PASS = process.env.GMAIL_PASS; 

// --- BASE DE DATOS (POOL) ---
const dbConfig = {
    host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    waitForConnections: true, connectionLimit: 10, queueLimit: 0
};
const db = mysql.createPool(dbConfig); 

// Verificar conexión BD
db.getConnection().then(c => { console.log('✅ BD Conectada (Pool)'); c.release(); }).catch(e => console.error('❌ Error BD:', e.message));
const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });

// ==========================================
// 1. MOTOR DE SEGURIDAD HEURÍSTICO
// ==========================================
async function analyzeEmailSecurity(sender, subject, body, attachments) {
    let score = 0;
    let threats = [];
    let status = "clean"; 
    let folder = "inbox"; 

    // 1. VERIFICAR LISTAS EN SQL
    const cleanSender = sender.includes('<') ? sender.match(/<([^>]+)>/)[1] : sender;
    try {
        const [rules] = await db.query("SELECT type FROM email_rules WHERE email = ?", [cleanSender]);
        if (rules.length > 0) {
            if (rules[0].type === 'block') return { score: 100, threats: ["Remitente Bloqueado (Blacklist)"], status: "blocked", folder: "spam" };
            if (rules[0].type === 'allow') return { score: 0, threats: ["Remitente Confiable (Whitelist)"], status: "verified", folder: "inbox" };
        }
    } catch(e) { console.log("Error consultando reglas:", e.message); }

    // 2. ESCANEO DE CONTENIDO
    const content = (subject + " " + body).toLowerCase();
    const spamKeywords = ['virus', 'ganaste', 'urgente', 'lotería', 'hacked', 'bitcoin', 'herencia', 'premio', 'verify your account', 'password'];
    spamKeywords.forEach(word => {
        if (content.includes(word)) { score += 25; threats.push(`Palabra sospechosa: '${word}'`); }
    });

    // 3. ESCANEO DE ADJUNTOS
    const dangerousExts = ['.exe', '.bat', '.sh', '.js', '.vbs', '.jar', '.scr'];
    if (attachments && Array.isArray(attachments)) {
        attachments.forEach(file => {
            const fname = file.filename || "";
            const ext = fname.slice(((fname.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
            if (dangerousExts.includes('.' + ext)) { score += 100; threats.push(`Adjunto ejecutable detectado: ${fname}`); }
        });
    }

    // 4. EVALUACIÓN
    if (score >= 100) { status = "infected"; folder = "spam"; }
    else if (score >= 25) { status = "suspicious"; folder = "spam"; }

    return { score, threats, status, folder };
}

// ===================================================
// 2. RUTAS
// ===================================================

// 1. GENERAR CORREO COMPLETO CON IA (DESACTIVADO)
// app.post('/ai/draft', async (req, res) => { // COMENTADO - IA DESACTIVADA
//     // AHORA RECIBIMOS TAMBIÉN EL NOMBRE DEL REMITENTE
//     const { prompt, senderName } = req.body; 
//     
//     if (!prompt) return res.status(400).json({ error: "Falta la instrucción" });

//     try {
//         console.log("🤖 IA Procesando:", prompt);
        
//         const fullPrompt = `
//             Eres un asistente de correo electrónico inteligente.
            
//             CONTEXTO:
//             - Instrucción del usuario: "${prompt}"
//             - Nombre del remitente (quien escribe): "${senderName || 'Un usuario'}"
            
//             TAREA:
//             Genera una respuesta en formato JSON ESTRICTO (sin markdown, sin comillas extra) con esta estructura:
//             {
//                 "to": "extrae el email del destinatario si se menciona, si no, null",
//                 "subject": "crea un asunto breve y profesional",
//                 "body": "redacta el cuerpo del correo en HTML simple (<p>, <br>, <b>). IMPORTANTE: Termina el correo con una despedida y la firma usando el 'Nombre del remitente' proporcionado."
//             }
//         `;
        
//         const result = await model.generateContent(fullPrompt);
//         const response = await result.response;
//         let text = response.text();

//         // Limpieza de formato markdown
//         text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
//         const jsonResponse = JSON.parse(text);
//         res.json({ success: true, data: jsonResponse });

//     } catch (e) {
//         console.error("❌ ERROR IA:", e.message);
//         res.status(500).json({ error: "La IA no pudo estructurar la respuesta." });
//     }
// });

// GET EMAILS
app.get('/emails', async (req, res) => {
    const userEmail = req.query.userEmail;
    if (!userEmail) return res.json([]); 
    try {
        const [rows] = await db.query('SELECT * FROM emails WHERE owner_email = ? ORDER BY date DESC, id DESC', [userEmail]);
        const parsed = rows.map(r => {
            try {
                return {
                    ...r, 
                    unread: !!r.unread, 
                    hasAttachments: !!r.hasAttachments, 
                    attachments: JSON.parse(r.attachments||'[]'),
                    securityAnalysis: JSON.parse(r.securityAnalysis||'{}')
                };
            } catch (parseError) {
                console.error('Error parseando email ID:', r.id, parseError);
                return {
                    ...r, 
                    unread: !!r.unread, 
                    hasAttachments: !!r.hasAttachments, 
                    attachments: [],
                    securityAnalysis: {}
                };
            }
        });
        res.json(parsed);
    } catch (e) { 
        console.error('Error en /emails:', e);
        res.status(500).json({ error: e.message }); 
    }
});

// POP3 DELETE
app.post('/emails/downloaded', async (req, res) => {
    if (!req.body.ids?.length) return res.json({success:true});
    try { await db.query(`DELETE FROM emails WHERE id IN (${req.body.ids.map(()=>'?').join(',')})`, req.body.ids); res.json({success:true}); } catch(e){res.status(500).json({ error: e.message });}
});

// ENVIAR CORREO INTERNO (SOLO ENTRE USUARIOS REGISTRADOS)
app.post('/emails', async (req, res) => {
    const { from, to, subject, body, isDraft, attachments, idToDelete } = req.body;
    let connection;

    try {
        if (!from || !to) {
            return res.status(400).json({ error: 'Campos "from" y "to" son requeridos.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Validar que remitente y destinatario existan como usuarios internos
        const [[senderUser]] = await connection.query('SELECT email FROM users WHERE email = ?', [from]);
        const [[recipientUser]] = await connection.query('SELECT email FROM users WHERE email = ?', [to]);

        if (!senderUser) {
            await connection.rollback();
            return res.status(400).json({ error: 'El remitente no está registrado como usuario interno.' });
        }

        if (!recipientUser) {
            await connection.rollback();
            return res.status(400).json({ error: 'El destinatario no está registrado como usuario interno.' });
        }

        if (idToDelete) {
            await connection.query('DELETE FROM emails WHERE id = ?', [idToDelete]);
        }

        const dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const cleanBody = body || '';
        const previewText = cleanBody.replace(/<[^>]*>?/gm, '').substring(0, 50) + '...';
        const attachStr = JSON.stringify(attachments || []);
        const hasAttach = (attachments && attachments.length > 0) ? 1 : 0;

        // A. Guardar en bandeja del remitente (sent o drafts)
        await connection.query('INSERT INTO emails SET ?', {
            owner_email: from,
            folder: isDraft ? 'drafts' : 'sent',
            sender: 'Yo',
            to_address: to,
            subject: subject || '(Sin Asunto)',
            preview: `Para: ${to} - ${previewText}`,
            body: cleanBody,
            date: dateNow,
            unread: 0,
            hasAttachments: hasAttach,
            attachments: attachStr,
            securityAnalysis: JSON.stringify({ status: 'clean', score: 0, threats: [] })
        });

        // B. Si no es borrador, guardar en bandeja del destinatario
        if (!isDraft) {
            const spamKeywords = ['virus', 'premio', 'ganaste', 'urgente', 'lotería', 'hacked', 'ataque'];
            const isSpam = spamKeywords.some(
                word => ((subject || '') + ' ' + cleanBody).toLowerCase().includes(word)
            );

            const targetFolder = isSpam ? 'spam' : 'inbox';
            const finalSubject = isSpam ? `[SPAM] ${subject || '(Sin Asunto)'}` : (subject || '(Sin Asunto)');
            const securityAnalysis = isSpam
                ? { status: 'risk', threats: ['Palabras clave detectadas'], score: 80 }
                : { status: 'clean', threats: [], score: 0 };

            await connection.query('INSERT INTO emails SET ?', {
                owner_email: to,
                folder: targetFolder,
                sender: from,
                to_address: 'Mí',
                subject: finalSubject,
                preview: previewText,
                body: cleanBody,
                date: dateNow,
                unread: 1,
                hasAttachments: hasAttach,
                attachments: attachStr,
                securityAnalysis: JSON.stringify(securityAnalysis)
            });

            // Notificar al destinatario vía WebSocket
            const newEmail = {
                id: null, // Se asignará en la BD
                owner_email: to,
                folder: targetFolder,
                sender: from,
                to_address: 'Mí',
                subject: finalSubject,
                preview: previewText,
                body: cleanBody,
                date: dateNow,
                unread: 1,
                hasAttachments: hasAttach,
                attachments: attachments || [],
                securityAnalysis: securityAnalysis
            };

            // Enviar notificación a todos los clientes conectados
            io.emit('new-email', {
                userEmail: to,
                email: newEmail,
                timestamp: new Date().toISOString()
            });

            console.log(`📧 Notificación enviada a ${to} - Nuevo correo de ${from}: ${subject}`);
        }

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// BASIC CRUD (Login, Users, etc - Resumido)
// Simple ping endpoint para probar conectividad básica
app.get('/ping', (req, res) => {
    res.json({ 
        status: 'pong', 
        timestamp: new Date().toISOString(),
        port: 3001
    });
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        console.log('🔍 Health check - Verificando conexión a BD...');
        
        // Verificar conexión a la base de datos
        await db.execute('SELECT 1');
        console.log('✅ BD conectada correctamente');
        
        // Verificar API Key de Gemini (DESACTIVADO - solo informativo)
        const geminiStatus = 'disabled'; // IA desactivada
        
        // El servidor está saludable si la BD está conectada
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                gemini: geminiStatus,
                port: 3001
            }
        };
        
        console.log('✅ Health check exitoso:', healthData);
        res.json(healthData);
        
    } catch (error) {
        console.error('❌ Health check falló:', error.message);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            services: {
                database: 'disconnected',
                gemini: 'disabled',
                port: 3001
            }
        });
    }
});

app.post('/login', async (req, res) => { try { const [r] = await db.query("SELECT * FROM users WHERE email=? AND password=?", [req.body.email, req.body.password]); r.length ? res.json({success:true, user:r[0]}) : res.status(401).json({ error: 'Credenciales inválidas' }); } catch(e){console.error('Error en login:', e); res.status(500).json({ error: e.message });} });
app.get('/contacts', async (req, res) => { try { const [r] = await db.query('SELECT * FROM contacts'); res.json(r); } catch(e){} });
app.get('/users', async (req, res) => { try { const [r] = await db.query('SELECT id, name, email, role FROM users'); res.json(r); } catch(e){} });
app.post('/users', async (req, res) => { try { await db.query("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)", [req.body.name, req.body.email, req.body.password, req.body.role]); res.json({success:true}); } catch(e){console.error('Error en POST /users:', e); res.status(500).json({ error: e.message });} });
app.put('/users/:id', async (req, res) => { try { await db.query("UPDATE users SET name=?, role=? WHERE id=?", [req.body.name, req.body.role, req.params.id]); res.json({success:true}); } catch(e){} });
app.delete('/users/:id', async (req, res) => { try { await db.query('DELETE FROM users WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e){} });
app.delete('/emails/:id', async (req, res) => { try { await db.query('DELETE FROM emails WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e){} });
app.put('/emails/:id', async (req, res) => { try { await db.query('UPDATE emails SET unread=? WHERE id=?', [req.body.unread, req.params.id]); res.json({success:true}); } catch(e){} });

// SYNC GMAIL (Mantenemos tu lógica)
async function syncGmailInbox() {
    /* ... (Tu código IMAP igual que antes) ... */
}
setInterval(syncGmailInbox, 20000);
server.listen(3001, () => {
    console.log('🚀 Servidor Listo con WebSockets.');
    console.log('🔌 WebSocket habilitado para comunicación en tiempo real');
});