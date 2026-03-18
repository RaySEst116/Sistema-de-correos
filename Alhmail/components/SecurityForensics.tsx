
import React from 'react';
import { SecurityAnalysis } from '../types';

interface SecurityForensicsProps {
    analysis?: SecurityAnalysis;
}

const SecurityForensics: React.FC<SecurityForensicsProps> = ({ analysis }) => {
    if (!analysis) return null;

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pass': return { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' };
            case 'clean': return { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' };
            case 'fail': return { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' };
            case 'blacklisted': return { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' };
            case 'suspicious': return { bg: '#FED7AA', color: '#9A3412', border: '#FDBA74' };
            default: return { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
        }
    };

    const spfColor = getStatusColor(analysis.spf);
    const dkimColor = getStatusColor(analysis.dkim);
    const dmarcColor = getStatusColor(analysis.dmarc);
    const ipColor = getStatusColor(analysis.ipReputation);

    return (
        <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginTop: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
        }}>
            <h4 style={{
                color: '#334155',
                fontWeight: 'bold',
                margin: '0 0 0.75rem 0',
                borderBottom: '1px solid #E2E8F0',
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
                    backgroundColor: '#E5E7EB',
                    borderRadius: '9999px',
                    height: '0.625rem'
                }}>
                    <div 
                        style={{
                            height: '0.625rem',
                            borderRadius: '9999px',
                            backgroundColor: analysis.confidenceScore > 80 ? '#059669' : analysis.confidenceScore > 50 ? '#F97316' : '#DC2626',
                            width: `${analysis.confidenceScore}%`
                        }} 
                    ></div>
                </div>
                <span style={{
                    fontWeight: 'bold',
                    color: '#4B5563',
                    whiteSpace: 'nowrap'
                }}>
                    Score: {analysis.confidenceScore}/100
                </span>
            </div>
        </div>
    );
};

export default SecurityForensics;
