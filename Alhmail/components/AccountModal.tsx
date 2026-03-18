import React, { useState, useEffect } from 'react';
import { User } from '../types';

declare global {
  interface Window {
    Swal: any;
  }
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (data: Partial<User>) => void;
  isCreating?: boolean;
  isAdmin?: boolean;
}

const translations = {
  es: {
    my_account: 'Mi Cuenta',
    new: 'Nuevo',
    edit: 'Editar',
    name: 'Nombre',
    email: 'Email',
    password: 'Contraseña',
    role: 'Rol',
    save_changes: 'Guardar Cambios',
    cancel: 'Cancelar',
    admin: 'ADMIN',
    user: 'USUARIO',
    saved_success: 'Guardado',
    error: 'Error',
  },
  en: {
    my_account: 'My Account',
    new: 'New',
    edit: 'Edit',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    role: 'Role',
    save_changes: 'Save Changes',
    cancel: 'Cancel',
    admin: 'ADMIN',
    user: 'USER',
    saved_success: 'Saved',
    error: 'Error',
  },
};

const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  isCreating = false,
  isAdmin = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin',
  });
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>('es');

  useEffect(() => {
    const lang = localStorage.getItem('alhmail_lang') as 'es' | 'en' || 'es';
    setCurrentLang(lang);
  }, []);

  useEffect(() => {
    if (!isCreating) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });
    }
  }, [user, isCreating, isOpen]);

  const t = translations[currentLang];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      if (!window.Swal) {
        alert(t.saved_success);
        onClose();
        return;
      }
      await window.Swal.fire({
        icon: 'success',
        title: t.saved_success,
        timer: 1000,
        showConfirmButton: false,
      });
      onClose();
    } catch (err: any) {
      if (!window.Swal) {
        alert(t.error + ': ' + (err.message || err));
        return;
      }
      await window.Swal.fire({
        icon: 'error',
        title: t.error,
        text: err.message || err,
      });
    }
  };

  const isMyAccount = !isCreating && user.id === user.id;
  const canEdit = isCreating || isAdmin || (isMyAccount && isAdmin);

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
          width: '400px',
          padding: '30px',
          border: '1px solid var(--border-color, #e5e7eb)',
          color: 'var(--text-main, #374151)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>
            {isCreating ? t.new : isMyAccount ? t.my_account : t.edit}
          </h3>
          <i
            className="fas fa-times"
            onClick={onClose}
            style={{ cursor: 'pointer', color: 'var(--text-muted, #6b7280)', fontSize: '1.2rem' }}
          />
        </div>

        {!isCreating && (
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '15px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                background:
                  formData.role === 'admin'
                    ? 'rgba(213, 0, 50, 0.1)'
                    : 'rgba(67, 56, 202, 0.1)',
                color: formData.role === 'admin' ? 'var(--primary-red, #D50032)' : '#4338ca',
              }}
            >
              {formData.role === 'admin' ? t.admin : t.user}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginTop: '15px', fontWeight: '600', fontSize: '0.9rem' }}>
            {t.name}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!canEdit}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: '6px',
              outline: 'none',
              marginTop: '5px',
              background: 'var(--input-bg, #f9fafb)',
              color: 'var(--text-main, #374151)',
            }}
          />

          <label style={{ display: 'block', marginTop: '15px', fontWeight: '600', fontSize: '0.9rem' }}>
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!isCreating}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: '6px',
              outline: 'none',
              marginTop: '5px',
              background: 'var(--input-bg, #f9fafb)',
              color: 'var(--text-main, #374151)',
            }}
          />

          <label style={{ display: 'block', marginTop: '15px', fontWeight: '600', fontSize: '0.9rem' }}>
            {t.password}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            disabled={!canEdit}
            placeholder={isMyAccount && !isAdmin ? '********' : ''}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: '6px',
              outline: 'none',
              marginTop: '5px',
              background: 'var(--input-bg, #f9fafb)',
              color: 'var(--text-main, #374151)',
            }}
          />

          {(isCreating || isAdmin) && (
            <>
              <label style={{ display: 'block', marginTop: '15px', fontWeight: '600', fontSize: '0.9rem' }}>
                {t.role}
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  borderRadius: '6px',
                  outline: 'none',
                  marginTop: '5px',
                  background: 'var(--input-bg, #f9fafb)',
                  color: 'var(--text-main, #374151)',
                }}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </>
          )}

          {canEdit && (
            <div style={{ textAlign: 'right', marginTop: '25px' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: 'var(--primary-red, #D50032)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 24px',
                  borderRadius: '4px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {t.save_changes}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AccountModal;
