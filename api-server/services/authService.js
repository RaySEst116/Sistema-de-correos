import { User } from '../models/User.js';

export class AuthService {
    static async login(email, password) {
        try {
            const user = await User.verifyCredentials(email, password);
            
            if (!user) {
                throw new Error('Credenciales inválidas');
            }
            
            // En una implementación real, aquí se generarían tokens JWT
            // Por ahora, devolvemos el usuario sin la contraseña
            const { password: _, ...userWithoutPassword } = user;
            
            return {
                success: true,
                user: userWithoutPassword
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    static async register(userData) {
        try {
            const existingUser = await User.findByEmail(userData.email);
            if (existingUser) {
                throw new Error('El usuario ya existe');
            }
            
            const userId = await User.create(userData);
            const user = await User.findById(userId);
            
            return {
                success: true,
                user
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }
}
