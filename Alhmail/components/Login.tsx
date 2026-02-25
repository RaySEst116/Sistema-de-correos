import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { db } from '../services/db';
import { wsService } from '../services/websocketService';

declare global {
  interface Window {
    Swal: any;
  }
}

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();
  const API_URL = 'http://localhost:3001';

  // Verificar estado del servidor al cargar el componente
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Conectar a WebSocket
        const socket = wsService.connect();
        
        // Esperar a que se conecte o timeout
        const waitForConnection = new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 3000);
          
          const onConnect = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          
          if (socket.connected) {
            clearTimeout(timeout);
            resolve(true);
          } else {
            socket.on('connect', onConnect);
          }
        });
        
        const connected = await waitForConnection;
        
        if (connected) {
          setServerStatus('online');
          
          // Verificar health por WebSocket
          try {
            const healthData = await wsService.healthCheck();
          } catch (healthError) {
            // Health check por WebSocket falló, pero conexión está activa
          }
        } else {
          setServerStatus('offline');
        }
        
      } catch (error) {
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    
    // Escuchar cambios de estado de conexión
    const handleConnectionStatus = (data: { connected: boolean }) => {
      setServerStatus(data.connected ? 'online' : 'offline');
    };
    
    wsService.on('connection-status', handleConnectionStatus);
    
    return () => {
      wsService.off('connection-status', handleConnectionStatus);
    };
  }, []);

  useEffect(() => {
    // Cargar SweetAlert2 si no está disponible
    if (!window.Swal) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verificar si el servidor está conectado por WebSocket
      const serverConnected = wsService.isConnected();
      let serverInfo = null;
      
      if (serverConnected) {
        // Obtener información del servidor
        try {
          serverInfo = await wsService.healthCheck();
        } catch (healthError) {
          // Health check por WebSocket falló, pero conexión está activa
        }
        
        // Intentar login normal por HTTP (el login sigue siendo HTTP por seguridad)
        try {
          const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(5000)
          });

          const data = await res.json();

          if (data.success) {
            localStorage.setItem('alhmail_token', data.token);
            localStorage.setItem('alhmail_user', JSON.stringify(data.user));
            
            // Mostrar mensaje de éxito con información del servidor
            if (window.Swal) {
              await window.Swal.fire({
                icon: 'success',
                title: '¡Inicio de sesión exitoso!',
                html: `
                  <div>Conectado por WebSocket correctamente</div>
                  <small style="color: #666;">
                    ${serverInfo ? `BD: ${serverInfo.services.database} | IA: ${serverInfo.services.gemini}` : 'Conexión activa'}
                  </small>
                `,
                timer: 2000,
                showConfirmButton: false
              });
            }

            // Usar db.login si existe, sino llamar directamente con el usuario del API
            try {
              const user = await db.login(email);
              onLogin(user);
              navigate('/inbox');
            } catch {
              // fallback: usar el usuario devuelto por la API
              onLogin(data.user);
              navigate('/inbox');
            }
            return;
          } else {
            setError(data.message || 'Usuario o contraseña incorrectos');
            return;
          }
        } catch (loginError) {
          console.error('Error en login con servidor:', loginError);
          setError('Error al iniciar sesión. Verifica tus credenciales.');
          return;
        }
      }

      // Modo offline cuando el servidor no está conectado por WebSocket
      if (!serverConnected) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUser = {
          id: 'offline-user',
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          email: email,
          role: email.includes('admin') ? 'admin' : 'user' as 'admin' | 'user',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=D50032&color=fff`
        };

        localStorage.setItem('alhmail_user', JSON.stringify(mockUser));
        
        if (window.Swal) {
          await window.Swal.fire({
            icon: 'warning',
            title: 'Modo Offline',
            html: `
              <div>Servidor no disponible</div>
              <small style="color: #666;">
                ${serverInfo ? `Estado: ${serverInfo.status}` : 'No se pudo conectar por WebSocket'}
              </small>
              <div style="margin-top: 10px;">Iniciando sesión en modo local...</div>
            `,
            timer: 2500,
            showConfirmButton: false
          });
        }

        onLogin(mockUser);
        navigate('/inbox');
        return;
      }

    } catch (err) {
      console.error('Error general en login:', err);
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!window.Swal) {
      alert('SweetAlert2 no está disponible. Recarga la página.');
      return;
    }

    const { value: email } = await window.Swal.fire({
      title: 'Recuperar Contraseña',
      text: 'Ingresa tu correo para recibir una nueva contraseña temporal.',
      input: 'email',
      inputPlaceholder: 'tu@correo.com',
      showCancelButton: true,
      confirmButtonColor: '#D50032',
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: (email) => {
        return fetch(`${API_URL}/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
          .then(response => {
            if (!response.ok) throw new Error(response.statusText);
            return response.json();
          })
          .catch(() => {
            window.Swal.showValidationMessage('Error: No se encontró el correo');
          });
      },
      allowOutsideClick: () => !window.Swal.isLoading()
    });

    if (email) {
      await window.Swal.fire({
        title: '¡Correo enviado!',
        text: 'Revisa tu bandeja de entrada para ver tu nueva contraseña.',
        icon: 'success',
        confirmButtonColor: '#D50032'
      });
    }
  };

  return (
    <div style={{
      margin: 0,
      padding: 0,
      fontFamily: "'Segoe UI', sans-serif",
      backgroundColor: '#f3f4f6',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#D50032', fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px' }}>
          <i className="fas fa-envelope-open-text"></i> Alhmail
        </div>
        
        {/* Indicador de estado del servidor */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '20px',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.85rem',
          backgroundColor: serverStatus === 'online' ? '#D1FAE5' : serverStatus === 'offline' ? '#FEE2E2' : '#F3F4F6',
          color: serverStatus === 'online' ? '#065F46' : serverStatus === 'offline' ? '#991B1B' : '#6B7280'
        }}>
          <i className={`fas ${serverStatus === 'checking' ? 'fa-circle-notch fa-spin' : serverStatus === 'online' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
          <span>
            {serverStatus === 'checking' ? 'Verificando servidor...' : 
             serverStatus === 'online' ? 'Servidor en línea' : 
             'Modo offline disponible'}
          </span>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '0.9rem' }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@alhmail.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#D50032')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
          </div>
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '0.9rem' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#D50032')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#D50032',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: 'background 0.2s',
              opacity: loading ? 0.7 : 1
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#C20049')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#D50032')}
          >
            {loading ? 'Conectando...' : 'Ingresar'}
          </button>
          {error && (
            <div style={{ color: '#D50032', fontSize: '0.9rem', marginTop: '15px' }}>
              {error}
            </div>
          )}

          <a
            type="button"
            onClick={handleForgotPassword}
            style={{
              display: 'block',
              marginTop: '15px',
              fontSize: '0.9rem',
              color: '#6b7280',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
              e.currentTarget.style.color = '#D50032';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.textDecoration = 'none';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            ¿Olvidaste tu contraseña?
          </a>
        </form>
      </div>
    </div>
  );
};

export default Login;