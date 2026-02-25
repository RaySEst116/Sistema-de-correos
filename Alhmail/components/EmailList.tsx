
import React, { useState, useEffect } from 'react';
import { Email, FolderType } from '../types';
import EmailListItem from './EmailListItem';
import SearchBar from './SearchBar';
import EmailToolbar from './EmailToolbar';

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
    <div
      style={{
        width: `${width}px`,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-color, #e5e7eb)',
        flexShrink: 0,
        background: 'var(--bg-card, #ffffff)',
      }}
    >
      <div
        style={{
          padding: '15px',
          borderBottom: '1px solid var(--border-color, #e5e7eb)',
          backgroundColor: 'var(--bg-card, #ffffff)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <h3
            style={{
              color: folder === 'quarantine' ? '#dc2626' : 'var(--primary-red, #D50032)',
              margin: 0,
            }}
          >
            {folderTitle}
          </h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted, #6b7280)',
                fontSize: '1.1rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s',
                outline: 'none',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--border-color, #e5e7eb)';
                e.currentTarget.style.color = 'var(--primary-red, #D50032)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
              }}
              title="Actualizar"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          )}
        </div>
        <SearchBar value={searchTerm} onChange={setSearchTerm} currentLang={lang} />
      </div>

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
        style={{
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {filteredEmails.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-muted, #6b7280)',
            }}
          >
            {searchTerm ? t.empty : t.loading}
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
