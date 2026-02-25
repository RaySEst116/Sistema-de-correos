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
            <div className="p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-600">Verificando estado del sistema...</div>
            </div>
        );
    }

    if (!health) {
        return (
            <div className="p-4 bg-white rounded-lg">
                <div className="text-sm text-red-600">No se pudo obtener el estado del sistema</div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'connected':
            case 'enabled':
                return 'text-green-600 bg-green-100';
            case 'unhealthy':
            case 'disconnected':
            case 'disabled':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'connected':
            case 'enabled':
                return '✓';
            case 'unhealthy':
            case 'disconnected':
            case 'disabled':
                return '✗';
            default:
                return '?';
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Estado General</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
                        {getStatusIcon(health.status)} {health.status.toUpperCase()}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Base de Datos</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.database)}`}>
                        {getStatusIcon(health.services.database)} {health.services.database.toUpperCase()}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">IA (Gemini)</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.gemini)}`}>
                        {getStatusIcon(health.services.gemini)} {health.services.gemini.toUpperCase()}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Puerto</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-600">
                        {health.services.port}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="font-medium">Última Verificación</span>
                    <span className="text-sm text-gray-600">
                        {new Date(health.timestamp).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t">
                <button
                    onClick={checkHealth}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                >
                    Verificar Ahora
                </button>
            </div>
        </div>
    );
};

export default HealthStatus;
