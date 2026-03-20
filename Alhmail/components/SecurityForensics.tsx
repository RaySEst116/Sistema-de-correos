
import React from 'react';
import { SecurityAnalysis } from '../types';

interface SecurityForensicsProps {
    analysis?: SecurityAnalysis;
}

const SecurityForensics: React.FC<SecurityForensicsProps> = ({ analysis }) => {
    if (!analysis) return null;

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pass': 
            case 'clean':
                return { 
                    bg: 'var(--success-bg)', 
                    color: 'var(--success-text)', 
                    border: 'var(--success-border)' 
                };
            case 'fail': 
            case 'blacklisted':
                return { 
                    bg: 'var(--danger-bg)', 
                    color: 'var(--danger-text)', 
                    border: 'var(--danger-border)' 
                };
            case 'suspicious':
                return { 
                    bg: 'var(--warning-bg)', 
                    color: 'var(--warning-text)', 
                    border: 'var(--warning-border)' 
                };
            default:
                return { 
                    bg: 'var(--bg-card)', 
                    color: 'var(--text-main)', 
                    border: 'var(--border-color)' 
                };
        }
    };

    const getScoreColor = (score: number) => {
        if (score > 80) return 'var(--score-high)';
        if (score > 50) return 'var(--score-medium)';
        return 'var(--score-low)';
    };

    const spfColor = getStatusColor(analysis.spf);
    const dkimColor = getStatusColor(analysis.dkim);
    const dmarcColor = getStatusColor(analysis.dmarc);
    const ipColor = getStatusColor(analysis.ipReputation);

    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginTop: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
        }}>
            <h4 style={{
                color: 'var(--text-main)',
                fontWeight: 'bold',
                margin: '0 0 0.75rem 0',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <i className="fas fa-microscope"></i> Análisis Forense de Cabeceras
            </h4>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                <div style={{
                    border: `1px solid ${spfColor.border}`,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: spfColor.bg,
                    color: spfColor.color
                }}>
                    <span style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        opacity: 0.7
                    }}>SPF</span>
                    <span style={{ fontWeight: 'bold' }}>{analysis.spf?.toUpperCase() || 'N/A'}</span>
                </div>
                <div style={{
                    border: `1px solid ${dkimColor.border}`,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: dkimColor.bg,
                    color: dkimColor.color
                }}>
                    <span style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        opacity: 0.7
                    }}>DKIM</span>
                    <span style={{ fontWeight: 'bold' }}>{analysis.dkim?.toUpperCase() || 'N/A'}</span>
                </div>
                <div style={{
                    border: `1px solid ${dmarcColor.border}`,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: dmarcColor.bg,
                    color: dmarcColor.color
                }}>
                    <span style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        opacity: 0.7
                    }}>DMARC</span>
                    <span style={{ fontWeight: 'bold' }}>{analysis.dmarc?.toUpperCase() || 'N/A'}</span>
                </div>
                <div style={{
                    border: `1px solid ${ipColor.border}`,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: ipColor.bg,
                    color: ipColor.color
                }}>
                    <span style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        opacity: 0.7
                    }}>IP REP</span>
                    <span style={{ fontWeight: 'bold' }}>{analysis.ipReputation?.toUpperCase() || 'N/A'}</span>
                </div>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <div style={{
                    flexGrow: 1,
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '9999px',
                    height: '0.625rem'
                }}>
                    <div 
                        style={{
                            height: '0.625rem',
                            borderRadius: '9999px',
                            backgroundColor: getScoreColor(analysis.confidenceScore),
                            width: `${analysis.confidenceScore}%`
                        }} 
                    ></div>
                </div>
                <span style={{
                    fontWeight: 'bold',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap'
                }}>
                    Score: {analysis.confidenceScore}/100
                </span>
            </div>
        </div>
    );
};

export default SecurityForensics;
