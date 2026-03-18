
import { GoogleGenAI, Type } from "@google/genai";
import { FolderType, SecurityAnalysis } from "../types";

// Solo inicializar si tenemos API Key y no estamos en navegador
const ai = typeof window !== 'undefined' && process.env?.API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.API_KEY }) 
  : null;

const MODEL_NAME = 'gemini-2.5-flash';

interface ClassificationResult {
    category: FolderType;
    riskLevel: 'safe' | 'suspicious' | 'high';
    riskReason: string;
    securityAnalysis: SecurityAnalysis;
}

/**
 * Classifies an email content into a folder, specifically looking for security threats.
 */
export const classifyEmailContent = async (
    subject: string, 
    body: string, 
    sender: string,
    replyTo?: string,
    hasAttachment?: boolean,
    attachmentName?: string
): Promise<ClassificationResult> => {
    
    // Si no hay AI disponible, usar clasificación simulada
    if (!ai) {
        return simulateClassification(subject, body, sender, replyTo, hasAttachment, attachmentName);
    }
    
    // Construct a prompt that simulates a backend security appliance (like Proofpoint or Barracuda)
    const prompt = `
        You are an advanced Cybersecurity Email Firewall.
        Analyze the following email metadata and content for threats.

        Input Data:
        From: "${sender}"
        Reply-To: "${replyTo || sender}"
        Subject: "${subject}"
        Body: "${body}"
        Attachment: "${hasAttachment ? (attachmentName || 'Yes') : 'None'}"

        Simulation Logic (Perform these checks):
        1. SPF/DKIM Simulation: If the "From" domain is a major provider (google, microsoft, etc) but the context implies it's spam, fail the SPF.
        2. Spoofing: If "Reply-To" is different from "From" and looks suspicious, flag it.
        3. Attachment: If attachment ends in .exe, .bat, .scr, .js, it is MALWARE (High Risk).
        4. Phishing: Look for urgency, bad grammar, mismatched links, or requests for credentials.

        Output Requirements:
        - category: 'quarantine' if risk is high/suspicious.
        - riskLevel: 'high' for malware/phishing, 'suspicious' for spam/spoofing, 'safe' for legitimate.
        - securityAnalysis: Provide simulated forensic results.
        
        Output JSON Schema:
        {
            "category": "quarantine" | "inbox" | "work" | "personal" | "spam",
            "riskLevel": "safe" | "suspicious" | "high",
            "riskReason": "string",
            "securityAnalysis": {
                "spf": "pass" | "fail" | "softfail",
                "dkim": "pass" | "fail" | "none",
                "dmarc": "pass" | "fail",
                "ipReputation": "clean" | "blacklisted" | "suspicious",
                "confidenceScore": number
            }
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, enum: ['inbox', 'spam', 'work', 'personal', 'quarantine'] },
                        riskLevel: { type: Type.STRING, enum: ['safe', 'suspicious', 'high'] },
                        riskReason: { type: Type.STRING },
                        securityAnalysis: {
                            type: Type.OBJECT,
                            properties: {
                                spf: { type: Type.STRING },
                                dkim: { type: Type.STRING },
                                dmarc: { type: Type.STRING },
                                ipReputation: { type: Type.STRING },
                                confidenceScore: { type: Type.INTEGER }
                            }
                        }
                    }
                }
            }
        });
        
        const result = JSON.parse(response.text || '{}');
        return {
            category: result.category as FolderType || 'inbox',
            riskLevel: result.riskLevel as 'safe' | 'suspicious' | 'high' || 'safe',
            riskReason: result.riskReason || 'No threats detected',
            securityAnalysis: result.securityAnalysis || { spf: 'pass', dkim: 'pass', dmarc: 'pass', ipReputation: 'clean', confidenceScore: 100 }
        };

    } catch (error) {
        console.error("Gemini Classification Error:", error);
        return simulateClassification(subject, body, sender, replyTo, hasAttachment, attachmentName);
    }
};

// Función de clasificación simulada para fallback
function simulateClassification(
    subject: string, 
    body: string, 
    sender: string,
    replyTo?: string,
    hasAttachment?: boolean,
    attachmentName?: string
): ClassificationResult {
    
    const lowerSubject = subject.toLowerCase();
    const lowerBody = body.toLowerCase();
    const lowerSender = sender.toLowerCase();
    
    // Detectar amenazas comunes
    const isPhishing = lowerSubject.includes('urgente') || 
                      lowerSubject.includes('verificar') || 
                      lowerBody.includes('contraseña') ||
                      lowerBody.includes('clic aquí') ||
                      lowerSender.includes('noreply');
    
    const isMalware = hasAttachment && (
        attachmentName?.endsWith('.exe') ||
        attachmentName?.endsWith('.bat') ||
        attachmentName?.endsWith('.scr') ||
        attachmentName?.endsWith('.js')
    );
    
    const isSpoofed = replyTo && replyTo !== sender;
    
    if (isMalware) {
        return {
            category: 'quarantine',
            riskLevel: 'high',
            riskReason: 'Executable attachment detected',
            securityAnalysis: {
                spf: 'fail',
                dkim: 'none',
                dmarc: 'fail',
                ipReputation: 'blacklisted',
                confidenceScore: 15
            }
        };
    }
    
    if (isPhishing) {
        return {
            category: 'quarantine',
            riskLevel: 'high',
            riskReason: 'Phishing patterns detected',
            securityAnalysis: {
                spf: 'softfail',
                dkim: 'fail',
                dmarc: 'fail',
                ipReputation: 'suspicious',
                confidenceScore: 25
            }
        };
    }
    
    if (isSpoofed) {
        return {
            category: 'spam',
            riskLevel: 'suspicious',
            riskReason: 'Reply-To address differs from sender',
            securityAnalysis: {
                spf: 'fail',
                dkim: 'pass',
                dmarc: 'softfail',
                ipReputation: 'suspicious',
                confidenceScore: 45
            }
        };
    }
    
    // Email seguro por defecto
    return {
        category: 'inbox',
        riskLevel: 'safe',
        riskReason: 'No threats detected',
        securityAnalysis: {
            spf: 'pass',
            dkim: 'pass',
            dmarc: 'pass',
            ipReputation: 'clean',
            confidenceScore: 95
        }
    };
}

/**
 * Generates a synthetic email for random testing.
 */
export const generateSyntheticEmail = async () => {
    // Existing function logic (kept simple for brevity, logic moved to new injector)
    const prompt = `Generate a realistic JSON email. 40% chance of being phishing/malware.`;
    // ... (This function remains auxiliary, the real power is now in the Injector)
    return { sender: 'test', subject: 'test', body: 'test' }; // Placeholder, actual usage in App.tsx calls classify directly
};
