import React, { useState, useEffect } from 'react';
import { healthService } from '../services/apiService';

interface HealthData {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services: {
        database: 'connected' | 'disconnected';
        gemini: 'enabled' | 'disabled';
        port: number;
    };
}

const HealthStatus: React.FC = () => {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const checkHealth = async () => {
        try {
            const data = await healthService.check();
            setHealth(data);
        } catch (error) {
            console.error('Error checking health:', error);
            setHealth({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'disconnected',
                    gemini: 'disabled',
                    port: 3001
                }
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary-red, #D50032)', marginBottom: '16px' }}></i>
                <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: '16px' }}>Verificando estado del sistema...</p>
            </div>
        );
    }

    if (!health) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#ef4444', marginBottom: '16px' }}></i>
                <p style={{ color: '#ef4444', fontSize: '16px', fontWeight: '500' }}>No se pudo obtener el estado del sistema</p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'connected':
            case 'enabled':
                return { backgroundColor: '#f0fdf4', color: '#16a34a' };
            case 'unhealthy':
            case 'disconnected':
            case 'disabled':
                return { backgroundColor: '#fef2f2', color: '#dc2626' };
            default:
                return { backgroundColor: '#f9fafb', color: '#6b7280' };
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'connected':
            case 'enabled':
                return 'fas fa-check-circle';
            case 'unhealthy':
            case 'disconnected':
            case 'disabled':
                return 'fas fa-times-circle';
            default:
                return 'fas fa-question-circle';
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'var(--text-main, #374151)',
                margin: '0 0 24px 0'
            }}>
                Estado del Sistema
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'var(--bg-hover, #f3f4f6)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #e5e7eb)'
                }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-main, #374151)' }}>Estado General</span>
                    <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        ...getStatusColor(health.status)
                    }}>
                        <i className={`fas ${getStatusIcon(health.status)}`} style={{ marginRight: '6px' }}></i>
                        {health.status === 'healthy' ? 'Saludable' : 'No Saludable'}
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'var(--bg-hover, #f3f4f6)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #e5e7eb)'
                }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-main, #374151)' }}>Base de Datos</span>
                    <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        ...getStatusColor(health.services.database)
                    }}>
                        <i className={`fas ${getStatusIcon(health.services.database)}`} style={{ marginRight: '6px' }}></i>
                        {health.services.database === 'connected' ? 'Conectada' : 'Desconectada'}
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'var(--bg-hover, #f3f4f6)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #e5e7eb)'
                }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-main, #374151)' }}>IA (Gemini)</span>
                    <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        ...getStatusColor(health.services.gemini)
                    }}>
                        <i className={`fas ${getStatusIcon(health.services.gemini)}`} style={{ marginRight: '6px' }}></i>
                        {health.services.gemini === 'enabled' ? 'Habilitada' : 'Deshabilitada'}
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'var(--bg-hover, #f3f4f6)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #e5e7eb)'
                }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-main, #374151)' }}>Puerto</span>
                    <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af'
                    }}>
                        <i className="fas fa-server" style={{ marginRight: '6px' }}></i>
                        {health.services.port}
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'var(--bg-hover, #f3f4f6)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #e5e7eb)'
                }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-main, #374151)' }}>Última Verificación</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted, #6b7280)' }}>
                        <i className="fas fa-clock" style={{ marginRight: '6px' }}></i>
                        {new Date(health.timestamp).toLocaleString()}
                    </span>
                </div>
            </div>

            <div style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border-color, #e5e7eb)'
            }}>
                <button
                    onClick={checkHealth}
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
                    <i className="fas fa-sync-alt"></i>
                    Verificar Ahora
                </button>
            </div>
        </div>
    );
};

export default HealthStatus;
