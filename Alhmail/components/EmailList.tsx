
import React, { useState, useEffect } from 'react';
import { Email, FolderType } from '../types';
import EmailListItem from './EmailListItem';
import SearchBar from './SearchBar';
import EmailToolbar from './EmailToolbar';
import '../styles/components/EmailList.css';

interface EmailListProps {
  emails: Email[];
  folder: FolderType;
  selectedEmailId: number | null;
  onSelectEmail: (email: Email) => void;
  width: number;
  onRefresh?: () => void;
  onSort?: () => void;
  onDeleteSelected?: (ids: number[]) => void;
  onMarkRead?: (ids: number[]) => void;
  currentLang?: 'es' | 'en';
  loading?: boolean;
  isMobile?: boolean;
  onMobileMenuToggle?: () => void; // Nueva prop para el menú móvil
}

const translations = {
  es: {
    inbox: 'Bandeja de Entrada',
    sent: 'Enviados',
    drafts: 'Borradores',
    spam: 'Spam',
    trash: 'Papelera',
    work: 'Trabajo',
    personal: 'Personal',
    quarantine: '⚠️ Cuarentena (Amenazas Detectadas)',
    loading: 'Cargando...',
    empty: 'Vacío',
  },
  en: {
    inbox: 'Inbox',
    sent: 'Sent',
    drafts: 'Drafts',
    spam: 'Spam',
    trash: 'Trash',
    work: 'Work',
    personal: 'Personal',
    quarantine: '⚠️ Quarantine (Threats Detected)',
    loading: 'Loading...',
    empty: 'Empty',
  },
};

const EmailList: React.FC<EmailListProps> = ({
  emails,
  folder,
  selectedEmailId,
  onSelectEmail,
  width,
  onRefresh,
  onSort,
  onDeleteSelected,
  onMarkRead,
  currentLang = 'es',
  loading = false,
  isMobile = false,
  onMobileMenuToggle, // Nueva prop
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lang, setLang] = useState<'es' | 'en'>('es');

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

  const filteredEmails = emails.filter((email) => {
    const term = searchTerm.toLowerCase();
    return (
      email.subject.toLowerCase().includes(term) ||
      email.sender.toLowerCase().includes(term) ||
      email.preview.toLowerCase().includes(term)
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredEmails.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleCheck = (emailId: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(emailId);
    } else {
      newSet.delete(emailId);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = () => {
    if (onDeleteSelected && selectedIds.size > 0) {
      onDeleteSelected(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleMarkRead = () => {
    if (onMarkRead && selectedIds.size > 0) {
      onMarkRead(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const folderTitle = t[folder] || 'Carpeta';

  return (
    <div className="email-list-container">
      <div className="email-list-header">
        <div className="email-list-header-content">
          {isMobile && onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="email-list-mobile-menu-btn"
            >
              <i className="fas fa-bars"></i>
            </button>
          )}
          <h3 className={`email-list-title ${folder === 'quarantine' ? 'quarantine' : ''}`}>
            {folderTitle}
          </h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="email-list-refresh-btn"
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--primary-red)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              title="Actualizar"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          )}
        </div>
      </div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} currentLang={lang} />
      <EmailToolbar
        onSelectAll={handleSelectAll}
        onDeleteSelected={handleDeleteSelected}
        onMarkRead={handleMarkRead}
        onSort={onSort || (() => {})}
        hasSelected={selectedIds.size > 0}
        currentLang={lang}
      />
      <div
        id="emailContainer"
        className="email-list-container-scroll"
      >
        {filteredEmails.length === 0 ? (
          <div className="email-list-empty-state">
            <i className="fas fa-inbox email-list-empty-icon"></i>
            <div className="email-list-empty-title">
              {loading ? t.loading : t.empty}
            </div>
            {!loading && (
              <div className="email-list-empty-subtitle">
                {folder === 'inbox' ? 'No hay correos nuevos' : 
                 folder === 'sent' ? 'No hay correos enviados' :
                 folder === 'drafts' ? 'No hay borradores' :
                 folder === 'spam' ? 'No hay correos spam' :
                 folder === 'trash' ? 'La papelera está vacía' :
                 'No hay correos en esta carpeta'}
              </div>
            )}
          </div>
        ) : (
          filteredEmails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              isSelected={selectedEmailId === email.id}
              isChecked={selectedIds.has(email.id)}
              onSelect={onSelectEmail}
              onCheck={handleCheck}
              currentLang={lang}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EmailList;
