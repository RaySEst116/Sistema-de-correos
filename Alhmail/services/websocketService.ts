import { io, Socket } from 'socket.io-client';

class WebSocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();

    connect() {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io('http://localhost:3001', {
            transports: ['websocket', 'polling'], // fallback a polling si websocket falla
            timeout: 5000,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            this.emit('connection-status', { connected: true });
        });

        this.socket.on('disconnect', () => {
            this.emit('connection-status', { connected: false });
        });

        this.socket.on('server-status', (data) => {
            this.emit('server-status', data);
        });

        this.socket.on('health-response', (data) => {
            this.emit('health-response', data);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Método para health check por WebSocket
    async healthCheck(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.socket?.connected) {
                reject(new Error('WebSocket no conectado'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Timeout del health check'));
            }, 3000);

            this.socket!.once('health-response', (data) => {
                clearTimeout(timeout);
                resolve(data);
            });

            this.socket!.emit('health-check');
        });
    }

    // Métodos de eventos
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    off(event: string, callback: Function) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    private emit(event: string, data: any) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const wsService = new WebSocketService();
