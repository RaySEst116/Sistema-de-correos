import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';

const router = Router();

// GET /emails - Obtener emails de un usuario
router.get('/', EmailController.getUserEmails);

// POST /emails - Enviar email interno
router.post('/', EmailController.sendEmail);

// POST /emails/downloaded - Eliminar emails descargados
router.post('/downloaded', EmailController.deleteDownloadedEmails);

// DELETE /emails/:id - Eliminar email específico
router.delete('/:id', EmailController.deleteEmail);

// PUT /emails/:id - Actualizar estado de email (leído/no leído)
router.put('/:id', EmailController.updateEmailStatus);

export default router;
