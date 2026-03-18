import { Contact } from '../models/Contact.js';

export class ContactController {
    static async getAllContacts(req, res) {
        try {
            const contacts = await Contact.findAll();
            res.json(contacts);
        } catch (error) {
            console.error('Error obteniendo contactos:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async createContact(req, res) {
        try {
            const contactData = req.body;
            const contactId = await Contact.create(contactData);
            
            // Devolver el contacto creado (asumiendo que se puede obtener por ID)
            res.status(201).json({ 
                success: true, 
                id: contactId,
                message: 'Contacto creado exitosamente' 
            });
        } catch (error) {
            console.error('Error creando contacto:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async updateContact(req, res) {
        try {
            const { id } = req.params;
            const contactData = req.body;
            
            const success = await Contact.update(id, contactData);
            
            if (success) {
                res.json({ success: true, message: 'Contacto actualizado exitosamente' });
            } else {
                res.status(404).json({ error: 'Contacto no encontrado' });
            }
        } catch (error) {
            console.error('Error actualizando contacto:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteContact(req, res) {
        try {
            const { id } = req.params;
            const success = await Contact.delete(id);
            
            if (success) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Contacto no encontrado' });
            }
        } catch (error) {
            console.error('Error eliminando contacto:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
