import React from 'react';

interface EmailToolbarProps {
  onSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  onMarkRead: () => void;
  onSort: () => void;
  hasSelected: boolean;
  currentLang?: 'es' | 'en';
}

const translations = {
  es: {
    select_all: 'Seleccionar Todo',
    delete: 'Eliminar',
    mark_read: 'Marcar Leído',
    sort: 'Ordenar',
  },
  en: {
    select_all: 'Select All',
    delete: 'Delete',
    mark_read: 'Mark Read',
    sort: 'Sort',
  },
};

const EmailToolbar: React.FC<EmailToolbarProps> = ({
  onSelectAll,
  onDeleteSelected,
  onMarkRead,
  onSort,
  hasSelected,
  currentLang = 'es',
}) => {
  const t = translations[currentLang];

  return (
    <div
      style={{
        padding: '8px 15px',
        background: 'var(--bg-hover)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        height: '50px',
      }}
    >
      <input
        type="checkbox"
        title={t.select_all}
        onChange={(e) => onSelectAll(e.target.checked)}
        style={{
          appearance: 'none',
          width: '18px',
          height: '18px',
          border: '2px solid var(--text-muted)',
          borderRadius: '4px',
          cursor: 'pointer',
          background: 'var(--bg-card)',
          position: 'relative',
          flexShrink: 0,
        }}
        onClick={(e) => {
          const checked = (e.target as HTMLInputElement).checked;
          if (checked) {
            (e.target as HTMLInputElement).style.background = 'var(--primary-red)';
            (e.target as HTMLInputElement).style.borderColor = 'var(--primary-red)';
            const after = document.createElement('span');
            after.style.position = 'absolute';
            after.style.left = '5px';
            after.style.top = '1px';
            after.style.width = '4px';
            after.style.height = '10px';
            after.style.border = 'solid white';
            after.style.borderWidth = '0 2px 2px 0';
            after.style.transform = 'rotate(45deg)';
            (e.target as HTMLInputElement).appendChild(after);
          } else {
            (e.target as HTMLInputElement).style.background = 'var(--bg-card)';
            (e.target as HTMLInputElement).style.borderColor = 'var(--text-muted)';
            const after = (e.target as HTMLInputElement).querySelector('span');
            if (after) after.remove();
          }
        }}
      />
      <button
        onClick={onDeleteSelected}
        disabled={!hasSelected}
        title={t.delete}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: hasSelected ? 'pointer' : 'not-allowed',
          color: hasSelected ? 'var(--text-muted)' : 'var(--border-color)',
          fontSize: '1.1rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: '0.2s',
          outline: 'none',
          opacity: hasSelected ? 1 : 0.5,
        }}
        onMouseOver={(e) => {
          if (hasSelected) {
            e.currentTarget.style.backgroundColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--primary-red)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          if (hasSelected) {
            e.currentTarget.style.backgroundColor = 'rgba(213, 0, 50, 0.15)';
            e.currentTarget.style.transform = 'scale(0.95)';
          }
        }}
      >
        <i className="far fa-trash-alt"></i>
      </button>
      <button
        onClick={onMarkRead}
        disabled={!hasSelected}
        title={t.mark_read}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: hasSelected ? 'pointer' : 'not-allowed',
          color: hasSelected ? 'var(--text-muted)' : 'var(--border-color)',
          fontSize: '1.1rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: '0.2s',
          outline: 'none',
          opacity: hasSelected ? 1 : 0.5,
        }}
        onMouseOver={(e) => {
          if (hasSelected) {
            e.currentTarget.style.backgroundColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--primary-red)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          if (hasSelected) {
            e.currentTarget.style.backgroundColor = 'rgba(213, 0, 50, 0.15)';
            e.currentTarget.style.transform = 'scale(0.95)';
          }
        }}
      >
        <i className="far fa-envelope-open"></i>
      </button>
      <button
        onClick={onSort}
        title={t.sort}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: '0.2s',
          outline: 'none',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--primary-red)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(213, 0, 50, 0.15)';
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
      >
        <i className="fas fa-sort-amount-down"></i>
      </button>
    </div>
  );
};

export default EmailToolbar;
