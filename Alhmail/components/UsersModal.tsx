import React, { useState, useEffect } from 'react';
import { User } from '../types';

declare global {
  interface Window {
    Swal: any;
  }
}

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  currentUserId: string;
}

const translations = {
  es: {
    user_management: 'Gestión de Usuarios',
    new: 'Nuevo',
    name: 'Nombre',
    email: 'Email',
    role: 'Rol',
    actions: 'Acciones',
    admin: 'Administrador',
    user: 'Usuario',
    delete_confirm: '¿Borrar?',
    deleted: 'Eliminado',
    error: 'Error',
  },
  en: {
    user_management: 'User Management',
    new: 'New',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    actions: 'Actions',
    admin: 'Admin',
    user: 'User',
    delete_confirm: 'Delete?',
    deleted: 'Deleted',
    error: 'Error',
  },
};

const UsersModal: React.FC<UsersModalProps> = ({
  isOpen,
  onClose,
  users,
  onEdit,
  onDelete,
  onCreate,
  currentUserId,
}) => {
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>('es');

  useEffect(() => {
    const lang = localStorage.getItem('alhmail_lang') as 'es' | 'en' || 'es';
    setCurrentLang(lang);
  }, []);

  const t = translations[currentLang];

  if (!isOpen) return null;

  const handleDelete = async (id: string, name: string) => {
    if (!window.Swal) {
      if (confirm(`${t.delete_confirm} ${name}?`)) {
        try {
          await onDelete(id);
          alert(t.deleted);
        } catch (err: any) {
          alert(t.error + ': ' + (err.message || err));
        }
      }
      return;
    }

    const result = await window.Swal.fire({
      title: `${t.delete_confirm} ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D50032',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await onDelete(id);
        await window.Swal.fire({
          icon: 'success',
          title: t.deleted,
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (err: any) {
        await window.Swal.fire({
          icon: 'error',
          title: t.error,
          text: err.message || err,
        });
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'all' : 'none',
        transition: 'opacity 0.2s',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          width: '800px',
          maxHeight: '80vh',
          padding: '20px',
          border: '1px solid var(--border-color, #e5e7eb)',
          color: 'var(--text-main, #374151)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: 'var(--bg-hover, #f3f4f6)',
            padding: '10px 15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color, #e5e7eb)',
            borderRadius: '10px 10px 0 0',
            color: 'var(--text-main, #374151)',
          }}
        >
          <h3 style={{ margin: 0, color: 'var(--primary-red, #D50032)' }}>
            {t.user_management}
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onCreate}
              style={{
                background: 'var(--primary-red, #D50032)',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <i className="fas fa-plus"></i> {t.new}
            </button>
            <i
              className="fas fa-times"
              onClick={onClose}
              style={{ cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted, #6b7280)' }}
            />
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: 'var(--text-main, #374151)',
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--border-color, #e5e7eb)', color: 'var(--text-muted, #6b7280)', fontWeight: '600', fontSize: '0.9rem' }}>
                  {t.name}
                </th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--border-color, #e5e7eb)', color: 'var(--text-muted, #6b7280)', fontWeight: '600', fontSize: '0.9rem' }}>
                  {t.email}
                </th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--border-color, #e5e7eb)', color: 'var(--text-muted, #6b7280)', fontWeight: '600', fontSize: '0.9rem' }}>
                  {t.role}
                </th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--border-color, #e5e7eb)', color: 'var(--text-muted, #6b7280)', fontWeight: '600', fontSize: '0.9rem' }}>
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #e5e7eb)', color: 'var(--text-main, #374151)' }}>
                    {u.name}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #e5e7eb)', color: 'var(--text-main, #374151)' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #e5e7eb)', color: 'var(--text-main, #374151)' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        background:
                          u.role === 'admin'
                            ? 'rgba(213, 0, 50, 0.1)'
                            : 'rgba(67, 56, 202, 0.1)',
                        color: u.role === 'admin' ? 'var(--primary-red, #D50032)' : '#4338ca',
                      }}
                    >
                      {u.role === 'admin' ? t.admin : t.user}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #e5e7eb)', color: 'var(--text-main, #374151)' }}>
                    <button
                      onClick={() => onEdit(u)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '5px',
                        fontSize: '1rem',
                        transition: '0.2s',
                        borderRadius: '4px',
                        color: '#3b82f6',
                        marginRight: '5px',
                      }}
                      title="Editar"
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: '5px',
                          fontSize: '1rem',
                          transition: '0.2s',
                          borderRadius: '4px',
                          color: '#ef4444',
                        }}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersModal;
