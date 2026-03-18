import mysql from 'mysql2/promise';
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
} else {
    console.warn('\x1b[33m%s\x1b[0m', 'ADVERTENCIA: No se encontró archivo .env en api-server ni en la raíz del proyecto.');
}

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crear pool de conexiones
const db = mysql.createPool(dbConfig);

// Verificar conexión
const verifyConnection = async () => {
    try {
        const connection = await db.getConnection();
        connection.release();
        return true;
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'ERROR conectando a la base de datos:', error.message);
        return false;
    }
};

export { db, verifyConnection, dbConfig };
