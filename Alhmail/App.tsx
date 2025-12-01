
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import ComposeModal from './components/ComposeModal';
import InjectorModal from './components/InjectorModal'; // Import new injector
import Login from './components/Login';
import { db } from './services/db';
import { classifyEmailContent, generateSyntheticEmail } from './services/geminiService';
import { Email, FolderType, User } from './types';

const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // App State
    const [emails, setEmails] = useState<Email[]>([]);
    const [currentFolder, setCurrentFolder] = useState<FolderType>('inbox');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isInjectorOpen, setIsInjectorOpen] = useState(false); // State for Injector
    const [listWidth, setListWidth] = useState(350);
    const [loading, setLoading] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [dbOnline, setDbOnline] = useState(false);

    // Initial Load (Check Session)
    useEffect(() => {
        const checkSession = async () => {
            const currentUser = await db.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            }
            setAuthLoading(false);
        };
        checkSession();
    }, []);

    // Load Emails when user is logged in
    useEffect(() => {
        if (user) {
            loadEmails();
        }
    }, [user, currentFolder]);

    const loadEmails = async () => {
        setLoading(true);
        const data = await db.getEmails();
        setEmails(data);
        setDbOnline(db.isOnline()); // Check connection status after load
        setLoading(false);
    };

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
    };

    const handleLogout = async () => {
        await db.logout();
        setUser(null);
        setEmails([]);
        setCurrentFolder('inbox');
    };

    const handleSelectEmail = async (email: Email) => {
        setSelectedEmail(email);
        if (email.unread) {
            await db.markAsRead(email.id);
            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, unread: false } : e));
            setSelectedEmail({ ...email, unread: false });
        }
    };

    const handleSendEmail = async (to: string, subject: string, body: string) => {
        const newEmail: Email = {
            id: Date.now(),
            folder: 'sent',
            unread: false,
            sender: user?.name || 'Yo',
            email: user?.email || 'yo@cruzroja.mx',
            subject: subject,
            body: body,
            preview: body.substring(0, 50) + '...',
            date: 'Ahora',
            hasAttachments: false,
            riskLevel: 'safe',
            securityAnalysis: { spf: 'pass', dkim: 'pass', dmarc: 'pass', ipReputation: 'clean', confidenceScore: 100 }
        };
        
        await db.saveEmail(newEmail);
        setEmails(prev => [newEmail, ...prev]);
        setIsComposeOpen(false);
        alert('Correo enviado y guardado correctamente');
    };

    // --- PROCESS INCOMING EMAIL (Common logic) ---
    const processIncomingEmail = async (data: { sender: string, replyTo?: string, email?: string, subject: string, body: string, attachment?: string }) => {
        setSimulating(true);
        try {
            // SECURITY SCAN (Gemini AI acting as Firewall)
            const classification = await classifyEmailContent(
                data.subject, 
                data.body, 
                data.sender,
                data.replyTo,
                !!data.attachment,
                data.attachment
            );
            
            const newEmail: Email = {
                id: Date.now(),
                folder: classification.category,
                unread: true,
                sender: data.sender,
                email: data.sender.includes('<') ? data.sender.match(/<([^>]+)>/)![1] : data.sender, // Basic parsing
                replyTo: data.replyTo,
                subject: data.subject,
                body: data.body,
                preview: data.body.substring(0, 60) + '...',
                date: 'Ahora',
                hasAttachments: !!data.attachment,
                attachmentName: data.attachment,
                riskLevel: classification.riskLevel,
                riskReason: classification.riskReason,
                securityAnalysis: classification.securityAnalysis
            };

            await db.saveEmail(newEmail);
            setEmails(prev => [newEmail, ...prev]);

            if (classification.category === 'quarantine') {
                 alert(`⚠️ AMENAZA BLOQUEADA ⚠️\nUn correo de ${data.sender} ha sido aislado.\nRiesgo: ${classification.riskLevel.toUpperCase()}`);
                 if (currentFolder === 'quarantine') loadEmails();
            } else {
                 alert(`Nuevo correo verificado en: ${classification.category.toUpperCase()}`);
            }

        } catch (error) {
            console.error("Simulation failed", error);
            alert("Error en el motor de análisis");
        } finally {
            setSimulating(false);
        }
    };

    // --- AUTO SIMULATION ---
    const handleAutoSimulate = async () => {
        const synthetic = await generateSyntheticEmail();
        // Since generateSyntheticEmail is simple now, we add mock data for the call
        await processIncomingEmail({
            sender: synthetic.sender || 'random@internet.com',
            subject: synthetic.subject || 'Random Subject',
            body: synthetic.body || 'Random Body',
            attachment: Math.random() > 0.7 ? 'virus.exe' : undefined
        });
    };

    const handleConnectService = async () => {
        // ... (Existing logic)
        const service = prompt("Escribe 'G' para Gmail o 'O' para Outlook:");
        if (!service) return;
        setConnecting(true);
        await new Promise(r => setTimeout(r, 2000));
        alert(`Conexión Segura (TLS 1.3) establecida con ${service.toLowerCase() === 'g' ? 'Google' : 'Microsoft'}.`);
        handleAutoSimulate();
        setConnecting(false);
    };

    // --- ADMIN ACTIONS ---
    const handleAdminAction = async (action: 'block' | 'allow', email: Email) => {
        if (action === 'block') {
            const confirm = window.confirm(`CONFIRMAR ELIMINACIÓN:\n\nEsto enviará la huella digital del archivo a la base de datos de amenazas y bloqueará el dominio.`);
            if (confirm) {
                await db.addToBlacklist(email.email);
                await db.deleteEmail(email.id);
                setEmails(prev => prev.filter(e => e.id !== email.id));
                setSelectedEmail(null);
            }
        } else if (action === 'allow') {
            await db.moveEmailToFolder(email.id, 'inbox');
            setEmails(prev => prev.filter(e => e.id !== email.id)); 
            setSelectedEmail(null);
        }
    };

    // --- RESIZER LOGIC (Existing) ---
    const isResizing = useRef(false);
    const handleMouseDown = () => { isResizing.current = true; document.body.style.cursor = 'col-resize'; };
    const handleMouseUp = () => { isResizing.current = false; document.body.style.cursor = 'default'; };
    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const sidebarWidth = sidebarCollapsed ? 70 : 250;
        let newWidth = e.clientX - sidebarWidth;
        if (newWidth < 250) newWidth = 250;
        if (newWidth > 600) newWidth = 600;
        setListWidth(newWidth);
    };
    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [sidebarCollapsed]);

    // --- RENDER ---
    if (authLoading) return <div className="h-screen flex items-center justify-center bg-bg-color text-primary-red"><i className="fas fa-circle-notch fa-spin text-3xl"></i></div>;
    if (!user) return <Login onLogin={handleLogin} />;

    const filteredEmails = emails.filter(e => e.folder === currentFolder);

    return (
        <div className="flex h-screen bg-bg-color overflow-hidden font-sans">
            
            {connecting && (
                <div className="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex flex-col items-center justify-center text-white font-mono">
                    <i className="fas fa-shield-virus fa-spin text-5xl mb-6 text-green-500"></i>
                    <p className="text-xl font-bold mb-2">ESTABLECIENDO TÚNEL SEGURO...</p>
                    <div className="text-xs text-green-400 opacity-80 space-y-1">
                        <p>> Handshake TLS 1.3... OK</p>
                        <p>> Verificando Certificados... OK</p>
                        <p>> Escaneando Headers en busca de Spoofing... OK</p>
                    </div>
                </div>
            )}

            <Sidebar 
                isCollapsed={sidebarCollapsed}
                toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                currentFolder={currentFolder}
                setFolder={(f) => { setCurrentFolder(f); setSelectedEmail(null); }}
                onCompose={() => setIsComposeOpen(true)}
                onConnectService={handleConnectService}
                dbStatus={dbOnline}
            />

            <main className="flex-grow flex bg-white m-3 rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
                
                <EmailList 
                    emails={filteredEmails}
                    folder={currentFolder}
                    selectedEmailId={selectedEmail?.id || null}
                    onSelectEmail={handleSelectEmail}
                    width={listWidth}
                />

                <div 
                    onMouseDown={handleMouseDown}
                    className="w-1 bg-gray-100 hover:bg-primary-red cursor-col-resize z-10 transition-colors border-l border-r border-gray-200"
                ></div>

                <EmailDetail 
                    email={selectedEmail} 
                    onAdminAction={handleAdminAction}
                />
                
                {/* Simulation & Logout Buttons */}
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                     <button 
                        onClick={() => setIsInjectorOpen(true)}
                        className="bg-gray-900 border border-green-600 text-green-400 text-xs px-3 py-2 rounded shadow-lg hover:bg-black transition-all flex items-center gap-2 font-mono"
                    >
                        <i className="fas fa-terminal"></i>
                        TEST INJECTOR
                    </button>

                    <button 
                        onClick={handleAutoSimulate}
                        disabled={simulating}
                        className={`
                            bg-gray-800 text-white text-xs px-3 py-2 rounded shadow-lg hover:bg-gray-700 transition-all flex items-center gap-2
                            ${simulating ? 'opacity-75 cursor-not-allowed' : ''}
                        `}
                    >
                        <i className={`fas fa-random ${simulating ? 'animate-spin' : ''}`}></i>
                        {simulating ? 'Analizando...' : 'Auto Simulación'}
                    </button>

                    <button 
                        onClick={handleLogout}
                        className="bg-white border border-gray-300 text-gray-700 text-xs px-3 py-2 rounded shadow-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                        title="Cerrar Sesión"
                    >
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>

            </main>

            <ComposeModal 
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSend={handleSendEmail}
            />

            <InjectorModal 
                isOpen={isInjectorOpen}
                onClose={() => setIsInjectorOpen(false)}
                onInject={(data) => processIncomingEmail(data)}
            />
        </div>
    );
};

export default App;
