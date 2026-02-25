
import React, { useState, useEffect } from 'react';
import { FolderType } from '../types';
import ThemeToggle from './ThemeToggle';
import LangToggle from './LangToggle';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  currentFolder: FolderType;
  setFolder: (folder: FolderType) => void;
  onCompose: () => void;
  onAccount: () => void;
  onUsers: () => void;
  onLogout: () => void;
  unreadCount: number;
  isAdmin: boolean;
  showSpam?: boolean;
  isMobile?: boolean;
  isOpen?: boolean;
}

const translations = {
  es: {
    compose: 'Redactar',
    inbox: 'Entrada',
    sent: 'Enviados',
    drafts: 'Borradores',
    spam: 'Spam',
    users: 'Usuarios',
    account: 'Mi Cuenta',
    logout: 'Cerrar Sesión',
  },
  en: {
    compose: 'Compose',
    inbox: 'Inbox',
    sent: 'Sent',
    drafts: 'Drafts',
    spam: 'Spam',
    users: 'Users',
    account: 'My Account',
    logout: 'Logout',
  },
};

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  toggleSidebar,
  currentFolder,
  setFolder,
  onCompose,
  onAccount,
  onUsers,
  onLogout,
  unreadCount,
  isAdmin,
  showSpam = false,
  isMobile = false,
  isOpen = false,
}) => {
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>('es');

  useEffect(() => {
    const lang = localStorage.getItem('alhmail_lang') as 'es' | 'en' || 'es';
    setCurrentLang(lang);
    const handleLangChange = (e: CustomEvent) => {
      setCurrentLang(e.detail.lang);
    };
    window.addEventListener('langChanged' as any, handleLangChange);
    return () => window.removeEventListener('langChanged' as any, handleLangChange);
  }, []);

  const t = translations[currentLang];

  const navItems: { id: FolderType; icon: string; labelKey: keyof typeof translations.es }[] = [
    { id: 'inbox', icon: 'fa-inbox', labelKey: 'inbox' },
    { id: 'sent', icon: 'fa-paper-plane', labelKey: 'sent' },
    { id: 'drafts', icon: 'fa-file', labelKey: 'drafts' },
  ];

  if (showSpam) {
    navItems.push({ id: 'spam', icon: 'fa-exclamation-triangle', labelKey: 'spam' });
  }

  return (
    <nav
      className={`sidebar ${isMobile && isOpen ? 'mobile-open' : ''}`}
      style={{
        width: isMobile ? '250px' : (isCollapsed ? '80px' : '250px'),
        background: 'var(--bg-sidebar, #ffffff)',
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '20px 10px' : (isCollapsed ? '20px 5px' : '20px 10px'),
        borderRight: isMobile ? 'none' : '1px solid var(--border-color, #e5e7eb)',
        transition: isMobile ? 'left 0.3s ease, transform 0.3s ease' : '0.3s',
        zIndex: isMobile ? 1000 : 100,
        flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile ? '0' : 'auto',
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-250px)') : 'none',
        top: isMobile ? '0' : 'auto',
        height: isMobile ? '100vh' : 'auto',
        boxShadow: isMobile && isOpen ? '2px 0 10px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div
        className="sidebar-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '30px',
          padding: '0 10px',
          alignItems: 'center',
          height: '40px',
        }}
      >
        {!isCollapsed && (
          <div
            className="logo-text"
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'var(--primary-red, #D50032)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            Alhmail
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="toggle-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.4rem',
            color: 'var(--text-muted, #6b7280)',
            width: '40px',
          }}
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>

      <button
        onClick={onCompose}
        className="compose-btn"
        style={{
          background: 'var(--primary-red, #D50032)',
          color: 'white',
          border: 'none',
          height: '45px',
          width: isCollapsed ? '45px' : '90%',
          margin: '0 auto 30px auto',
          borderRadius: isCollapsed ? '50%' : '50px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isCollapsed ? '0' : '10px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          boxShadow: '0 2px 5px rgba(213,0,50,0.3)',
          flexShrink: 0,
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = '#C20049')}
        onMouseOut={(e) => (e.currentTarget.style.background = 'var(--primary-red, #D50032)')}
      >
        <i className="fas fa-plus" style={{ margin: isCollapsed ? '0' : '0' }}></i>
        {!isCollapsed && <span>{t.compose}</span>}
      </button>

      <ul
        className="nav-list"
        style={{
          listStyle: 'none',
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {navItems.map((item) => (
          <li
            key={item.id}
            className={`nav-item ${currentFolder === item.id ? 'active' : ''}`}
            onClick={() => setFolder(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: isCollapsed ? '12px 0' : '12px 20px',
              marginBottom: '5px',
              color: currentFolder === item.id ? 'var(--primary-red, #D50032)' : 'var(--text-muted, #6b7280)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: '0.2s',
              whiteSpace: 'nowrap',
              position: 'relative',
              fontWeight: currentFolder === item.id ? '600' : 'normal',
            }}
            onMouseOver={(e) => {
              if (currentFolder !== item.id) {
                e.currentTarget.style.background = 'var(--bg-hover, #f3f4f6)';
                e.currentTarget.style.color = 'var(--primary-red, #D50032)';
              }
            }}
            onMouseOut={(e) => {
              if (currentFolder !== item.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
              }
            }}
          >
            <i
              className={`fas ${item.icon}`}
              style={{
                width: '25px',
                marginRight: isCollapsed ? '0' : '10px',
                textAlign: 'center',
                fontSize: '1.1rem',
                flexShrink: 0,
              }}
            />
            {!isCollapsed && <span>{t[item.labelKey]}</span>}
            {item.id === 'inbox' && unreadCount > 0 && (
              <span
                className="notification-badge"
                style={{
                  backgroundColor: 'var(--primary-red, #D50032)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  marginLeft: 'auto',
                  minWidth: '20px',
                  textAlign: 'center',
                  display: isCollapsed ? 'none' : 'inline-block',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div
        className="sidebar-footer"
        style={{
          borderTop: '1px solid var(--border-color, #e5e7eb)',
          paddingTop: '15px',
          paddingBottom: '10px',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
          width: '100%',
        }}
      >
        <div
          className="settings-row"
          style={{
            display: 'flex',
            gap: '5px',
            width: isCollapsed ? '45px' : '90%',
            justifyContent: 'center',
            marginBottom: '5px',
            flexDirection: isCollapsed ? 'column' : 'row',
          }}
        >
          <ThemeToggle />
          <LangToggle />
        </div>

        {isAdmin && (
          <div
            className="footer-item admin"
            onClick={onUsers}
            style={{
              width: isCollapsed ? '45px' : '90%',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#047857',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: '0.2s',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem',
              fontWeight: '600',
              background: 'rgba(4, 120, 87, 0.1)',
              border: '1px solid rgba(4, 120, 87, 0.2)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#047857';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = '#047857';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(4, 120, 87, 0.1)';
              e.currentTarget.style.color = '#047857';
              e.currentTarget.style.borderColor = 'rgba(4, 120, 87, 0.2)';
            }}
          >
            <i className="fas fa-users-cog" style={{ marginRight: isCollapsed ? '0' : '8px' }}></i>
            {!isCollapsed && <span>{t.users}</span>}
          </div>
        )}

        <div
          className="footer-item"
          onClick={onAccount}
          style={{
            width: isCollapsed ? '45px' : '90%',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted, #6b7280)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: '0.2s',
            whiteSpace: 'nowrap',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover, #f3f4f6)';
            e.currentTarget.style.color = 'var(--primary-red, #D50032)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
          }}
        >
          <i className="fas fa-user-circle" style={{ marginRight: isCollapsed ? '0' : '8px' }}></i>
          {!isCollapsed && <span>{t.account}</span>}
        </div>

        <div
          className="footer-item logout"
          onClick={onLogout}
          style={{
            width: isCollapsed ? '45px' : '90%',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: '0.2s',
            whiteSpace: 'nowrap',
            fontSize: '0.9rem',
            fontWeight: '600',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          <i className="fas fa-sign-out-alt" style={{ marginRight: isCollapsed ? '0' : '8px' }}></i>
          {!isCollapsed && <span>{t.logout}</span>}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
