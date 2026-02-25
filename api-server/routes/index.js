import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import emailRoutes from './emails.js';
import contactRoutes from './contacts.js';
import healthRoutes from './health.js';

const router = Router();

// Rutas de salud
router.use('/', healthRoutes);

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de usuarios
router.use('/users', userRoutes);

// Rutas de emails
router.use('/emails', emailRoutes);

// Rutas de contactos
router.use('/contacts', contactRoutes);

export default router;
