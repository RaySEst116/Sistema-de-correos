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
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-red, #D50032)', marginBottom: '16px' }}></i>
                <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: '16px' }}>Cargando contactos...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'var(--text-main, #374151)',
                    margin: 0
                }}>
                    Gestión de Contactos
                </h2>
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        background: 'var(--primary-red, #D50032)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s',
                        boxShadow: '0 2px 4px rgba(213, 0, 50, 0.2)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#C20049';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-red, #D50032)';
                    }}
                >
                    <i className="fas fa-plus"></i>
                    Nuevo Contacto
                </button>
            </div>

            {showForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-card, #ffffff)',
                        padding: '24px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '480px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: 'var(--text-main, #374151)',
                            margin: '0 0 20px 0'
                        }}>
                            {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: 'var(--text-main, #374151)',
                                    marginBottom: '6px'
                                }}>
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    style={{
                                        width: '100%',
                                        border: '1px solid var(--border-color, #e5e7eb)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        fontSize: '14px',
                                        backgroundColor: 'var(--bg-card, #ffffff)',
                                        color: 'var(--text-main, #374151)',
                                        transition: 'border-color 0.2s'
                                    }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: 'var(--text-main, #374151)',
                                    marginBottom: '6px'
                                }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    style={{
                                        width: '100%',
                                        border: '1px solid var(--border-color, #e5e7eb)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        fontSize: '14px',
                                        backgroundColor: 'var(--bg-card, #ffffff)',
                                        color: 'var(--text-main, #374151)',
                                        transition: 'border-color 0.2s'
                                    }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="submit"
                                    style={{
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 16px',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        flex: 1
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#059669';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = '#10b981';
                                    }}
                                >
                                    {editingContact ? 'Actualizar' : 'Crear'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{
                                        background: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 16px',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        flex: 1
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4b5563';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = '#6b7280';
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{
                background: 'var(--bg-card, #ffffff)',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border-color, #e5e7eb)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{
                            background: 'var(--bg-hover, #f3f4f6)',
                            borderBottom: '1px solid var(--border-color, #e5e7eb)'
                        }}>
                            <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--text-muted, #6b7280)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>ID</th>
                            <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--text-muted, #6b7280)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>Nombre</th>
                            <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--text-muted, #6b7280)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>Email</th>
                            <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--text-muted, #6b7280)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map((contact) => (
                            <tr key={contact.id || contact.email} style={{
                                borderBottom: '1px solid var(--border-color, #e5e7eb)',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f3f4f6)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}>
                                <td style={{
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    color: 'var(--text-muted, #6b7280)',
                                    fontFamily: 'monospace'
                                }}>{contact.id || '-'}</td>
                                <td style={{
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    color: 'var(--text-main, #374151)',
                                    fontWeight: '500'
                                }}>{contact.name}</td>
                                <td style={{
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    color: 'var(--text-main, #374151)',
                                    fontFamily: 'monospace'
                                }}>{contact.email}</td>
                                <td style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    <button
                                        onClick={() => handleEdit(contact)}
                                        style={{
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 10px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = '#2563eb';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = '#3b82f6';
                                        }}
                                    >
                                        <i className="fas fa-edit"></i>
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => contact.id && handleDelete(contact.id)}
                                        style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 10px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = '#dc2626';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = '#ef4444';
                                        }}
                                    >
                                        <i className="fas fa-trash"></i>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {contacts.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '48px 24px',
                        color: 'var(--text-muted, #6b7280)'
                    }}>
                        <i className="fas fa-address-book" style={{
                            fontSize: '3rem',
                            marginBottom: '16px',
                            opacity: 0.5
                        }}></i>
                        <p style={{
                            fontSize: '16px',
                            margin: 0,
                            fontWeight: '500'
                        }}>
                            No hay contactos registrados
                        </p>
                        <p style={{
                            fontSize: '14px',
                            margin: '8px 0 0 0',
                            opacity: 0.8
                        }}>
                            Agrega tu primer contacto para comenzar
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactManagement;
