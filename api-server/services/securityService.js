import { db } from '../config/database.js';
import { config } from '../config/app.js';

export class SecurityService {
    static async analyzeEmailSecurity(sender, subject, body, attachments) {
        let score = 0;
        let threats = [];
        let status = "clean";
        let folder = "inbox";

        // 1. VERIFICAR LISTAS EN SQL
        const cleanSender = sender.includes('<') ? sender.match(/<([^>]+)>/)[1] : sender;
        try {
            const [rules] = await db.query("SELECT type FROM email_rules WHERE email = ?", [cleanSender]);
            if (rules.length > 0) {
                if (rules[0].type === 'block') {
                    return { score: 100, threats: ["Remitente Bloqueado (Blacklist)"], status: "blocked", folder: "spam" };
                }
                if (rules[0].type === 'allow') {
                    return { score: 0, threats: ["Remitente Confiable (Whitelist)"], status: "verified", folder: "inbox" };
                }
            }
        } catch (e) {
        }

        // 2. ESCANEO DE CONTENIDO
        const content = (subject + " " + body).toLowerCase();
        config.security.spamKeywords.forEach(word => {
            if (content.includes(word)) {
                score += 25;
                threats.push(`Palabra sospechosa: '${word}'`);
            }
        });

        // 3. ESCANEO DE ADJUNTOS
        if (attachments && Array.isArray(attachments)) {
            attachments.forEach(file => {
                const fname = file.filename || "";
                const ext = fname.slice(((fname.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
                if (config.security.dangerousExtensions.includes('.' + ext)) {
                    score += 100;
                    threats.push(`Adjunto ejecutable detectado: ${fname}`);
                }
            });
        }

        // 4. EVALUACIÓN
        if (score >= 100) {
            status = "infected";
            folder = "spam";
        } else if (score >= 25) {
            status = "suspicious";
            folder = "spam";
        }

        return { score, threats, status, folder };
    }

    static isSpamContent(subject, body) {
        const content = ((subject || '') + ' ' + (body || '')).toLowerCase();
        return config.security.spamKeywords.some(word => content.includes(word));
    }

    static hasDangerousAttachments(attachments) {
        if (!attachments || !Array.isArray(attachments)) return false;
        
        return attachments.some(file => {
            const fname = file.filename || "";
            const ext = fname.slice(((fname.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
            return config.security.dangerousExtensions.includes('.' + ext);
        });
    }
}
