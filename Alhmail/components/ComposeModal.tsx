import React, { useState, useRef, useEffect } from 'react';
import { db } from '../services/db';
import { Contact } from '../types';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (to: string, subject: string, body: string) => void;
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSend }) => {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [suggestions, setSuggestions] = useState<Contact[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadContacts = async () => {
            const data = await db.getContacts();
            setContacts(data);
        };
        loadContacts();
    }, []);

    const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTo(val);
        if (val.length > 0) {
            setSuggestions(contacts.filter(c => 
                c.name.toLowerCase().includes(val.toLowerCase()) || 
                c.email.toLowerCase().includes(val.toLowerCase())
            ));
        } else {
            setSuggestions([]);
        }
    };

    const selectContact = (email: string) => {
        setTo(email);
        setSuggestions([]);
    };

    const handleSend = () => {
        if (!to) return alert("Por favor añade un destinatario");
        onSend(to, subject, body);
        resetForm();
    };

    const resetForm = () => {
        setTo('');
        setSubject('');
        setBody('');
        setFiles([]);
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 right-20 w-[500px] h-[600px] bg-white rounded-t-lg shadow-2xl flex flex-col z-[1000] border border-gray-200 animate-[slideUp_0.3s_ease]">
            {/* Header */}
            <div className="bg-gray-100 px-4 py-3 rounded-t-lg flex justify-between items-center border-b border-gray-200">
                <span className="font-semibold text-gray-800">Mensaje nuevo</span>
                <div className="flex gap-3">
                    <button className="text-gray-500 hover:text-primary-red"><i className="fas fa-minus"></i></button>
                    <button onClick={onClose} className="text-gray-500 hover:text-primary-red"><i className="fas fa-times"></i></button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-grow flex flex-col p-4 relative">
                <div className="relative mb-2">
                    <input 
                        type="text" 
                        placeholder="Para" 
                        className="w-full py-2 border-b border-gray-200 outline-none text-sm focus:border-primary-red transition-colors"
                        value={to}
                        onChange={handleToChange}
                    />
                    {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-b z-50 max-h-40 overflow-y-auto">
                            {suggestions.map((c, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => selectContact(c.email)}
                                    className="p-2 hover:bg-gray-50 cursor-pointer flex flex-col border-b border-gray-50 last:border-none"
                                >
                                    <span className="font-semibold text-sm">{c.name}</span>
                                    <span className="text-xs text-gray-500">{c.email}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mb-2">
                    <input 
                        type="text" 
                        placeholder="Asunto" 
                        className="w-full py-2 border-b border-gray-200 outline-none text-sm focus:border-primary-red transition-colors"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>

                <textarea 
                    className="flex-grow w-full py-2 outline-none resize-none font-sans text-sm"
                    placeholder="Escribe tu mensaje aquí..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                ></textarea>

                {files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {files.map((f, i) => (
                            <span key={i} className="bg-gray-100 border border-gray-200 text-xs px-2 py-1 rounded flex items-center gap-1">
                                <i className="fas fa-file text-primary-red"></i> {f.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                <button 
                    onClick={handleSend}
                    className="bg-primary-red hover:bg-dark-magenta text-white px-6 py-2 rounded font-semibold text-sm transition-colors shadow-sm"
                >
                    Enviar
                </button>
                
                <div className="flex gap-4 text-gray-500">
                    <input type="file" hidden ref={fileInputRef} multiple onChange={handleFileChange} />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="hover:bg-gray-100 p-2 rounded transition-colors" title="Adjuntar"
                    >
                        <i className="fas fa-paperclip"></i>
                    </button>
                    <button className="hover:bg-gray-100 p-2 rounded transition-colors"><i className="far fa-smile"></i></button>
                    <button onClick={resetForm} className="hover:bg-gray-100 p-2 rounded transition-colors hover:text-red-600"><i className="far fa-trash-alt"></i></button>
                </div>
            </div>
        </div>
    );
};

export default ComposeModal;
