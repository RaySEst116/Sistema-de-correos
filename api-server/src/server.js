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
        const dbConnected = await verifyConnection();
        
        if (!dbConnected) {
            console.error('\x1b[31m%s\x1b[0m', 'ERROR: No se pudo conectar a la base de datos. El servidor se iniciará pero algunas funciones pueden no estar disponibles.');
        } else {
        }
        
        // Iniciar servidor
        server.listen(config.port, () => {
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
            server.close(() => {
                process.exit(0);
            });
        });
        
        process.on('SIGINT', () => {
            server.close(() => {
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
