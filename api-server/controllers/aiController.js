import { aiService } from '../services/aiService.js';

export class AIController {
    static async generateDraft(req, res) {
        try {
            const { prompt, senderName } = req.body;

            // Validar entrada
            if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: "La instrucción es requerida y no puede estar vacía" 
                });
            }

            if (prompt.length > 1000) {
                return res.status(400).json({ 
                    success: false, 
                    error: "La instrucción es demasiado larga (máximo 1000 caracteres)" 
                });
            }

            // Verificar disponibilidad del servicio IA
            if (!aiService.isAvailable()) {
                return res.status(503).json({ 
                    success: false, 
                    error: "Servicio de IA no disponible. Verifica la configuración." 
                });
            }

            // Generar borrador con IA
            const draft = await aiService.generateEmailDraft(prompt.trim(), senderName);


            res.json({
                success: true,
                data: draft,
                meta: {
                    promptLength: prompt.length,
                    generatedAt: new Date().toISOString(),
                    model: 'gemini-2.5-flash'
                }
            });

        } catch (error) {
            console.error('\x1b[31m%s\x1b[0m', 'Error en /ai/draft:', error.message);

            // Manejar diferentes tipos de error
            let statusCode = 500;
            let errorMessage = 'Error interno del servidor';

            if (error.message.includes('API Key') || error.message.includes('configuración')) {
                statusCode = 503;
                errorMessage = 'Error de configuración del servicio IA';
            } else if (error.message.includes('cuota') || error.message.includes('quota')) {
                statusCode = 429;
                errorMessage = 'Límite de uso excedido. Por favor intenta más tarde';
            } else if (error.message.includes('timeout') || error.message.includes('tiempo')) {
                statusCode = 408;
                errorMessage = 'Tiempo de espera agotado. Por favor intenta de nuevo';
            } else if (error.message.includes('disponible')) {
                statusCode = 503;
                errorMessage = error.message;
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    static async getStatus(req, res) {
        try {
            const status = aiService.getStatus();
            
            res.json({
                success: true,
                data: status,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('\x1b[31m%s\x1b[0m', 'Error en /ai/status:', error.message);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo estado del servicio IA'
            });
        }
    }
}
