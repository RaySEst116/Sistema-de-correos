import { io, Socket } from 'socket.io-client';

export interface NewEmailNotification {
  userEmail: string;
  email: {
    id: number | null;
    owner_email: string;
    folder: string;
    sender: string;
    to_address: string;
    subject: string;
    preview: string;
    body: string;
    date: string;
    unread: number;
    hasAttachments: number;
    attachments: any[];
    securityAnalysis: any;
  };
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔌 Conectado al servidor WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Desconectado del servidor WebSocket');
    });

    this.socket.on('new-email', (data: NewEmailNotification) => {
      console.log('📧 Nuevo correo recibido:', data);
      this.emit('new-email', data);
    });

    this.socket.on('server-status', (data) => {
      console.log('📊 Estado del servidor:', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
