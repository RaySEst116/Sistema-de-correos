
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

    getEmails: async (userEmail: string): Promise<Email[]> => {
        // Intenta cargar correos desde la API y adaptarlos al tipo Email usado en el frontend
        try {
            const res = await fetch(`${API_URL}/emails?userEmail=${encodeURIComponent(userEmail)}`);
            if (!res.ok) throw new Error('API Offline');

            const apiData = await res.json();

            // Adaptar el formato devuelto por la API (tabla emails) al tipo Email del frontend
            const mapped: Email[] = apiData.map((r: any) => {
                const security: any = r.securityAnalysis || {};
                const riskLevel: 'safe' | 'suspicious' | 'high' | undefined =
                    security.status === 'risk' || security.status === 'suspicious'
                        ? 'suspicious'
                        : security.status === 'infected' || security.status === 'blocked'
                        ? 'high'
                        : security.status
                        ? 'safe'
                        : undefined;

                return {
                    id: r.id,
                    folder: r.folder,
                    unread: !!r.unread,
                    sender: r.sender || r.from || r.owner_email || '',
                    email: r.email || r.owner_email || '',
                    replyTo: r.replyTo,
                    subject: r.subject || '(Sin Asunto)',
                    preview: r.preview || (r.body ? String(r.body).substring(0, 50) + '...' : ''),
                    body: r.body || '',
                    date: r.date ? String(r.date) : '',
                    hasAttachments: !!r.hasAttachments,
                    attachmentName: Array.isArray(r.attachments) && r.attachments.length > 0
                        ? r.attachments[0].filename || r.attachments[0].name || undefined
                        : undefined,
                    riskLevel,
                    riskReason: security.threats && security.threats.length
                        ? security.threats.join(', ')
                        : undefined,
                    securityAnalysis: security
                } as Email;
            });

            USE_API = true; // Conexión exitosa
            return mapped;
        } catch (e) {
            console.warn('API de MySQL no detectada o error de conexión. Usando modo offline (localStorage).');
            USE_API = false; // Cambiar a modo offline
            return getLocalEmails();
        }
    },

    // Guardar correo en modo simulación/offline. Si la API está activa, intentamos
    // reutilizar la ruta /emails como envío interno a nosotros mismos.
    saveEmail: async (email: Email): Promise<void> => {
        if (USE_API) {
            try {
                const payload = {
                    from: email.sender || email.email,
                    to: email.email, // el correo llega a la bandeja del usuario actual
                    subject: email.subject,
                    body: email.body,
                    isDraft: false,
                    attachments: [],
                    idToDelete: null
                };

                await fetch(`${API_URL}/emails`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                return;
            } catch (e) {
                console.error('Error guardando en API, guardando localmente.');
            }
        }

        // Fallback o modo Offline
        await delay(200);
        const emails = getLocalEmails();
        saveLocalEmails([email, ...emails]);
    },

    // Enviar correo interno usando la API (entre usuarios registrados en la BD)
    sendInternalEmail: async (from: string, to: string, subject: string, body: string): Promise<void> => {
        if (USE_API) {
            try {
                const payload = { from, to, subject, body, isDraft: false, attachments: [], idToDelete: null };
                const res = await fetch(`${API_URL}/emails`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Error enviando correo interno');
                }
                return;
            } catch (e) {
                console.error('Error enviando correo interno vía API:', e);
                throw e;
            }
        }

        // Si no hay API disponible, simulamos guardando localmente en carpeta 'sent'
        await delay(200);
        const emails = getLocalEmails();
        const newEmail: Email = {
            id: Date.now(),
            folder: 'sent',
            unread: false,
            sender: from,
            email: from,
            subject,
            preview: body.substring(0, 50) + '...',
            body,
            date: new Date().toLocaleString(),
            hasAttachments: false
        } as Email;
        saveLocalEmails([newEmail, ...emails]);
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
