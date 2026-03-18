import { db, verifyConnection } from '../config/database.js';
import { config } from '../config/app.js';

export class HealthController {
    static async ping(req, res) {
        res.json({
            status: 'pong',
            timestamp: new Date().toISOString(),
            port: config.port
        });
    }

    static async healthCheck(req, res) {
        try {
            console.log('\x1b[36m%s\x1b[0m', 'Health check - Verificando conexión a BD...');
            
            // Verificar conexión a la base de datos
            const dbConnected = await verifyConnection();
            
            // Verificar API Key de Gemini (desactivada)
            const geminiStatus = config.ai.enabled ? 'enabled' : 'disabled';
            
            // El servidor está saludable si la BD está conectada
            const healthData = {
                status: dbConnected ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: dbConnected ? 'connected' : 'disconnected',
                    gemini: geminiStatus,
                    port: config.port
                }
            };
            
            console.log('\x1b[32m%s\x1b[0m', 'Health check exitoso:', healthData);
            res.status(dbConnected ? 200 : 503).json(healthData);
            
        } catch (error) {
            console.error('\x1b[31m%s\x1b[0m', 'ERROR: Health check falló:', error.message);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                services: {
                    database: 'disconnected',
                    gemini: 'disabled',
                    port: config.port
                }
            });
        }
    }
}
