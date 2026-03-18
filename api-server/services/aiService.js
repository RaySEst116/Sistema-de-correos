import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/app.js';

class AIService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.initializeAI();
    }

    initializeAI() {
        if (config.ai.enabled && config.ai.geminiKey) {
            try {
                this.genAI = new GoogleGenerativeAI(config.ai.geminiKey);
                this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                console.log('\x1b[32m%s\x1b[0m', 'Servicio IA inicializado correctamente');
            } catch (error) {
                console.error('\x1b[31m%s\x1b[0m', 'Error inicializando IA:', error.message);
                this.genAI = null;
                this.model = null;
            }
        } else {
            console.log('\x1b[33m%s\x1b[0m', 'IA desactivada - falta API Key o está deshabilitada');
        }
    }

    async generateEmailDraft(prompt, senderName) {
        if (!this.model) {
            throw new Error('Servicio IA no disponible');
        }

        if (!prompt || prompt.trim().length === 0) {
            throw new Error('La instrucción es requerida');
        }

        try {
            console.log('\x1b[36m%s\x1b[0m', '🤖 IA Procesando:', prompt);

            const fullPrompt = `
                Eres un asistente de correo electrónico corporativo inteligente.
                
                CONTEXTO:
                - Instrucción del usuario: "${prompt}"
                - Nombre del remitente (quien escribe): "${senderName || 'Un usuario'}"
                
                REGLAS:
                - Genera correos profesionales y corporativos
                - Usa un tono formal pero amigable
                - Sé conciso y ve al grano
                - Incluye saludo y despedida apropiados
                - Firma siempre con el nombre del remitente
                
                TAREA:
                Genera una respuesta en formato JSON ESTRICTO (sin markdown, sin comillas extra) con esta estructura:
                {
                    "to": "extrae el email del destinatario si se menciona en el texto, si no, null",
                    "subject": "crea un asunto breve y profesional relacionado con la instrucción",
                    "body": "redacta el cuerpo del correo en HTML simple (<p>, <br>, <b>, <i>). IMPORTANTE: Termina el correo con una despedida profesional y la firma usando el 'Nombre del remitente' proporcionado."
                }
                
                EJEMPLOS:
                - Si piden "contactar soporte técnico sobre un problema", generar un correo describiendo el problema de forma profesional
                - Si piden "agendar una reunión", generar un correo con propuesta de fechas/horas
                - Si piden "solicitar información", generar un correo formal pidiendo los detalles necesarios
            `;

            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            let text = response.text();

            // Limpieza de formato markdown
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            
            // Intentar parsear JSON
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(text);
            } catch (parseError) {
                console.error('\x1b[31m%s\x1b[0m', 'Error parseando JSON de IA:', text);
                throw new Error('La IA no pudo generar una respuesta válida');
            }

            // Validar estructura
            const validatedResponse = {
                to: jsonResponse.to || null,
                subject: jsonResponse.subject || 'Sin asunto',
                body: jsonResponse.body || '<p>Contenido no generado</p>'
            };

            console.log('\x1b[32m%s\x1b[0m', 'Correo generado exitosamente');
            return validatedResponse;

        } catch (error) {
            console.error('\x1b[31m%s\x1b[0m', 'Error generando correo:', error.message);
            
            if (error.message.includes('API_KEY')) {
                throw new Error('Error de configuración de API Key');
            } else if (error.message.includes('quota')) {
                throw new Error('Cuota de API excedida. Intenta más tarde');
            } else if (error.message.includes('timeout')) {
                throw new Error('Tiempo de espera agotado. Intenta de nuevo');
            } else {
                throw new Error('No se pudo generar el correo: ' + error.message);
            }
        }
    }

    isAvailable() {
        return this.model !== null;
    }

    getStatus() {
        return {
            enabled: config.ai.enabled,
            configured: !!config.ai.geminiKey,
            available: this.isAvailable(),
            model: this.model ? 'gemini-2.5-flash' : null
        };
    }
}

// Exportar singleton
export const aiService = new AIService();
