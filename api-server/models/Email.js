import { db } from '../config/database.js';

export class Email {
    static async findByUserEmail(userEmail) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM emails WHERE owner_email = ? ORDER BY date DESC, id DESC',
                [userEmail]
            );
            
            return rows.map(email => {
                try {
                    return {
                        ...email,
                        unread: !!email.unread,
                        hasAttachments: !!email.hasAttachments,
                        attachments: JSON.parse(email.attachments || '[]'),
                        securityAnalysis: JSON.parse(email.securityAnalysis || '{}')
                    };
                } catch (parseError) {
                    console.error('Error parsing email ID:', email.id, parseError);
                    return {
                        ...email,
                        unread: !!email.unread,
                        hasAttachments: !!email.hasAttachments,
                        attachments: [],
                        securityAnalysis: {}
                    };
                }
            });
        } catch (error) {
            throw new Error(`Error finding emails by user: ${error.message}`);
        }
    }

    static async create(emailData) {
        try {
            const [result] = await db.query('INSERT INTO emails SET ?', emailData);
            return result.insertId;
        } catch (error) {
            throw new Error(`Error creating email: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM emails WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting email: ${error.message}`);
        }
    }

    static async deleteMultiple(ids) {
        try {
            if (!ids || ids.length === 0) return true;
            
            const placeholders = ids.map(() => '?').join(',');
            const [result] = await db.query(
                `DELETE FROM emails WHERE id IN (${placeholders})`,
                ids
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting multiple emails: ${error.message}`);
        }
    }

    static async updateUnreadStatus(id, unread) {
        try {
            const [result] = await db.query(
                'UPDATE emails SET unread = ? WHERE id = ?',
                [unread, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error updating email unread status: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM emails WHERE id = ?', [id]);
            if (rows.length === 0) return null;
            
            const email = rows[0];
            return {
                ...email,
                unread: !!email.unread,
                hasAttachments: !!email.hasAttachments,
                attachments: JSON.parse(email.attachments || '[]'),
                securityAnalysis: JSON.parse(email.securityAnalysis || '{}')
            };
        } catch (error) {
            throw new Error(`Error finding email by ID: ${error.message}`);
        }
    }
}
