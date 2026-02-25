import { User, Contact } from '../types';

// CONFIGURACIÓN API
const API_URL = 'http://localhost:3001';

// Servicios de API para usuarios
export const userService = {
    // Obtener todos los usuarios
    getAll: async (): Promise<User[]> => {
        try {
            const res = await fetch(`${API_URL}/users`);
            if (!res.ok) throw new Error('Error obteniendo usuarios');
            return await res.json();
        } catch (e) {
            console.error('Error en userService.getAll:', e);
            return [];
        }
    },

    // Obtener usuario por ID
    getById: async (id: string): Promise<User | null> => {
        try {
            const res = await fetch(`${API_URL}/users/${id}`);
            if (!res.ok) throw new Error('Usuario no encontrado');
            return await res.json();
        } catch (e) {
            console.error('Error en userService.getById:', e);
            return null;
        }
    },

    // Crear usuario
    create: async (userData: { name: string; email: string; password: string; role?: string }): Promise<User | null> => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!res.ok) throw new Error('Error creando usuario');
            return await res.json();
        } catch (e) {
            console.error('Error en userService.create:', e);
            return null;
        }
    },

    // Actualizar usuario
    update: async (id: string, userData: { name: string; role?: string }): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return res.ok;
        } catch (e) {
            console.error('Error en userService.update:', e);
            return false;
        }
    },

    // Eliminar usuario
    delete: async (id: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE'
            });
            return res.ok;
        } catch (e) {
            console.error('Error en userService.delete:', e);
            return false;
        }
    }
};

// Servicios de API para contactos
export const contactService = {
    // Obtener todos los contactos
    getAll: async (): Promise<Contact[]> => {
        try {
            const res = await fetch(`${API_URL}/contacts`);
            if (!res.ok) throw new Error('Error obteniendo contactos');
            return await res.json();
        } catch (e) {
            console.error('Error en contactService.getAll:', e);
            return [];
        }
    },

    // Crear contacto
    create: async (contactData: Omit<Contact, 'id'>): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
            return res.ok;
        } catch (e) {
            console.error('Error en contactService.create:', e);
            return false;
        }
    },

    // Actualizar contacto
    update: async (id: string, contactData: Partial<Contact>): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/contacts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
            return res.ok;
        } catch (e) {
            console.error('Error en contactService.update:', e);
            return false;
        }
    },

    // Eliminar contacto
    delete: async (id: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/contacts/${id}`, {
                method: 'DELETE'
            });
            return res.ok;
        } catch (e) {
            console.error('Error en contactService.delete:', e);
            return false;
        }
    }
};

// Health check
export const healthService = {
    ping: async (): Promise<{ status: string; port: number }> => {
        try {
            const res = await fetch(`${API_URL}/ping`);
            if (!res.ok) throw new Error('Servidor no responde');
            return await res.json();
        } catch (e) {
            console.error('Error en healthService.ping:', e);
            throw e;
        }
    },

    check: async (): Promise<any> => {
        try {
            const res = await fetch(`${API_URL}/health`);
            if (!res.ok) throw new Error('Health check falló');
            return await res.json();
        } catch (e) {
            console.error('Error en healthService.check:', e);
            throw e;
        }
    }
};
