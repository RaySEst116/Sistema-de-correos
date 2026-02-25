import React, { useState, useEffect } from 'react';
import { userService } from '../services/apiService';
import { User } from '../types';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await userService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (editingUser) {
                await userService.update(editingUser.id, {
                    name: formData.name,
                    role: formData.role
                });
            } else {
                await userService.create(formData);
            }
            
            resetForm();
            loadUsers();
        } catch (error) {
            console.error('Error guardando usuario:', error);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Está seguro de eliminar este usuario?')) {
            try {
                await userService.delete(id);
                loadUsers();
            } catch (error) {
                console.error('Error eliminando usuario:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', role: 'user' });
        setEditingUser(null);
        setShowForm(false);
    };

    if (loading) {
        return <div className="p-4">Cargando usuarios...</div>;
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
                    Gestión de Usuarios
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
                    Nuevo Usuario
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
                            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                            <div style={{ marginBottom: '16px' }}>
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
                                        backgroundColor: editingUser ? 'var(--bg-hover, #f3f4f6)' : 'var(--bg-card, #ffffff)',
                                        color: 'var(--text-main, #374151)',
                                        transition: 'border-color 0.2s'
                                    }}
                                    required
                                    disabled={!!editingUser}
                                />
                            </div>
                            {!editingUser && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: 'var(--text-main, #374151)',
                                        marginBottom: '6px'
                                    }}>
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                            )}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: 'var(--text-main, #374151)',
                                    marginBottom: '6px'
                                }}>
                                    Rol
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
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
                                >
                                    <option value="user">Usuario</option>
                                    <option value="admin">Administrador</option>
                                </select>
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
                                    {editingUser ? 'Actualizar' : 'Crear'}
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
                            }}>Rol</th>
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
                        {users.map((user) => (
                            <tr key={user.id} style={{
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
                                }}>{user.id}</td>
                                <td style={{
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    color: 'var(--text-main, #374151)',
                                    fontWeight: '500'
                                }}>{user.name}</td>
                                <td style={{
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    color: 'var(--text-main, #374151)',
                                    fontFamily: 'monospace'
                                }}>{user.email}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.025em',
                                        ...(user.role === 'admin' 
                                            ? { backgroundColor: '#fef2f2', color: '#dc2626' }
                                            : { backgroundColor: '#f0fdf4', color: '#16a34a' })
                                    }}>
                                        {user.role === 'admin' ? 'Admin' : 'Usuario'}
                                    </span>
                                </td>
                                <td style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    <button
                                        onClick={() => handleEdit(user)}
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
                                        onClick={() => handleDelete(user.id)}
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
                {users.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '48px 24px',
                        color: 'var(--text-muted, #6b7280)'
                    }}>
                        <i className="fas fa-users" style={{
                            fontSize: '3rem',
                            marginBottom: '16px',
                            opacity: 0.5
                        }}></i>
                        <p style={{
                            fontSize: '16px',
                            margin: 0,
                            fontWeight: '500'
                        }}>
                            No hay usuarios registrados
                        </p>
                        <p style={{
                            fontSize: '14px',
                            margin: '8px 0 0 0',
                            opacity: 0.8
                        }}>
                            Crea tu primer usuario para comenzar
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
