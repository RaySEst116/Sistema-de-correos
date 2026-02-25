import { Server } from 'socket.io';
import { verifyConnection } from '../config/database.js';
import { config } from '../config/app.js';

export class WebSocketService {
    constructor(server) {
        this.io = new Server(server, {
            cors: config.cors
        });
        
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log('\x1b[36m%s\x1b[0m', `WebSocket: Cliente conectado: ${socket.id}`);
            
            // Enviar estado del servidor inmediatamente
            socket.emit('server-status', {
                status: 'connected',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'connected',
                    gemini: config.ai.enabled ? 'enabled' : 'disabled',
                    port: config.port
                }
            });
            
            // Health check por WebSocket
            socket.on('health-check', async () => {
                try {
                    const dbConnected = await verifyConnection();
                    
                    socket.emit('health-response', {
                        status: dbConnected ? 'healthy' : 'unhealthy',
                        timestamp: new Date().toISOString(),
                        services: {
                            database: dbConnected ? 'connected' : 'disconnected',
                            gemini: config.ai.enabled ? 'enabled' : 'disabled',
                            port: config.port
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
                            port: config.port
                        }
                    });
                }
            });
            
            socket.on('disconnect', () => {
                console.log('\x1b[33m%s\x1b[0m', `WebSocket: Cliente desconectado: ${socket.id}`);
            });
        });
    }

    // Método para emitir notificaciones de nuevo email
    notifyNewEmail(userEmail, emailData) {
        this.io.emit('new-email', {
            userEmail,
            email: emailData,
            timestamp: new Date().toISOString()
        });
        
        console.log('\x1b[32m%s\x1b[0m', `Email: Notificación enviada a ${userEmail} - Nuevo correo de ${emailData.sender}: ${emailData.subject}`);
    }

    // Método para emitir actualizaciones de estado
    notifyStatusUpdate(userEmail, emailId, status) {
        this.io.emit('email-status-updated', {
            userEmail,
            emailId,
            status,
            timestamp: new Date().toISOString()
        });
    }

    // Método para emitir notificaciones generales
    broadcastNotification(message, type = 'info') {
        this.io.emit('notification', {
            type,
            message,
            timestamp: new Date().toISOString()
        });
    }

    // Obtener instancia de Socket.IO
    getIO() {
        return this.io;
    }
}
