
import React, { useState } from 'react';

interface InjectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInject: (data: any) => void;
}

const InjectorModal: React.FC<InjectorModalProps> = ({ isOpen, onClose, onInject }) => {
    const [type, setType] = useState('phishing');
    const [sender, setSender] = useState('ceo@bigbank.com');
    const [replyTo, setReplyTo] = useState('hacker@evil.com');
    const [subject, setSubject] = useState('URGENTE: Transferencia requerida');
    const [body, setBody] = useState('Favor de realizar el pago a la cuenta adjunta inmediatamente.');
    const [attachment, setAttachment] = useState('');

    const presetThreats: Record<string, any> = {
        phishing: {
            sender: 'security@paypa1.com',
            replyTo: 'steal@data.net',
            subject: 'Su cuenta será suspendida',
            body: 'Detectamos un acceso no autorizado. <a href="http://fake-login.com">Haga clic aquí</a> para verificar su identidad.',
            attachment: ''
        },
        malware: {
            sender: 'facturacion@proveedor.com',
            replyTo: 'facturacion@proveedor.com',
            subject: 'Factura Vencida #9923',
            body: 'Adjunto la factura pendiente. Por favor abrir en PC con Windows.',
            attachment: 'Factura.exe'
        },
        clean: {
            sender: 'newsletter@noticias.com',
            replyTo: 'newsletter@noticias.com',
            subject: 'Resumen Semanal',
            body: 'Aquí están las noticias más relevantes de la semana.',
            attachment: ''
        },
        xss: {
            sender: 'attacker@xss.net',
            replyTo: 'attacker@xss.net',
            subject: 'Test XSS Injection',
            body: 'Hello <script>alert("Hacked")</script> world.',
            attachment: ''
        }
    };

    const loadPreset = (key: string) => {
        const p = presetThreats[key];
        setType(key);
        setSender(p.sender);
        setReplyTo(p.replyTo);
        setSubject(p.subject);
        setBody(p.body);
        setAttachment(p.attachment);
    };

    const handleInject = () => {
        onInject({ sender, replyTo, subject, body, attachment });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[2000] flex items-center justify-center font-mono">
            <div className="bg-gray-900 border border-green-500 w-[600px] shadow-[0_0_20px_rgba(0,255,0,0.2)] rounded-lg flex flex-col max-h-[90vh]">
                
                {/* Header Style Hacker */}
                <div className="bg-gray-800 p-3 border-b border-green-900 flex justify-between items-center">
                    <span className="text-green-500 font-bold text-sm"> >_ INJECTOR_CONSOLSE_V1.0</span>
                    <button onClick={onClose} className="text-green-700 hover:text-green-500">[X]</button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar text-green-400">
                    <p className="mb-4 text-xs opacity-70">Seleccione un vector de ataque para simular la inyección de un paquete SMTP:</p>

                    <div className="flex gap-2 mb-6">
                        <button onClick={() => loadPreset('phishing')} className="bg-gray-800 border border-green-700 hover:bg-green-900 text-xs px-3 py-1 rounded">PHISHING</button>
                        <button onClick={() => loadPreset('malware')} className="bg-gray-800 border border-green-700 hover:bg-green-900 text-xs px-3 py-1 rounded">MALWARE</button>
                        <button onClick={() => loadPreset('xss')} className="bg-gray-800 border border-green-700 hover:bg-green-900 text-xs px-3 py-1 rounded">XSS</button>
                        <button onClick={() => loadPreset('clean')} className="bg-gray-800 border border-blue-700 hover:bg-blue-900 text-blue-300 text-xs px-3 py-1 rounded">CLEAN</button>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1 text-green-600">SMTP FROM:</label>
                            <input value={sender} onChange={e => setSender(e.target.value)} className="bg-black border border-green-800 p-2 text-green-400 focus:outline-none focus:border-green-500" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1 text-green-600">SMTP REPLY-TO (Spoofing Check):</label>
                            <input value={replyTo} onChange={e => setReplyTo(e.target.value)} className="bg-black border border-green-800 p-2 text-green-400 focus:outline-none focus:border-green-500" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1 text-green-600">SUBJECT:</label>
                            <input value={subject} onChange={e => setSubject(e.target.value)} className="bg-black border border-green-800 p-2 text-green-400 focus:outline-none focus:border-green-500" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1 text-green-600">PAYLOAD (BODY):</label>
                            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} className="bg-black border border-green-800 p-2 text-green-400 focus:outline-none focus:border-green-500" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1 text-green-600">ATTACHMENT FILENAME (Optional):</label>
                            <input value={attachment} onChange={e => setAttachment(e.target.value)} placeholder="e.g. virus.exe" className="bg-black border border-green-800 p-2 text-green-400 focus:outline-none focus:border-green-500" />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-green-900 flex justify-end">
                    <button 
                        onClick={handleInject}
                        className="bg-green-700 hover:bg-green-600 text-black font-bold px-6 py-2 rounded shadow-[0_0_10px_rgba(0,255,0,0.5)]"
                    >
                        EXECUTE INJECTION
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InjectorModal;
