
import React from 'react';
import { FolderType } from '../types';

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    currentFolder: FolderType;
    setFolder: (folder: FolderType) => void;
    onCompose: () => void;
    onConnectService: () => void;
    dbStatus: boolean; // Prop to indicate connection
}

const Sidebar: React.FC<SidebarProps> = ({ 
    isCollapsed, 
    toggleSidebar, 
    currentFolder, 
    setFolder, 
    onCompose,
    onConnectService,
    dbStatus
}) => {
    
    const navItems: { id: FolderType; icon: string; label: string; color?: string }[] = [
        { id: 'inbox', icon: 'fa-inbox', label: 'Bandeja de Entrada' },
        { id: 'quarantine', icon: 'fa-shield-virus', label: 'Cuarentena (Admin)', color: 'text-red-600' },
        { id: 'work', icon: 'fa-briefcase', label: 'Trabajo' },
        { id: 'personal', icon: 'fa-user', label: 'Personal' },
        { id: 'sent', icon: 'fa-paper-plane', label: 'Enviados' },
        { id: 'drafts', icon: 'fa-file', label: 'Borradores' },
        { id: 'spam', icon: 'fa-exclamation-triangle', label: 'Spam' },
        { id: 'trash', icon: 'fa-trash', label: 'Papelera' },
    ];

    return (
        <nav className={`bg-white h-full border-r border-gray-200 flex flex-col py-5 transition-all duration-300 relative z-50 ${isCollapsed ? 'w-[70px] px-2' : 'w-[250px] px-4'}`}>
            <div className={`flex items-center justify-between mb-8 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                {!isCollapsed && (
                    <div className="text-2xl font-bold text-primary-red whitespace-nowrap overflow-hidden transition-opacity">
                        Alhmail <span className="text-xs text-gray-500 block font-normal">Security Edition</span>
                    </div>
                )}
                <button 
                    onClick={toggleSidebar} 
                    className="text-gray-500 hover:text-primary-red transition-colors text-lg focus:outline-none"
                >
                    <i className="fas fa-bars"></i>
                </button>
            </div>

            <button 
                onClick={onCompose}
                className={`bg-primary-red hover:bg-dark-magenta text-white font-semibold rounded-full transition-all duration-300 shadow-md flex items-center justify-center mb-6 mx-auto ${isCollapsed ? 'w-12 h-12 p-0' : 'w-full py-3 px-4 gap-2'}`}
            >
                <i className="fas fa-plus"></i>
                {!isCollapsed && <span>Redactar</span>}
            </button>

            {/* External Connection Section */}
            {!isCollapsed && (
                <div className="mb-6 px-2">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Conexiones Externas</p>
                    <button 
                        onClick={onConnectService}
                        className="w-full border border-gray-300 text-gray-700 rounded-lg py-2 text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        <i className="fab fa-google"></i> / <i className="fab fa-microsoft"></i>
                        <span>Conectar Cuenta</span>
                    </button>
                </div>
            )}

            <ul className="list-none flex-grow overflow-y-auto">
                {navItems.map((item) => (
                    <li key={item.id} className="relative group mb-1">
                        <button 
                            onClick={() => setFolder(item.id)}
                            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 whitespace-nowrap
                                ${currentFolder === item.id 
                                    ? 'bg-red-50 text-primary-red' 
                                    : 'text-gray-700 hover:bg-orange-50 hover:text-accent-orange'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <i className={`fas ${item.icon} text-lg ${isCollapsed ? 'mr-0' : 'mr-4 w-6 text-center'} ${item.color || ''}`}></i>
                            {!isCollapsed && <span className={item.color}>{item.label}</span>}
                        </button>
                        
                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 bg-oxide-red text-white text-sm px-3 py-1.5 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] pointer-events-none">
                                {item.label}
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-oxide-red"></div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {/* Database Status Indicator */}
            <div className={`mt-auto border-t border-gray-100 pt-4 ${isCollapsed ? 'flex justify-center' : 'px-2'}`}>
                <div className={`flex items-center gap-2 text-xs font-mono border rounded px-2 py-1 ${dbStatus ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${dbStatus ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="font-bold">{dbStatus ? 'DB: ONLINE' : 'DB: OFFLINE'}</span>
                            <span className="text-[10px] opacity-75">{dbStatus ? 'MySQL Workbench' : 'LocalStorage'}</span>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Sidebar;
