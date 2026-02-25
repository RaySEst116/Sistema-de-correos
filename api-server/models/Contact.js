import { db } from '../config/database.js';

export class Contact {
    static async findAll() {
        try {
            const [rows] = await db.query('SELECT * FROM contacts');
            return rows;
        } catch (error) {
            throw new Error(`Error finding all contacts: ${error.message}`);
        }
    }

    static async create(contactData) {
        try {
            const [result] = await db.query('INSERT INTO contacts SET ?', contactData);
            return result.insertId;
        } catch (error) {
            throw new Error(`Error creating contact: ${error.message}`);
        }
    }

    static async update(id, contactData) {
        try {
            const [result] = await db.query(
                'UPDATE contacts SET ? WHERE id = ?',
                [contactData, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error updating contact: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM contacts WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting contact: ${error.message}`);
        }
    }
}
