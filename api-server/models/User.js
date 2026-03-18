import { db } from '../config/database.js';

export class User {
    static async findByEmail(email) {
        try {
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error finding user by email: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error finding user by ID: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await db.query('SELECT id, name, email, role FROM users');
            return rows;
        } catch (error) {
            throw new Error(`Error finding all users: ${error.message}`);
        }
    }

    static async create(userData) {
        try {
            const { name, email, password, role } = userData;
            const [result] = await db.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, password, role]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
    }

    static async update(id, userData) {
        try {
            const { name, role } = userData;
            const [result] = await db.query(
                'UPDATE users SET name = ?, role = ? WHERE id = ?',
                [name, role, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }
    }

    static async verifyCredentials(email, password) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM users WHERE email = ? AND password = ?',
                [email, password]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Error verifying credentials: ${error.message}`);
        }
    }
}
