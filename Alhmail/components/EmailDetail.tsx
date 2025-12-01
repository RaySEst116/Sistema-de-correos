
import React from 'react';
import { Email } from '../types';
import SecurityForensics from './SecurityForensics';

interface EmailDetailProps {
    email: Email | null;
    onAdminAction: (action: 'block' | 'allow', email: Email) => void;
}

const EmailDetail: React.FC<EmailDetailProps> = ({ email, onAdminAction }) => {
    if (!email) {
        return (
            <div className="flex-grow h-full flex flex-col items-center justify-center text-gray-400 bg-white">
                <i className="far fa-envelope text-6xl text-primary-red opacity-50 mb-4"></i>
                <p className="text-lg">Selecciona un correo para analizar</p>
            </div>
        );
    }

    const initial = email.sender.charAt(0).toUpperCase();
    const isQuarantine = email.folder === 'quarantine';

    // Simple sanitization to prevent script execution in the preview
    const sanitizeHTML = (html: string) => {
        return html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "[SCRIPT BLOQUEADO POR SEGURIDAD]")
            .replace(/on\w+="[^"]*"/g, "") // Remove inline events like onclick
            .replace(/javascript:/g, "bloqueado:");
    };

    return (
        <div className="flex-grow h-full bg-white overflow-y-auto animate-[fadeIn_0.3s_ease]">
            
            {/* Security Alert Banner */}
            {isQuarantine && (
                <div className="bg-red-50 border-b border-red-200 p-4 flex items-start gap-4 sticky top-0 z-10">
                    <div className="bg-red-100 p-2 rounded-full">
                         <i className="fas fa-biohazard text-red-600 text-xl"></i>
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-red-800 font-bold">OBJETO EN CUARENTENA</h3>
                        <p className="text-red-700 text-sm mt-1">
                            Este correo contiene patrones que coinciden con: <strong>{email.riskLevel?.toUpperCase()}</strong>.
                        </p>
                        <p className="text-red-600 text-xs mt-1 font-mono bg-red-100 inline-block px-2 py-1 rounded">
                            Rule: {email.riskReason}
                        </p>
                        
                        <div className="mt-4 flex gap-3">
                            <button 
                                onClick={() => onAdminAction('block', email)}
                                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition-colors border border-red-800"
                            >
                                <i className="fas fa-trash-alt mr-2"></i> Destruir Amenaza
                            </button>
                            <button 
                                onClick={() => onAdminAction('allow', email)}
                                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded text-sm font-semibold shadow-sm transition-colors"
                            >
                                <i className="fas fa-check-circle mr-2"></i> Liberar (Falso Positivo)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-8 max-w-4xl mx-auto w-full">
                
                {/* Header */}
                <div className="border-b border-gray-100 pb-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">{email.subject || '(Sin Asunto)'}</h2>
                        <div className="flex gap-2">
                             {email.riskLevel === 'high' && (
                                <span className="bg-red-600 text-white text-xs px-3 py-1 rounded shadow-sm font-bold uppercase tracking-wider">
                                    CRÍTICO
                                </span>
                             )}
                             {email.folder !== 'quarantine' && (
                                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded font-bold uppercase tracking-wider">
                                    VERIFICADO
                                </span>
                             )}
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-sm ${isQuarantine ? 'bg-gray-200 text-gray-500' : 'bg-primary-red text-white'}`}>
                                {initial}
                            </div>
                            <div>
                                <h4 className="text-gray-900 font-semibold flex items-center gap-2">
                                    {email.sender}
                                    {email.replyTo && email.replyTo !== email.email && (
                                        <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded" title={`Responde a: ${email.replyTo}`}>
                                            <i className="fas fa-random"></i> Reply-To Diferente
                                        </span>
                                    )}
                                </h4>
                                <span className="text-sm text-gray-500 font-mono">&lt;{email.email}&gt;</span>
                            </div>
                        </div>
                        <div className="text-sm text-gray-400">
                            {email.date}
                        </div>
                    </div>

                    {/* Forensic Data */}
                    <SecurityForensics analysis={email.securityAnalysis} />
                </div>

                {/* Body - Sanitized */}
                <div 
                    className={`text-gray-700 leading-relaxed whitespace-pre-line mb-8 font-sans ${isQuarantine ? 'opacity-75 grayscale select-none' : ''}`}
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(email.body || email.preview) }}
                >
                </div>

                {/* Attachments */}
                {(email.hasAttachments || email.attachmentName) && (
                    <div className="pt-6 border-t border-gray-100">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <i className="fas fa-paperclip"></i> Adjuntos
                        </h5>
                        <div className={`inline-flex items-center border rounded px-4 py-3 text-sm transition-colors ${isQuarantine ? 'bg-red-50 border-red-200 text-red-600 cursor-not-allowed' : 'bg-gray-50 border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-100'}`}>
                            <i className={`fas ${email.attachmentName?.endsWith('.exe') ? 'fa-file-code' : 'fa-file-alt'} text-xl mr-3`}></i>
                            <div className="flex flex-col">
                                <span className="font-bold">{email.attachmentName || 'archivo_adjunto.dat'}</span>
                                {isQuarantine && <span className="text-[10px] uppercase font-bold text-red-500">Bloqueado por Sandbox</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailDetail;
