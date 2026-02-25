import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
const localEnvPath = resolve(__dirname, '..', '.env');
const rootEnvPath = resolve(__dirname, '..', '..', '.env');
const envPath = fs.existsSync(localEnvPath)
    ? localEnvPath
    : (fs.existsSync(rootEnvPath) ? rootEnvPath : undefined);

if (envPath) {
    dotenv.config({ path: envPath });
}

// Configuración de la aplicación
export const config = {
    // Servidor
    port: process.env.PORT || 3001,
    
    // Base de datos
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME
    },
    
    // Correo
    email: {
        gmail: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    },
    
    // IA (desactivada)
    ai: {
        enabled: false,
        geminiKey: process.env.GEN_AI_KEY
    },
    
    // CORS
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    },
    
    // Seguridad
    security: {
        spamKeywords: [
            'virus', 'ganaste', 'urgente', 'lotería', 'hacked', 
            'bitcoin', 'herencia', 'premio', 'verify your account', 
            'password', 'ataque'
        ],
        dangerousExtensions: ['.exe', '.bat', '.sh', '.js', '.vbs', '.jar', '.scr']
    }
};
