import React, { useState, useEffect } from 'react';
import { websocketService, NewEmailNotification } from '../services/websocket';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

const ToastNotification: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Conectar al WebSocket
    websocketService.connect();

    // Escuchar nuevos correos
    const handleNewEmail = (data: NewEmailNotification) => {
      const toast: Toast = {
        id: Date.now().toString(),
        message: `📧 Nuevo correo de ${data.email.sender}: ${data.email.subject}`,
        type: 'info',
        duration: 5000
      };
      
      setToasts(prev => [...prev, toast]);
    };

    websocketService.on('new-email', handleNewEmail);

    return () => {
      websocketService.off('new-email', handleNewEmail);
    };
  }, []);

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
      minWidth: '300px',
      maxWidth: '400px',
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
            <span style={{ marginRight: '10px' }}>
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: 'inherit',
                padding: '0',
                lineHeight: '1'
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
