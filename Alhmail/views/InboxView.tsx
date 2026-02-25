import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import EmailList from '../components/EmailList';
import EmailDetail from '../components/EmailDetail';
import ComposeModal from '../components/ComposeModal';
import AccountModal from '../components/AccountModal';
import { db } from '../services/db';
import { websocketService } from '../services/websocket';
import { classifyEmailContent /*, generateSyntheticEmail */ } from '../services/geminiService'; // IA desactivada
import { Email, FolderType, User } from '../types';

interface InboxViewProps {
  user: User;
  onLogout: () => void;
}

const translations = {
  es: {
    confirm_logout: '¿Salir?',
    confirm_delete: '¿Descartar?',
    deleted: 'Eliminado',
    marked_read: 'Marcado como leído',
    saved_success: 'Guardado',
    sent_success: 'Enviado',
    error_send: 'Error al enviar',
    missing_dest: 'Falta el destinatario',
    updated: 'Actualizado',
  },
  en: {
    confirm_logout: 'Logout?',
    confirm_delete: 'Discard?',
    deleted: 'Deleted',
    marked_read: 'Marked as read',
    saved_success: 'Saved',
    sent_success: 'Sent',
    error_send: 'Error sending',
    missing_dest: 'Missing recipient',
    updated: 'Updated',
  },
};

