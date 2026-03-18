import React, { useState, useEffect } from 'react';
import { userService } from '../services/apiService';
import { User } from '../types';
import '../styles/components/UserManagement.css';

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
        <div className="user-management-container">
            <div className="user-management-header">
                <h2 className="user-management-title">
                    Gestión de Usuarios
                </h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="user-management-add-btn"
                >
                    <i className="fas fa-plus"></i>
                    Nuevo Usuario
                </button>
            </div>

            {showForm && (
                <div className="user-management-modal-overlay">
                    <div className="user-management-modal">
                        <h3 className="user-management-modal-title">
                            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="user-management-form-group">
                                <label className="user-management-form-label">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="user-management-form-input"
                                    required
                                />
                            </div>
                            <div className="user-management-form-group">
                                <label className="user-management-form-label">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="user-management-form-input"
                                    required
                                    disabled={!!editingUser}
                                />
                            </div>
                            {!editingUser && (
                                <div className="user-management-form-group">
                                    <label className="user-management-form-label">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="user-management-form-input"
                                        required
                                    />
                                </div>
                            )}
                            <div className="user-management-form-group">
                                <label className="user-management-form-label">
                                    Rol
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    className="user-management-form-select"
                                >
                                    <option value="user">Usuario</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div className="user-management-form-actions">
                                <button
                                    type="submit"
                                    className="user-management-submit-btn"
                                >
                                    {editingUser ? 'Actualizar' : 'Crear'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="user-management-cancel-btn"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="user-management-table-container">
                <table className="user-management-table">
                    <thead>
                        <tr className="user-management-table-header">
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="user-management-table-row">
                                <td className="user-management-table-cell id">{user.id}</td>
                                <td className="user-management-table-cell name">{user.name}</td>
                                <td className="user-management-table-cell email">{user.email}</td>
                                <td className="user-management-table-cell">
                                    <span className={`user-management-role-badge ${user.role}`}>
                                        {user.role === 'admin' ? 'Admin' : 'Usuario'}
                                    </span>
                                </td>
                                <td className="user-management-table-cell actions">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="user-management-action-btn user-management-edit-btn"
                                    >
                                        <i className="fas fa-edit"></i>
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="user-management-action-btn user-management-delete-btn"
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
                    <div className="user-management-empty-state">
                        <i className="fas fa-users user-management-empty-icon"></i>
                        <p className="user-management-empty-title">
                            No hay usuarios registrados
                        </p>
                        <p className="user-management-empty-subtitle">
                            Crea tu primer usuario para comenzar
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
