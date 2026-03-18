import { Router } from 'express';
import { ContactController } from '../controllers/contactController.js';

const router = Router();

// GET /contacts - Obtener todos los contactos
router.get('/', ContactController.getAllContacts);

// POST /contacts - Crear nuevo contacto
router.post('/', ContactController.createContact);

// PUT /contacts/:id - Actualizar contacto
router.put('/:id', ContactController.updateContact);

// DELETE /contacts/:id - Eliminar contacto
router.delete('/:id', ContactController.deleteContact);

export default router;
