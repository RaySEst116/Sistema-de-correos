import { User } from '../models/User.js';

export class UserController {
    static async getAllUsers(req, res) {
        try {
            const users = await User.findAll();
            res.json(users);
        } catch (error) {
            console.error('Error obteniendo usuarios:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            res.json(user);
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async createUser(req, res) {
        try {
            const { name, email, password, role } = req.body;
            
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
            }
            
            const userId = await User.create({ name, email, password, role });
            const user = await User.findById(userId);
            
            res.status(201).json(user);
        } catch (error) {
            console.error('Error creando usuario:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { name, role } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Nombre es requerido' });
            }
            
            const success = await User.update(id, { name, role });
            
            if (success) {
                const updatedUser = await User.findById(id);
                res.json(updatedUser);
            } else {
                res.status(404).json({ error: 'Usuario no encontrado' });
            }
        } catch (error) {
            console.error('Error actualizando usuario:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const success = await User.delete(id);
            
            if (success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Usuario no encontrado' });
            }
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
