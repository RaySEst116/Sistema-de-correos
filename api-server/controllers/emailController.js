import { EmailService } from '../services/emailService.js';

export class EmailController {
    static async getUserEmails(req, res) {
        try {
            const userEmail = req.query.userEmail;
            if (!userEmail) {
                return res.json([]);
            }
            
            const emails = await EmailService.getUserEmails(userEmail);
            res.json(emails);
        } catch (error) {
            console.error('Error en /emails:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async sendEmail(req, res) {
        try {
            const result = await EmailService.sendInternalEmail(req.body);
            
            // Si hay una notificación de nuevo email, se emitirá vía WebSocket
            // desde el middleware o el servidor principal
            
            res.json(result);
        } catch (error) {
            console.error('Error enviando email:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteDownloadedEmails(req, res) {
        try {
            if (!req.body.ids?.length) {
                return res.json({ success: true });
            }
            
            await EmailService.deleteEmails(req.body.ids);
            res.json({ success: true });
        } catch (error) {
            console.error('Error eliminando emails descargados:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteEmail(req, res) {
        try {
            const { id } = req.params;
            const success = await EmailService.deleteEmail(id);
            
            if (success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Email no encontrado' });
            }
        } catch (error) {
            console.error('Error eliminando email:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async updateEmailStatus(req, res) {
        try {
            const { id } = req.params;
            const { unread } = req.body;
            
            const success = await EmailService.updateEmailStatus(id, unread);
            
            if (success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Email no encontrado' });
            }
        } catch (error) {
            console.error('Error actualizando estado del email:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
