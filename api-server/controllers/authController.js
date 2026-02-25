import { AuthService } from '../services/authService.js';

export class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email y contraseña son requeridos' });
            }
            
            const result = await AuthService.login(email, password);
            res.json(result);
        } catch (error) {
            console.error('Error en login:', error);
            res.status(401).json({ error: error.message });
        }
    }

    static async register(req, res) {
        try {
            const { name, email, password, role = 'user' } = req.body;
            
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
            }
            
            const result = await AuthService.register({ name, email, password, role });
            res.status(201).json(result);
        } catch (error) {
            console.error('Error en registro:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async logout(req, res) {
        try {
            // En una implementación con JWT, aquí se invalidaría el token
            // Por ahora, simplemente respondemos con éxito
            res.json({ success: true, message: 'Sesión cerrada correctamente' });
        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getProfile(req, res) {
        try {
            // En una implementación con middleware de autenticación,
            // req.user contendría la información del usuario autenticado
            // Por ahora, este endpoint necesita ser implementado con autenticación
            res.status(501).json({ error: 'Endpoint no implementado - requiere autenticación' });
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
