import React from 'react';
import { Email } from '../types';

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: (email: Email) => void;
  onCheck: (emailId: number, checked: boolean) => void;
  currentLang?: 'es' | 'en';
}

const translations = {
  es: { to: 'Para' },
  en: { to: 'To' },
};

const EmailListItem: React.FC<EmailListItemProps> = ({
  email,
  isSelected,
  isChecked,
  onSelect,
  onCheck,
  currentLang = 'es',
}) => {
  const t = translations[currentLang];

  // Extraer nombre del remitente
  const rawName = email.sender.split('<')[0].replace(/"/g, '').trim();
  const initial = rawName.charAt(0).toUpperCase();

  // Color de avatar basado en el nombre
  const getColorFromStr = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 45%)`;
  };
  const avatarColor = getColorFromStr(rawName);

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheck(email.id, e.target.checked);
  };

  return (
    <div
      style={{
        padding: '15px',
        borderBottom: '1px solid var(--border-color)',
        cursor: 'pointer',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        borderLeft: '4px solid transparent',
        color: 'var(--text-main)',
        backgroundColor: isSelected ? 'var(--bg-active)' : email.unread ? 'var(--bg-card)' : 'transparent',
        borderLeftColor: (isSelected || email.unread) ? 'var(--primary-red)' : 'transparent',
      }}
      onClick={() => onSelect(email)}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleCheck}
        onClick={(e) => e.stopPropagation()}
        style={{
          appearance: 'none',
          width: '18px',
          height: '18px',
          border: '2px solid var(--text-muted)',
          borderRadius: '4px',
          cursor: 'pointer',
          background: isChecked ? 'var(--primary-red)' : 'var(--bg-card)',
          position: 'relative',
          flexShrink: 0,
          marginTop: '2px',
        }}
      />
      {isChecked && (
        <span
          style={{
            position: 'absolute',
            left: '6px',
            top: '6px',
            width: '4px',
            height: '10px',
            border: 'solid white',
            borderWidth: '0 2px 2px 0',
            transform: 'rotate(45deg)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: avatarColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          flexShrink: 0,
        }}
      >
        {initial}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
            {rawName}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {new Date(email.date).toLocaleDateString()}
          </span>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '2px' }}>
          {email.subject}
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {email.preview.replace('Para: ? -', '')}
        </div>
      </div>
    </div>
  );
};

export default EmailListItem;
