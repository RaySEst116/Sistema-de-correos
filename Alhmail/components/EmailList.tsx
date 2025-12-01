
import React from 'react';
import { Email, FolderType } from '../types';

interface EmailListProps {
    emails: Email[];
    folder: FolderType;
    selectedEmailId: number | null;
    onSelectEmail: (email: Email) => void;
    width: number;
}

const EmailList: React.FC<EmailListProps> = ({ emails, folder, selectedEmailId, onSelectEmail, width }) => {
    
    const folderTitles: Record<string, string> = {
        'inbox': 'Bandeja de Entrada',
        'sent': 'Enviados',
        'drafts': 'Borradores',
        'spam': 'Spam',
        'trash': 'Papelera',
        'work': 'Trabajo',
        'personal': 'Personal',
        'quarantine': '⚠️ Cuarentena (Amenazas Detectadas)'
    };

    return (
        <div style={{ width: `${width}px` }} className="flex-shrink-0 flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden">
            <div className={`p-5 border-b ${folder === 'quarantine' ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-xl font-semibold ${folder === 'quarantine' ? 'text-red-700' : 'text-primary-red'}`}>
                    {folderTitles[folder] || 'Carpeta'}
                </h3>
                {folder === 'quarantine' && (
                    <p className="text-xs text-red-500 mt-1">Solo visible para administradores</p>
                )}
            </div>
            
            <div className="flex-grow overflow-y-auto">
                {emails.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">
                        {folder === 'quarantine' ? 'Sistema seguro. Sin amenazas.' : 'No hay correos'}
                    </div>
                ) : (
                    emails.map(email => (
                        <div 
                            key={email.id}
                            onClick={() => onSelectEmail(email)}
                            className={`
                                cursor-pointer p-4 border-b border-gray-100 border-l-4 transition-colors hover:bg-gray-50
                                ${selectedEmailId === email.id 
                                    ? (folder === 'quarantine' ? 'bg-red-50 border-l-red-600' : 'bg-red-50 border-l-primary-red') 
                                    : 'border-l-transparent'}
                                ${email.unread ? 'bg-white' : 'bg-[#f9fafb]'}
                            `}
                        >
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className={`text-sm truncate mr-2 ${email.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                                    {email.sender}
                                </h4>
                                <span className={`text-xs whitespace-nowrap ${email.unread ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                                    {email.date}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-sm truncate flex-grow ${email.unread ? 'font-bold text-gray-900' : 'font-normal text-gray-600'} ${folder === 'quarantine' ? 'text-red-700' : ''}`}>
                                    {folder === 'quarantine' && <i className="fas fa-bug text-xs mr-1"></i>}
                                    {email.subject || '(Sin Asunto)'}
                                </span>
                                {email.hasAttachments && (
                                    <i className="fas fa-paperclip text-xs text-gray-500 ml-2"></i>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                                {email.preview}
                            </p>
                            {folder === 'quarantine' && (
                                <div className="mt-1">
                                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                        {email.riskLevel}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EmailList;
