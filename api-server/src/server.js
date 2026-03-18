import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { config } from '../config/app.js';
import { verifyConnection } from '../config/database.js';
import { WebSocketService } from '../services/websocketService.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import { requestLogger } from '../middleware/requestLogger.js';
import routes from '../routes/index.js';
import { setWebSocketService } from '../services/emailService.js';

// Crear aplicación Express
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(requestLogger);

// Rutas
app.use('/', routes);

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

// Crear servidor HTTP
const server = createServer(app);

// Inicializar WebSocket
const webSocketService = new WebSocketService(server);

// Configurar el servicio WebSocket para EmailService
setWebSocketService(webSocketService);

// Función de inicio del servidor
async function startServer() {
    try {
        // Verificar conexión a la base de datos
        console.log('\x1b[36m%s\x1b[0m', 'Verificando conexión a la base de datos...');
        const dbConnected = await verifyConnection();
        
        if (!dbConnected) {
            console.error('\x1b[31m%s\x1b[0m', 'ERROR: No se pudo conectar a la base de datos. El servidor se iniciará pero algunas funciones pueden no estar disponibles.');
        } else {
            console.log('\x1b[32m%s\x1b[0m', 'Base de datos conectada correctamente');
        }
        
        // Iniciar servidor
        server.listen(config.port, () => {
            console.log('\x1b[32m%s\x1b[0m', 'Servidor iniciado exitosamente');
            console.log('\x1b[34m%s\x1b[0m', `Puerto: ${config.port}`);
            console.log('\x1b[36m%s\x1b[0m', 'WebSocket habilitado para comunicación en tiempo real');
            console.log('\x1b[35m%s\x1b[0m', `CORS configurado para: ${config.cors.origin}`);
            console.log('\x1b[33m%s\x1b[0m', `IA: ${config.ai.enabled ? 'habilitada' : 'deshabilitada'}`);
            console.log('\x1b[37m%s\x1b[0m', '=====================================');
        });
        
        // Manejo de errores no capturados
        process.on('uncaughtException', (error) => {
            console.error('\x1b[31m%s\x1b[0m', 'ERROR: Error no capturado:', error);
            process.exit(1);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('\x1b[31m%s\x1b[0m', 'ERROR: Promesa rechazada no manejada:', reason);
            process.exit(1);
        });
        
        // Manejo de cierre graceful
        process.on('SIGTERM', () => {
            console.log('\x1b[33m%s\x1b[0m', 'Recibida señal SIGTERM. Cerrando servidor...');
            server.close(() => {
                console.log('\x1b[32m%s\x1b[0m', 'Servidor cerrado correctamente');
                process.exit(0);
            });
        });
        
        process.on('SIGINT', () => {
            console.log('\x1b[33m%s\x1b[0m', 'Recibida señal SIGINT. Cerrando servidor...');
            server.close(() => {
                console.log('\x1b[32m%s\x1b[0m', 'Servidor cerrado correctamente');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'ERROR: Error iniciando el servidor:', error);
        process.exit(1);
    }
}

// Exportar servicios para uso en otros módulos
export { webSocketService };

// Iniciar servidor
startServer();
