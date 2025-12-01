
import { Email, Contact, User } from '../types';

// CONFIGURACIÓN API
const API_URL = 'http://localhost:3001';
let USE_API = true; // Intentará usar la API, si falla, usará localStorage

// Initial Mock Data (Fallback)
const INITIAL_EMAILS: Email[] = [
    { 
        id: 1, 
        folder: 'inbox', 
        unread: true, 
        sender: 'Hospital Central', 
        email: 'admin@hospital.com',
        subject: 'Actualización de inventario médico', 
        preview: 'Se adjunta el reporte de insumos médicos solicitados...', 
        body: `Estimado Coordinador,\n\nEspero que este mensaje le encuentre bien.\nAdjunto encontrará el reporte detallado de los insumos médicos solicitados para el próximo trimestre.\n\nSaludos cordiales,\nAdministración.`,
        date: '10:30 AM',
        hasAttachments: true,
        attachmentName: 'Reporte_Q4.pdf',
        riskLevel: 'safe',
        riskReason: 'Verified internal domain',
        securityAnalysis: { spf: 'pass', dkim: 'pass', dmarc: 'pass', ipReputation: 'clean', confidenceScore: 98 }
    },
    { 
        id: 5, 
        folder: 'quarantine', 
        unread: true, 
        sender: 'Soporte IT', 
        email: 'security-alert@goggle-security.com',
        replyTo: 'hacker@darkweb.net',
        subject: 'URGENTE: Su cuenta ha sido comprometida', 
        preview: 'Haga clic aquí inmediatamente para cambiar su contraseña...', 
        body: `Estimado Usuario,\n\nHemos detectado actividad inusual.\nDebe descargar el archivo adjunto "Fix_Patch.exe" para restaurar su acceso o su cuenta será eliminada en 24 horas.\n\n<a href="http://malicious-site.com">CLICK AQUÍ</a>\n\nAtte,\nSoporte`,
        date: 'Hace 10 min',
        hasAttachments: true,
        attachmentName: 'Fix_Patch.exe',
        riskLevel: 'high',
        riskReason: 'Critical: SPF Fail. Mismatched Reply-To. Executable attachment.',
        securityAnalysis: { spf: 'fail', dkim: 'none', dmarc: 'fail', ipReputation: 'blacklisted', confidenceScore: 5 }
    }
];

const INITIAL_CONTACTS: Contact[] = [
    { name: 'Dr. Roberto Gómez', email: 'roberto.g@hospital.com' },
    { name: 'Hospital Central', email: 'admin@hospital.com' },
    { name: 'Soporte Técnico', email: 'soporte@cruzroja.mx' }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPER FUNCTIONS FOR LOCALSTORAGE (FALLBACK) ---
const getLocalEmails = (): Email[] => {
    const stored = localStorage.getItem('alhmail_emails');
    if (!stored) {
        localStorage.setItem('alhmail_emails', JSON.stringify(INITIAL_EMAILS));
        return INITIAL_EMAILS;
    }
    return JSON.parse(stored);
};

const saveLocalEmails = (emails: Email[]) => {
    localStorage.setItem('alhmail_emails', JSON.stringify(emails));
};

export const db = {
    // Check if we are connected to the Node API
    isOnline: (): boolean => {
        return USE_API;
    },

    getEmails: async (): Promise<Email[]> => {
        // Try connecting to API
        try {
            // We do a quick check first or just try the fetch
            const res = await fetch(`${API_URL}/emails`);
            if (!res.ok) throw new Error("API Offline");
            const data = await res.json();
            USE_API = true; // Connection successful
            return data;
        } catch (e) {
            console.warn("API de MySQL no detectada o error de conexión. Usando modo offline (localStorage).");
            USE_API = false; // Switch to offline mode
            return getLocalEmails();
        }
    },

    saveEmail: async (email: Email): Promise<void> => {
        if (USE_API) {
            try {
                await fetch(`${API_URL}/emails`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(email)
                });
                return;
            } catch (e) {
                console.error("Error guardando en API, guardando localmente.");
                // If post fails, we might want to fallback or just log error
            }
        }
        // Fallback or Offline mode
        await delay(200);
        const emails = getLocalEmails();
        saveLocalEmails([email, ...emails]);
    },

    deleteEmail: async (id: number): Promise<void> => {
        if (USE_API) {
            try {
                await fetch(`${API_URL}/emails/${id}`, { method: 'DELETE' });
                return;
            } catch (e) { console.error(e); }
        }
        const emails = getLocalEmails().filter(e => e.id !== id);
        saveLocalEmails(emails);
    },

    moveEmailToFolder: async (id: number, folder: string): Promise<void> => {
        if (USE_API) {
            try {
                await fetch(`${API_URL}/emails/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folder, unread: false })
                });
                return;
            } catch (e) { console.error(e); }
        }
        const emails = getLocalEmails().map(e => e.id === id ? { ...e, folder: folder as any, unread: false } : e);
        saveLocalEmails(emails);
    },

    addToBlacklist: async (emailAddress: string): Promise<void> => {
        console.log(`[FIREWALL] Added ${emailAddress} to permanent blacklist (DB & Firewall Rule).`);
        await delay(500);
        // Here you would typically call an endpoint like POST /api/blacklist
    },

    markAsRead: async (id: number): Promise<void> => {
        if (USE_API) {
             try {
                await fetch(`${API_URL}/emails/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unread: false })
                });
                return;
            } catch (e) { console.error(e); }
        }
        const emails = getLocalEmails().map(e => e.id === id ? { ...e, unread: false } : e);
        saveLocalEmails(emails);
    },

    getContacts: async (): Promise<Contact[]> => {
        return INITIAL_CONTACTS;
    },

    login: async (email: string): Promise<User> => {
        await delay(800);
        const user: User = {
            id: 'u1',
            name: 'Admin Seguridad',
            email: email,
            role: 'admin',
            avatar: 'https://ui-avatars.com/api/?name=Admin+Seguridad&background=000&color=fff'
        };
        localStorage.setItem('alhmail_user', JSON.stringify(user));
        return user;
    },

    getCurrentUser: async (): Promise<User | null> => {
        const stored = localStorage.getItem('alhmail_user');
        return stored ? JSON.parse(stored) : null;
    },

    logout: async (): Promise<void> => {
        localStorage.removeItem('alhmail_user');
    }
};
