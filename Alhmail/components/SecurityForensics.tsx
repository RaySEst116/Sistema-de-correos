
import React from 'react';
import { SecurityAnalysis } from '../types';

interface SecurityForensicsProps {
    analysis?: SecurityAnalysis;
}

const SecurityForensics: React.FC<SecurityForensicsProps> = ({ analysis }) => {
    if (!analysis) return null;

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pass': return 'bg-green-100 text-green-800 border-green-200';
            case 'clean': return 'bg-green-100 text-green-800 border-green-200';
            case 'fail': return 'bg-red-100 text-red-800 border-red-200';
            case 'blacklisted': return 'bg-red-100 text-red-800 border-red-200';
            case 'suspicious': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4 font-mono text-sm">
            <h4 className="text-gray-700 font-bold mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                <i className="fas fa-microscope"></i> Análisis Forense de Cabeceras
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className={`border px-3 py-2 rounded flex flex-col items-center ${getStatusColor(analysis.spf)}`}>
                    <span className="text-xs uppercase font-bold opacity-70">SPF</span>
                    <span className="font-bold">{analysis.spf?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className={`border px-3 py-2 rounded flex flex-col items-center ${getStatusColor(analysis.dkim)}`}>
                    <span className="text-xs uppercase font-bold opacity-70">DKIM</span>
                    <span className="font-bold">{analysis.dkim?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className={`border px-3 py-2 rounded flex flex-col items-center ${getStatusColor(analysis.dmarc)}`}>
                    <span className="text-xs uppercase font-bold opacity-70">DMARC</span>
                    <span className="font-bold">{analysis.dmarc?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className={`border px-3 py-2 rounded flex flex-col items-center ${getStatusColor(analysis.ipReputation)}`}>
                    <span className="text-xs uppercase font-bold opacity-70">IP REP</span>
                    <span className="font-bold">{analysis.ipReputation?.toUpperCase() || 'N/A'}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-grow bg-gray-200 rounded-full h-2.5">
                    <div 
                        className={`h-2.5 rounded-full ${analysis.confidenceScore > 80 ? 'bg-green-600' : analysis.confidenceScore > 50 ? 'bg-orange-500' : 'bg-red-600'}`} 
                        style={{ width: `${analysis.confidenceScore}%` }}
                    ></div>
                </div>
                <span className="font-bold text-gray-600 whitespace-nowrap">
                    Score: {analysis.confidenceScore}/100
                </span>
            </div>
        </div>
    );
};

export default SecurityForensics;
