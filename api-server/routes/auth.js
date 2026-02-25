import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const router = Router();

// POST /auth/login - Iniciar sesión
router.post('/login', AuthController.login);

// POST /auth/register - Registrar nuevo usuario
router.post('/register', AuthController.register);

// POST /auth/logout - Cerrar sesión
router.post('/logout', AuthController.logout);

// GET /auth/profile - Obtener perfil de usuario (requiere autenticación)
router.get('/profile', AuthController.getProfile);

export default router;
