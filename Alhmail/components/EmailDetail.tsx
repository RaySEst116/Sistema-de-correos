
import React from 'react';
import { Email } from '../types';
import SecurityForensics from './SecurityForensics';

interface EmailDetailProps {
    email: Email | null;
    onAdminAction: (action: 'block' | 'allow', email: Email) => void;
    onBack?: () => void;
    isMobile?: boolean;
}

const EmailDetail: React.FC<EmailDetailProps> = ({ email, onAdminAction, onBack, isMobile = false }) => {
    if (!email) {
        return (
            <div style={{
                flexGrow: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF',
                backgroundColor: 'var(--bg-card, #FFFFFF)'
            }}>
                <i className="far fa-envelope" style={{
                    fontSize: '3rem',
                    color: 'var(--primary-red, #D50032)',
                    opacity: 0.5,
                    marginBottom: '1rem'
                }}></i>
                <p style={{ fontSize: '1.125rem' }}>Selecciona un correo para analizar</p>
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
        <div style={{
            flexGrow: 1,
            height: '100%',
            backgroundColor: 'var(--bg-card, #FFFFFF)',
            overflowY: 'auto',
            animation: 'fadeIn 0.3s ease',
            position: 'relative'
        }}>
            {/* Mobile Back Button */}
            {isMobile && onBack && (
                <button
                    onClick={onBack}
                    style={{
                        position: 'sticky',
                        top: '0',
                        left: '0',
                        right: '0',
                        zIndex: 20,
                        background: 'var(--bg-card, #FFFFFF)',
                        border: 'none',
                        borderBottom: '1px solid var(--border-color, #e5e7eb)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: 'var(--text-main, #374151)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                >
                    <i className="fas fa-arrow-left"></i>
                    Volver a la lista
                </button>
            )}
            
            {/* Security Alert Banner */}
            {isQuarantine && (
                <div style={{
                    backgroundColor: '#FEF2F2',
                    borderBottom: '1px solid #FECACA',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    position: 'sticky',
                    top: isMobile ? '49px' : '0',
                    zIndex: 10
                }}>
                    <div style={{
                        backgroundColor: '#FEE2E2',
                        padding: '0.5rem',
                        borderRadius: '50%'
                    }}>
                         <i className="fas fa-biohazard" style={{
                            color: '#DC2626',
                            fontSize: '1.25rem'
                         }}></i>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <h3 style={{
                            color: '#991B1B',
                            fontWeight: 'bold',
                            margin: '0 0 0.25rem 0'
                        }}>OBJETO EN CUARENTENA</h3>
                        <p style={{
                            color: '#B91C1C',
                            fontSize: '0.875rem',
                            margin: '0.25rem 0'
                        }}>
                            Este correo contiene patrones que coinciden con: <strong>{email.riskLevel?.toUpperCase()}</strong>.
                        </p>
                        <p style={{
                            color: '#DC2626',
                            fontSize: '0.75rem',
                            marginTop: '0.25rem',
                            fontFamily: 'monospace',
                            backgroundColor: '#FEE2E2',
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem'
                        }}>
                            Rule: {email.riskReason}
                        </p>
                        
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                            <button 
                                onClick={() => onAdminAction('block', email)}
                                style={{
                                    backgroundColor: '#B91C1C',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    transition: 'background-color 0.2s',
                                    border: '1px solid #991B1B',
                                    cursor: 'pointer'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#991B1B'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
                            >
                                <i className="fas fa-trash-alt" style={{ marginRight: '0.5rem' }}></i> Destruir Amenaza
                            </button>
                            <button 
                                onClick={() => onAdminAction('allow', email)}
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #D1D5DB',
                                    color: '#374151',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    transition: 'background-color 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i> Liberar (Falso Positivo)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                padding: '2rem',
                maxWidth: '56rem',
                margin: '0 auto',
                width: '100%'
            }}>
                
                {/* Header */}
                <div style={{
                    borderBottom: '1px solid #F3F4F6',
                    paddingBottom: '1.5rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '1rem'
                    }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#111827',
                            margin: 0
                        }}>{email.subject || '(Sin Asunto)'}</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                             {email.riskLevel === 'high' && (
                                <span style={{
                                    backgroundColor: '#DC2626',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '0.25rem',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    CRÍTICO
                                </span>
                             )}
                             {email.folder !== 'quarantine' && (
                                <span style={{
                                    backgroundColor: '#D1FAE5',
                                    color: '#065F46',
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '0.25rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    VERIFICADO
                                </span>
                             )}
                        </div>
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <div style={{
                                width: '3rem',
                                height: '3rem',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                flexShrink: 0,
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                backgroundColor: isQuarantine ? '#E5E7EB' : 'var(--primary-red, #D50032)',
                                color: isQuarantine ? '#6B7280' : 'white'
                            }}>
                                {initial}
                            </div>
                            <div>
                                <h4 style={{
                                    color: '#111827',
                                    fontWeight: 'bold',
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {email.sender}
                                    {email.replyTo && email.replyTo !== email.email && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            backgroundColor: '#FED7AA',
                                            color: '#9A3412',
                                            padding: '0 0.25rem',
                                            borderRadius: '0.25rem',
                                            cursor: 'help'
                                        }} title={`Responde a: ${email.replyTo}`}>
                                            <i className="fas fa-random"></i> Reply-To Diferente
                                        </span>
                                    )}
                                </h4>
                                <span style={{
                                    fontSize: '0.875rem',
                                    color: '#6B7280',
                                    fontFamily: 'monospace'
                                }}>&lt;{email.email}&gt;</span>
                            </div>
                        </div>
                        <div style={{
                            fontSize: '0.875rem',
                            color: '#9CA3AF'
                        }}>
                            {email.date}
                        </div>
                    </div>

                    {/* Forensic Data */}
                    <SecurityForensics analysis={email.securityAnalysis} />
                </div>

                {/* Body - Sanitized */}
                <div 
                    style={{
                        color: '#374151',
                        lineHeight: 1.625,
                        whiteSpace: 'pre-line',
                        marginBottom: '2rem',
                        fontFamily: 'system-ui, sans-serif',
                        opacity: isQuarantine ? 0.75 : 1,
                        filter: isQuarantine ? 'grayscale(100%)' : 'none',
                        userSelect: isQuarantine ? 'none' : 'auto'
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(email.body || email.preview) }}
                >
                </div>

                {/* Attachments */}
                {(email.hasAttachments || email.attachmentName) && (
                    <div style={{
                        paddingTop: '1.5rem',
                        borderTop: '1px solid #F3F4F6'
                    }}>
                        <h5 style={{
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: '#374151',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <i className="fas fa-paperclip"></i> Adjuntos
                        </h5>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid',
                            borderRadius: '0.25rem',
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                            transition: 'background-color 0.2s',
                            backgroundColor: isQuarantine ? '#FEF2F2' : '#F9FAFB',
                            borderColor: isQuarantine ? '#FECACA' : '#E5E7EB',
                            color: isQuarantine ? '#DC2626' : '#374151',
                            cursor: isQuarantine ? 'not-allowed' : 'pointer'
                        }}
                        onMouseOver={(e) => {
                            if (!isQuarantine) e.currentTarget.style.backgroundColor = '#F3F4F6';
                        }}
                        onMouseOut={(e) => {
                            if (!isQuarantine) e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}>
                            <i className={`fas ${email.attachmentName?.endsWith('.exe') ? 'fa-file-code' : 'fa-file-alt'}`} style={{
                                fontSize: '1.25rem',
                                marginRight: '0.75rem'
                            }}></i>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 'bold' }}>{email.attachmentName || 'archivo_adjunto.dat'}</span>
                                {isQuarantine && <span style={{
                                    fontSize: '0.625rem',
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold',
                                    color: '#DC2626'
                                }}>Bloqueado por Sandbox</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailDetail;
