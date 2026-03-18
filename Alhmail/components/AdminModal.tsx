import React, { useState } from 'react';
import UserManagement from './UserManagement';
import ContactManagement from './ContactManagement';
import HealthStatus from './HealthStatus';

type AdminTab = 'users' | 'contacts' | 'health';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, isMobile = false }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const tabs = [
    { id: 'users' as AdminTab, label: 'Usuarios', icon: '👥' },
    { id: 'contacts' as AdminTab, label: 'Contactos', icon: '📇' },
    { id: 'health' as AdminTab, label: 'Estado', icon: '🏥' }
  ];

  if (!isOpen) return null;

  const modalStyle = isMobile ? {
    position: 'fixed' as const,
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    background: 'var(--bg-main, #f5f7fa)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column' as const,
  } : {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '1200px',
    height: '85vh',
    background: 'var(--bg-card, #ffffff)',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column' as const,
    border: '1px solid var(--border-color, #e5e7eb)',
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div style={modalStyle}>
        {/* Header */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          borderBottom: '1px solid var(--border-color, #e5e7eb)',
          padding: isMobile ? '16px' : '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 'bold',
            color: 'var(--text-main, #374151)',
          }}>
            Panel de Administración
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--text-muted, #6b7280)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f3f4f6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          borderBottom: '1px solid var(--border-color, #e5e7eb)',
          padding: isMobile ? '0 16px' : '0 20px',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            overflowX: isMobile ? 'auto' : 'visible',
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: isMobile ? '12px 8px' : '16px 0',
                  borderBottom: `2px solid ${
                    activeTab === tab.id
                      ? 'var(--primary-red, #D50032)'
                      : 'transparent'
                  }`,
                  color: activeTab === tab.id
                    ? 'var(--primary-red, #D50032)'
                    : 'var(--text-muted, #6b7280)',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  fontSize: isMobile ? '0.875rem' : '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  marginRight: isMobile ? '16px' : '32px',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseOver={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--text-main, #374151)';
                  }
                }}
                onMouseOut={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
                  }
                }}
              >
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '16px' : '24px',
          background: isMobile ? 'var(--bg-main, #f5f7fa)' : 'var(--bg-card, #ffffff)',
        }}>
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'contacts' && <ContactManagement />}
          {activeTab === 'health' && <HealthStatus />}
        </div>
      </div>
    </>
  );
};

export default AdminModal;
