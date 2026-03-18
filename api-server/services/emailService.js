import { Email } from '../models/Email.js';
import { User } from '../models/User.js';
import { config } from '../config/app.js';
import { db } from '../config/database.js';

// Importar el servicio WebSocket (se inicializará en el servidor)
let webSocketService = null;

export const setWebSocketService = (wsService) => {
    webSocketService = wsService;
};

export class EmailService {
    static async getUserEmails(userEmail) {
        return await Email.findByUserEmail(userEmail);
    }

    static async sendInternalEmail(emailData) {
        const { from, to, subject, body, isDraft, attachments, idToDelete } = emailData;
        
        let connection;
        try {
            if (!from) {
                throw new Error('El campo "from" es requerido.');
            }
            
            // Para borradores, el campo 'to' no es requerido
            if (!isDraft && !to) {
                throw new Error('El campo "to" es requerido para enviar correos.');
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            // Validar que remitente y destinatario existan como usuarios internos
            let senderUser = null;
            
            // Solo validar remitente si no es borrador
            if (!isDraft) {
                senderUser = await User.findByEmail(from);
            }
            
            // Solo validar destinatario si no es borrador y hay un destinatario
            let recipientUser = null;
            if (!isDraft && to) {
                recipientUser = await User.findByEmail(to);
            }

            if (!isDraft && !senderUser) {
                await connection.rollback();
                throw new Error('El remitente no está registrado como usuario interno.');
            }
            
            if (!isDraft && to && !recipientUser) {
                await connection.rollback();
                throw new Error('El destinatario no está registrado como usuario interno.');
            }

            // Eliminar email si se especificó un ID (para borradores)
            if (idToDelete) {
                await connection.query('DELETE FROM emails WHERE id = ?', [idToDelete]);
            }

            const dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const cleanBody = body || '';
            const previewText = cleanBody.replace(/<[^>]*>?/gm, '').substring(0, 50) + '...';
            const attachStr = JSON.stringify(attachments || []);
            const hasAttach = (attachments && attachments.length > 0) ? 1 : 0;

            // Guardar en bandeja del remitente (sent o drafts)
            await connection.query('INSERT INTO emails SET ?', {
                owner_email: from,
                folder: isDraft ? 'drafts' : 'sent',
                sender: 'Yo',
                to_address: to || 'Borrador',
                subject: subject || '(Sin Asunto)',
                preview: to ? `Para: ${to} - ${previewText}` : `Borrador - ${previewText}`,
                body: cleanBody,
                date: dateNow,
                unread: 0,
                hasAttachments: hasAttach,
                attachments: attachStr,
                securityAnalysis: JSON.stringify({ status: 'clean', score: 0, threats: [] })
            });

            // Si no es borrador, guardar en bandeja del destinatario
            let newEmailNotification = null;
            if (!isDraft) {
                const isSpam = config.security.spamKeywords.some(
                    word => ((subject || '') + ' ' + cleanBody).toLowerCase().includes(word)
                );

                const targetFolder = isSpam ? 'spam' : 'inbox';
                const finalSubject = isSpam ? `[SPAM] ${subject || '(Sin Asunto)'}` : (subject || '(Sin Asunto)');
                const securityAnalysis = isSpam
                    ? { status: 'risk', threats: ['Palabras clave detectadas'], score: 80 }
                    : { status: 'clean', threats: [], score: 0 };

                await connection.query('INSERT INTO emails SET ?', {
                    owner_email: to,
                    folder: targetFolder,
                    sender: from,
                    to_address: 'Mí',
                    subject: finalSubject,
                    preview: previewText,
                    body: cleanBody,
                    date: dateNow,
                    unread: 1,
                    hasAttachments: hasAttach,
                    attachments: attachStr,
                    securityAnalysis: JSON.stringify(securityAnalysis)
                });

                // Preparar notificación
                newEmailNotification = {
                    owner_email: to,
                    folder: targetFolder,
                    sender: from,
                    to_address: 'Mí',
                    subject: finalSubject,
                    preview: previewText,
                    body: cleanBody,
                    date: dateNow,
                    unread: 1,
                    hasAttachments: hasAttach,
                    attachments: attachments || [],
                    securityAnalysis: securityAnalysis
                };
            }

            await connection.commit();
            
            // Enviar notificación vía WebSocket si hay una nueva notificación
            if (newEmailNotification && webSocketService) {
                webSocketService.notifyNewEmail(to, newEmailNotification);
            }
            
            return {
                success: true,
                newEmailNotification
            };
            
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    static async deleteEmails(ids) {
        return await Email.deleteMultiple(ids);
    }

    static async updateEmailStatus(id, unread) {
        return await Email.updateUnreadStatus(id, unread);
    }

    static async updateEmail(id, emailData) {
        try {
            const connection = await db.getConnection();
            
            // Actualizar el correo en la base de datos
            const [result] = await connection.execute(
                `UPDATE emails SET 
                    subject = ?, 
                    body = ?, 
                    preview = ?, 
                    to = ?, 
                    cc = ?, 
                    bcc = ?, 
                    folder = ?,
                    attachments = ?,
                    date = ?
                WHERE id = ?`,
                [
                    emailData.subject,
                    emailData.body,
                    emailData.body.substring(0, 100) + '...', // Preview
                    emailData.to || null,
                    emailData.cc || null,
                    emailData.bcc || null,
                    emailData.folder,
                    JSON.stringify(emailData.attachments || []),
                    new Date().toISOString().slice(0, 19).replace('T', ' '),
                    id
                ]
            );
            
            connection.release();
            
            if (result.affectedRows > 0) {
                // Retornar el correo actualizado
                const [updatedEmail] = await db.execute(
                    'SELECT * FROM emails WHERE id = ?',
                    [id]
                );
                
                return updatedEmail[0];
            }
            
            return null;
        } catch (error) {
            console.error('Error en updateEmail:', error);
            throw error;
        }
    }

    static async deleteEmail(id) {
        return await Email.delete(id);
    }
}