const InboxView: React.FC<InboxViewProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  // App State
  const [emails, setEmails] = useState<Email[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderType>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [listWidth, setListWidth] = useState(350);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [dbOnline, setDbOnline] = useState(false);
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>('es');
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<{ name: string; email: string }[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_URL = 'http://localhost:3001';

  // Load language and initial data
  useEffect(() => {
    const lang = localStorage.getItem('alhmail_lang') as 'es' | 'en' || 'es';
    setCurrentLang(lang);
    const handleLangChange = (e: CustomEvent) => {
      setCurrentLang(e.detail.lang);
    };
    window.addEventListener('langChanged' as any, handleLangChange);
    return () => window.removeEventListener('langChanged' as any, handleLangChange);
  }, []);

  // Load Emails on component mount and when user changes
  useEffect(() => {
    loadEmails();
  }, [user.email]);

  // Load contacts and users
  useEffect(() => {
    loadContacts();
    if (user.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  // WebSocket - Escuchar nuevos correos para actualizar la lista (sin mostrar toast)
  useEffect(() => {
    const handleNewEmail = (data: any) => {
      // Solo actualizar si el correo es para el usuario actual
      if (data.userEmail === user.email) {
        // Recargar correos para obtener el nuevo
        loadEmails();
      }
    };

    websocketService.on('new-email', handleNewEmail);

    return () => {
      websocketService.off('new-email', handleNewEmail);
    };
  }, [user.email]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      // Solo cargar correos del API para el usuario actual
      const res = await fetch(`${API_URL}/emails?userEmail=${user.email}`);
      const emailsFromAPI = await res.json();
      
      // Filtrar correos por usuario actual para mayor seguridad
      const userEmails = emailsFromAPI.filter((email: Email) => 
        email.owner_email === user.email
      );
      
      setEmails(userEmails);
      updateUnreadCount(userEmails);
      
      // NOTA: No eliminamos correos de la BD después de cargarlos
      // Los correos deben persistir en el sistema
      
    } catch (error) {
      console.error('Error cargando correos:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCount = (emailsData?: Email[]) => {
    const data = emailsData || emails;
    const count = data.filter(e => e.folder === 'inbox' && e.unread).length;
    setUnreadCount(count);
  };

  const loadContacts = async () => {
    try {
      const resUsers = await fetch(`${API_URL}/users`);
      const usersData = await resUsers.json();
      const resContacts = await fetch(`${API_URL}/contacts`);
      const contactsData = await resContacts.json();
      setContacts([...usersData, ...contactsData]);
    } catch (e) {}
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const usersData = await res.json();
      setUsers(usersData);
    } catch (e) {}
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (email.unread) {
      const updated = emails.map(e => e.id === email.id ? { ...e, unread: false } : e);
      setEmails(updated);
      localStorage.setItem('alhmail_emails', JSON.stringify(updated));
      updateUnreadCount(updated);
      setSelectedEmail({ ...email, unread: false });
    }
  };

  const handleSendEmail = async (data: {
    from: string;
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    isDraft: boolean;
    attachments: any[];
  }) => {
    try {
      const res = await fetch(`${API_URL}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const t = translations[currentLang];
        if (!window.Swal) {
          alert(data.isDraft ? t.saved_success : t.sent_success);
          setIsComposeOpen(false);
          return;
        }
        await window.Swal.fire({
          icon: 'success',
          title: data.isDraft ? t.saved_success : t.sent_success,
        });
        setIsComposeOpen(false);
        setTimeout(loadEmails, 500);
      } else {
        const t = translations[currentLang];
        if (!window.Swal) {
          alert(t.error_send);
          return;
        }
        await window.Swal.fire({ icon: 'error', title: t.error_send });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSelected = async (ids: number[]) => {
    const t = translations[currentLang];
    if (!window.Swal) {
      if (confirm(`${t.confirm_delete} ${ids.length} correos?`)) {
        const updated = emails.filter(e => !ids.includes(e.id));
        setEmails(updated);
        localStorage.setItem('alhmail_emails', JSON.stringify(updated));
        updateUnreadCount(updated);
        alert(t.deleted);
      }
      return;
    }
    const result = await window.Swal.fire({
      title: `${t.confirm_delete} ${ids.length} correos?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D50032',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      const updated = emails.filter(e => !ids.includes(e.id));
      setEmails(updated);
      localStorage.setItem('alhmail_emails', JSON.stringify(updated));
      updateUnreadCount(updated);
      await window.Swal.fire({
        icon: 'success',
        title: t.deleted,
        timer: 1000,
        showConfirmButton: false,
      });
    }
  };

  const handleMarkRead = async (ids: number[]) => {
    const updated = emails.map(e => (ids.includes(e.id) ? { ...e, unread: false } : e));
    setEmails(updated);
    localStorage.setItem('alhmail_emails', JSON.stringify(updated));
    updateUnreadCount(updated);
    const t = translations[currentLang];
    if (!window.Swal) {
      alert(t.marked_read);
      return;
    }
    await window.Swal.fire({
      icon: 'success',
      title: t.marked_read,
      timer: 1000,
      showConfirmButton: false,
    });
  };

  const handleAccountSave = async (data: Partial<User>) => {
    const url = isCreatingUser ? `${API_URL}/users` : `${API_URL}/users/${selectedUserId}`;
    const method = isCreatingUser ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error');
    if (!isCreatingUser && selectedUserId === user.id) {
      const updatedUser = { ...user, ...data };
      localStorage.setItem('alhmail_user', JSON.stringify(updatedUser));
      if (data.role !== 'admin' && user.role === 'admin') {
        window.location.reload();
      }
    }
    if (user.role === 'admin') {
      await loadUsers();
    }
  };

  const handleUserDelete = async (id: string) => {
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
    await loadUsers();
  };

  const handleUserEdit = (u: User) => {
    setSelectedUserId(u.id);
    setIsCreatingUser(false);
    setIsUsersOpen(false);
    setIsAccountOpen(true);
  };

  const handleUserCreate = () => {
    setIsCreatingUser(true);
    setSelectedUserId(null);
    setIsUsersOpen(false);
    setIsAccountOpen(true);
  };

  const handleLogout = async () => {
    const t = translations[currentLang];
    if (!window.Swal) {
      if (confirm(t.confirm_logout)) {
        await db.logout();
        onLogout();
        navigate('/login');
      }
      return;
    }
    const result = await window.Swal.fire({
      title: t.confirm_logout,
      showCancelButton: true,
      confirmButtonColor: '#D50032',
      confirmButtonText: 'Salir',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      await db.logout();
      onLogout();
      navigate('/login');
    }
  };

  const processIncomingEmail = async (data: { sender: string, replyTo?: string, email?: string, subject: string, body: string, attachment?: string }) => {
    setSimulating(true);
    try {
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
        email: data.sender.includes('<') ? data.sender.match(/<([^>]+)>/)![1] : data.sender,
        replyTo: data.replyTo,
        subject: data.subject,
        body: data.body,
        preview: data.body.substring(0, 60) + '...',
        date: new Date().toISOString(),
        hasAttachments: !!data.attachment,
        attachmentName: data.attachment,
        riskLevel: classification.riskLevel,
        riskReason: classification.riskReason,
        securityAnalysis: classification.securityAnalysis
      };

      const updated = [newEmail, ...emails];
      setEmails(updated);
      localStorage.setItem('alhmail_emails', JSON.stringify(updated));
      updateUnreadCount(updated);

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

  // const handleAutoSimulate = async () => { // COMENTADO - IA DESACTIVADA
//   const synthetic = await generateSyntheticEmail();
//   await processIncomingEmail({
//     sender: synthetic.sender || 'random@internet.com',
//     subject: synthetic.subject || 'Random Subject',
//     body: synthetic.body || 'Random Body',
//     attachment: Math.random() > 0.7 ? 'virus.exe' : undefined
//   });
// };

  const handleConnectService = async () => {
    const service = prompt("Escribe 'G' para Gmail o 'O' para Outlook:");
    if (!service) return;
    setConnecting(true);
    await new Promise(r => setTimeout(r, 2000));
    alert(`Conexión Segura (TLS 1.3) establecida con ${service.toLowerCase() === 'g' ? 'Google' : 'Microsoft'}.`);
    // handleAutoSimulate(); // COMENTADO - IA DESACTIVADA
    setConnecting(false);
  };

  const handleAdminAction = async (action: 'block' | 'allow', email: Email) => {
    if (action === 'block') {
      const confirmed = window.confirm(`CONFIRMAR ELIMINACIÓN:\n\nEsto enviará la huella digital del archivo a la base de datos de amenazas y bloqueará el dominio.`);
      if (confirmed) {
        await db.addToBlacklist(email.email);
        const updated = emails.filter(e => e.id !== email.id);
        setEmails(updated);
        localStorage.setItem('alhmail_emails', JSON.stringify(updated));
        updateUnreadCount(updated);
        setSelectedEmail(null);
      }
    } else if (action === 'allow') {
      const updated = emails.map(e => e.id === email.id ? { ...e, folder: 'inbox' as FolderType } : e);
      setEmails(updated);
      localStorage.setItem('alhmail_emails', JSON.stringify(updated));
      updateUnreadCount(updated);
      setSelectedEmail(null);
    }
  };

  // Resizer logic
  const isResizing = useRef(false);
  const handleMouseDown = () => { isResizing.current = true; document.body.style.cursor = 'col-resize'; };
  const handleMouseUp = () => { isResizing.current = false; document.body.style.cursor = 'default'; };
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const sidebarWidth = sidebarCollapsed ? 80 : 250;
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

  const filteredEmails = emails.filter(e => e.folder === currentFolder);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-main, #f3f4f6)', fontFamily: 'system-ui, sans-serif' }}>
      {connecting && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontFamily: 'monospace'
        }}>
          <i className="fas fa-shield-virus fa-spin" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#10b981' }}></i>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>ESTABLECIENDO TÚNEL SEGURO...</p>
          <div style={{ fontSize: '0.75rem', color: '#10b981', opacity: 0.8, lineHeight: 1.5 }}>
            <p> Handshake TLS 1.3... OK</p>
            <p> Verificando Certificados... OK</p>
            <p> Escaneando Headers en busca de Spoofing... OK</p>
          </div>
        </div>
      )}

      <Sidebar
        isCollapsed={sidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentFolder={currentFolder}
        setFolder={(f) => { setCurrentFolder(f); setSelectedEmail(null); }}
        onCompose={() => setIsComposeOpen(true)}
        onAccount={() => { setIsCreatingUser(false); setSelectedUserId(user.id); setIsAccountOpen(true); }}
        onUsers={() => setIsUsersOpen(true)}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        isAdmin={user.role === 'admin'}
        showSpam={user.role === 'admin'}
      />

      <main style={{
        flex: 1, display: 'flex', background: 'var(--bg-card, #ffffff)',
        margin: '12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid var(--border-color, #e5e7eb)', overflow: 'hidden', position: 'relative'
      }}>
        <EmailList
          emails={filteredEmails}
          folder={currentFolder}
          selectedEmailId={selectedEmail?.id || null}
          onSelectEmail={handleSelectEmail}
          width={listWidth}
          onRefresh={loadEmails}
          onDeleteSelected={handleDeleteSelected}
          onMarkRead={handleMarkRead}
          currentLang={currentLang}
          loading={loading}
        />

        <div
          onMouseDown={handleMouseDown}
          style={{ width: '4px', background: 'var(--border-color, #e5e7eb)', cursor: 'col-resize', zIndex: 10 }}
        />

        <EmailDetail
          email={selectedEmail}
          onAdminAction={handleAdminAction}
        />

        {/* Simulation & Logout Buttons */}
        {/* <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 50, display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAutoSimulate}
            disabled={simulating}
            style={{
              background: '#1f2937', color: 'white', fontSize: '0.75rem',
              padding: '6px 12px', borderRadius: '6px', border: 'none',
              cursor: simulating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              opacity: simulating ? 0.75 : 1
            }}
          >
            <i className={`fas fa-random ${simulating ? 'animate-spin' : ''}`}></i>
            {simulating ? 'Analizando...' : 'Auto Simulación'}
          </button>
        </div> */} // COMENTADO - IA DESACTIVADA
      </main>

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
        user={user}
        contacts={contacts}
        currentLang={currentLang}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => { setIsAccountOpen(false); }}
        user={user}
        onSave={handleAccountSave}
        isCreating={false}
        isAdmin={user.role === 'admin'}
      />

      {user.role === 'admin' && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 50 }}>
          <a
            href="/admin"
            style={{
              background: '#1f2937',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <i className="fas fa-cog"></i>
            Panel Admin
          </a>
        </div>
      )}
    </div>
  );
};

export default InboxView;
