import { Router } from 'express';
import { UserController } from '../controllers/userController.js';

const router = Router();

// GET /users - Obtener todos los usuarios
router.get('/', UserController.getAllUsers);

// GET /users/:id - Obtener usuario por ID
router.get('/:id', UserController.getUserById);

// POST /users - Crear nuevo usuario
router.post('/', UserController.createUser);

// PUT /users/:id - Actualizar usuario
router.put('/:id', UserController.updateUser);

// DELETE /users/:id - Eliminar usuario
router.delete('/:id', UserController.deleteUser);

export default router;
