import React, { useState, useEffect } from 'react';
import { websocketService, NewEmailNotification } from '../services/websocket';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastNotificationProps {
  currentUserEmail?: string; // Agregar prop para recibir el email del usuario
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ currentUserEmail = '' }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Conectar al WebSocket
    websocketService.connect();

    // Escuchar nuevos correos
    const handleNewEmail = (data: NewEmailNotification) => {
      // SOLO mostrar toast al destinatario, nunca al remitente
      if (data.userEmail !== currentUserEmail && currentUserEmail) {
        const toast: Toast = {
          id: Date.now().toString(),
          message: `📧 Nuevo correo de ${data.email.sender}: ${data.email.subject}`,
          type: 'info',
          duration: 8000,
          action: {
            label: 'Ver correo',
            onClick: () => {
              // Redirigir a la bandeja de entrada
              window.location.hash = '#/inbox';
              // Cerrar este toast específicamente
              setToasts(prev => prev.filter(t => t.id !== toast.id));
            }
          }
        };
        
        setToasts(prev => [...prev, toast]);
      } else {
        // Toast NO mostrado (remitente o sin usuario)
      }
    };

    websocketService.on('new-email', handleNewEmail);

    return () => {
      websocketService.off('new-email', handleNewEmail);
    };
  }, [currentUserEmail]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
        return () => clearTimeout(timer);
      }
    });
  }, [toasts]);

  const getToastStyle = (type: Toast['type']) => {
    const baseStyle = {
      padding: '12px 20px',
      borderRadius: '8px',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: '350px',
      maxWidth: '450px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '1px solid',
      backgroundColor: 'var(--bg-card, #ffffff)',
      color: 'var(--text-main, #374151)',
      animation: 'slideInRight 0.3s ease-out'
    };

    const typeStyles = {
      success: {
        borderColor: 'var(--success-green, #10B981)',
        backgroundColor: '#f0fdf4',
        color: '#065f46'
      },
      info: {
        borderColor: 'var(--primary-red, #D50032)',
        backgroundColor: '#fef2f2',
        color: '#991b1b'
      },
      warning: {
        borderColor: '#f59e0b',
        backgroundColor: '#fffbeb',
        color: '#92400e'
      },
      error: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
        color: '#991b1b'
      }
    };

    return { ...baseStyle, ...typeStyles[type] };
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={getToastStyle(toast.type)}
          >
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              marginRight: '10px',
              flex: 1
            }}>
              <span style={{ marginBottom: toast.action ? '5px' : '0' }}>
                {toast.message}
              </span>
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  style={{
                    background: 'var(--primary-red, #D50032)',
                    color: 'white',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    alignSelf: 'flex-start'
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: 'inherit',
                padding: '0',
                lineHeight: '1',
                flexShrink: 0
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default ToastNotification;
