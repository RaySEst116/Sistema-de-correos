import React, { useState, useRef, useEffect } from 'react';
import { db } from '../services/db';
import { User } from '../types';
import ComposeEditor from './ComposeEditor';
import AttachmentsList from './AttachmentsList';

interface Attachment {
  filename: string;
  content: string;
  encoding: string;
  contentType: string;
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    from: string;
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    isDraft: boolean;
    attachments: Attachment[];
  }) => void;
  user: User;
  contacts?: { name: string; email: string }[];
  currentLang?: 'es' | 'en';
  isMobile?: boolean;
}

const translations = {
  es: {
    new_message: 'Mensaje nuevo',
    send: 'Enviar',
    discard: 'Descartar',
    attach: 'Adjuntar',
    drop_files: 'Suelta archivos aquí',
  },
  en: {
    new_message: 'New Message',
    send: 'Send',
    discard: 'Discard',
    attach: 'Attach',
    drop_files: 'Drop files here',
  },
};

const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSend,
  user,
  contacts = [],
  currentLang = 'es',
  isMobile = false,
}) => {
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('alhmail_lang') as 'es' | 'en' || 'es';
    setLang(savedLang);
    const handleLangChange = (e: CustomEvent) => {
      setLang(e.detail.lang);
    };
    window.addEventListener('langChanged' as any, handleLangChange);
    return () => window.removeEventListener('langChanged' as any, handleLangChange);
  }, []);

  const t = translations[lang];

  const handleSend = () => {
    if (to.length === 0) {
      alert('Por favor añade un destinatario');
      return;
    }
    onSend({
      from: user.email,
      to: to.join(','),
      cc: cc.join(','),
      bcc: bcc.join(','),
      subject,
      body,
      isDraft: false,
      attachments,
    });
    resetForm();
  };

  const handleSaveDraft = () => {
    onSend({
      from: user.email,
      to: to.join(','),
      cc: cc.join(','),
      bcc: bcc.join(','),
      subject,
      body,
      isDraft: true,
      attachments,
    });
    resetForm();
  };

  const resetForm = () => {
    setTo([]);
    setCc([]);
    setBcc([]);
    setSubject('');
    setBody('');
    setAttachments([]);
    setIsMinimized(false);
    setIsMaximized(false);
    onClose();
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const base64 = await toBase64(file);
      setAttachments((prev) => [
        ...prev,
        {
          filename: file.name,
          content: base64.split(',')[1],
          encoding: 'base64',
          contentType: file.type,
        },
      ]);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverlayRef.current) {
      dragOverlayRef.current.style.display = 'flex';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverlayRef.current) {
      dragOverlayRef.current.style.display = 'none';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverlayRef.current) {
      dragOverlayRef.current.style.display = 'none';
    }
    if (e.dataTransfer.files.length > 0) {
      await handleFileChange(e.dataTransfer.files);
    }
  };

  const handleAiGenerate = async () => { 
    console.log('🤖 Botón IA presionado');
    
    if (!window.Swal) {
      console.error('❌ SweetAlert2 no está disponible');
      alert('SweetAlert2 no está disponible');
      return;
    }
    console.log('✅ SweetAlert2 disponible, mostrando modal');
    
    const { value: prompt, isConfirmed } = await window.Swal.fire({
      title: '✨ Redactor Inteligente',
      input: 'textarea',
      inputLabel: 'Describe el correo completo',
      inputPlaceholder: 'Ej: Escribe a soporte@google.com reclamando mi cuenta...',
      showCancelButton: true,
      confirmButtonColor: '#8b5cf6',
      confirmButtonText: 'Generar',
      cancelButtonText: 'Cancelar',
      footer: `<small>Se firmará automáticamente como: <b>${user.name}</b></small>`,
      inputValidator: (value: string) => {
        if (!value) return '¡Escribe una instrucción!';
      },
      preConfirm: () => {
        // Cerrar el modal inmediatamente después de confirmar
        window.Swal.close();
      }
    });

    if (isConfirmed && prompt) {
      console.log('📝 Prompt recibido:', prompt);
      
      // Mostrar modal de carga
      const loadingModal = window.Swal.fire({
        title: 'Analizando...',
        html: 'Redactando y firmando...',
        timerProgressBar: true,
        didOpen: () => {
          window.Swal.showLoading();
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
      });

      try {
        console.log('🔗 Enviando petición a /ai/draft');
        
        const res = await fetch(`http://localhost:3001/ai/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            senderName: user.name,
          }),
        });
        
        console.log('📡 Respuesta recibida:', res.status);
        
        const response = await res.json();
        console.log('📄 Datos recibidos:', response);

        // Cerrar modal de carga
        loadingModal.close();

        if (response.success) {
          const { to: aiTo, subject: aiSubject, body: aiBody } = response.data;
          
          if (aiSubject) {
            setSubject(aiSubject);
            console.log('📋 Asunto establecido:', aiSubject);
          }
          if (aiTo) {
            setTo([aiTo]);
            console.log('📤 Destinatario establecido:', aiTo);
          }
          if (aiBody) {
            setBody(aiBody);
            console.log('📄 Cuerpo establecido');
          }
          
          const Toast = window.Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
          });
          Toast.fire({ icon: 'success', title: '¡Correo redactado!' });
        } else {
          throw new Error(response.error);
        }
      } catch (e: any) {
        console.error('❌ Error en IA:', e);
        loadingModal.close();
        await window.Swal.fire({
          icon: 'error',
          title: 'Error IA',
          text: 'No pude generar el correo.',
        });
      }
    } else {
      console.log('❌ Usuario canceló el prompt');
    }
  };

  if (!isOpen) return null;

  const modalWidth = isMobile ? '95vw' : (isMaximized ? '95vw' : '500px');
  const modalHeight = isMobile ? '95vh' : (isMaximized ? '90vh' : '600px');
  const modalBottom = isMobile ? '2.5vh' : (isMinimized ? '0' : '20px');
  const modalRight = isMobile ? '2.5vw' : (isMaximized ? '2.5vw' : '20px');
  const modalLeft = isMobile ? '2.5vw' : 'auto';

  return (
    <div
      className="compose-modal"
      style={{
        position: 'fixed',
        bottom: modalBottom,
        right: modalRight,
        left: modalLeft,
        width: modalWidth,
        height: modalHeight,
        background: 'var(--bg-card, #ffffff)',
        borderRadius: isMinimized ? '8px 8px 0 0' : '12px 12px 0 0',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2000,
        border: '1px solid var(--border-color, #e5e7eb)',
        transition: 'all 0.3s',
        transform: isMinimized ? 'translateY(calc(100% - 40px))' : 'translateY(0)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      <div
        ref={dragOverlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          zIndex: 3000,
          borderRadius: '12px 12px 0 0',
        }}
      >
        {t.drop_files}
      </div>

      {/* Header */}
      <div
        style={{
          background: 'var(--bg-hover, #f3f4f6)',
          padding: '10px 15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color, #e5e7eb)',
          borderRadius: '12px 12px 0 0',
          color: 'var(--text-main, #374151)',
          cursor: isMinimized ? 'pointer' : 'default',
        }}
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        <span style={{ fontWeight: '600' }}>{t.new_message}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              setIsMinimized(!isMinimized);
              setIsMaximized(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #6b7280)',
              fontSize: '1rem',
            }}
            title="Minimizar"
          >
            <i className="fas fa-minus"></i>
          </button>
          <button
            onClick={() => {
              setIsMaximized(!isMaximized);
              setIsMinimized(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #6b7280)',
              fontSize: '1rem',
            }}
            title="Maximizar"
          >
            <i className={`fas fa-${isMaximized ? 'compress' : 'expand'}`}></i>
          </button>
          <button
            onClick={resetForm}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #6b7280)',
              fontSize: '1rem',
            }}
            title="Cerrar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
            <ComposeEditor
              from={user.email}
              to={to}
              cc={cc}
              bcc={bcc}
              subject={subject}
              body={body}
              onToChange={setTo}
              onCcChange={setCc}
              onBccChange={setBcc}
              onSubjectChange={setSubject}
              onBodyChange={setBody}
              onAiGenerate={() => {
                console.log('🤖 onAiGenerate llamado desde ComposeModal');
                handleAiGenerate();
              }}
              contacts={contacts}
              currentLang={lang}
            />
            <AttachmentsList
              attachments={attachments}
              onRemove={(index) => {
                setAttachments((prev) => prev.filter((_, i) => i !== index));
              }}
              currentLang={lang}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 15px',
              borderTop: '1px solid var(--border-color, #e5e7eb)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <button
                onClick={handleSend}
                style={{
                  background: 'var(--primary-red, #D50032)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginRight: '5px',
                }}
              >
                {t.send}
              </button>
              <button
                onClick={handleSaveDraft}
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted, #6b7280)',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Borrador
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                multiple
                onChange={(e) => handleFileChange(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #6b7280)',
                  fontSize: '1rem',
                  padding: '5px',
                  borderRadius: '4px',
                }}
                title={t.attach}
              >
                <i className="fas fa-paperclip"></i>
              </button>
              <button
                onClick={resetForm}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontSize: '1rem',
                  padding: '5px',
                  borderRadius: '4px',
                }}
                title={t.discard}
              >
                <i className="far fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ComposeModal;
