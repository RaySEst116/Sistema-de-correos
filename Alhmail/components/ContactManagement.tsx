import React, { useState, useEffect } from 'react';
import { contactService } from '../services/apiService';
import { Contact } from '../types';

const ContactManagement: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            const data = await contactService.getAll();
            setContacts(data);
        } catch (error) {
            console.error('Error cargando contactos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (editingContact) {
                await contactService.update(String(editingContact.id), formData);
            } else {
                await contactService.create(formData);
            }
            
            resetForm();
            loadContacts();
        } catch (error) {
            console.error('Error guardando contacto:', error);
        }
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setFormData({
            name: contact.name,
            email: contact.email
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string | number) => {
        if (confirm('¿Está seguro de eliminar este contacto?')) {
            try {
                await contactService.delete(String(id));
                loadContacts();
            } catch (error) {
                console.error('Error eliminando contacto:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '' });
        setEditingContact(null);
        setShowForm(false);
    };

    if (loading) {
        return <div className="p-4">Cargando contactos...</div>;
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Gestión de Contactos</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    Nuevo Contacto
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4">
                            {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    {editingContact ? 'Actualizar' : 'Crear'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">ID</th>
                            <th className="px-4 py-2 text-left">Nombre</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map((contact) => (
                            <tr key={contact.id || contact.email} className="border-t">
                                <td className="px-4 py-2">{contact.id || '-'}</td>
                                <td className="px-4 py-2">{contact.name}</td>
                                <td className="px-4 py-2">{contact.email}</td>
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => handleEdit(contact)}
                                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2 hover:bg-blue-600"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => contact.id && handleDelete(contact.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {contacts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No hay contactos registrados
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactManagement;
