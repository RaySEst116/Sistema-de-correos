import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  currentLang?: 'es' | 'en';
}

const translations = {
  es: { search: 'Buscar...' },
  en: { search: 'Search...' },
};

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
  currentLang = 'es',
}) => {
  const t = translations[currentLang];
  const ph = placeholder || t.search;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <i
        className="fas fa-search"
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        style={{
          width: '100%',
          padding: '8px 10px 8px 35px',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          background: 'var(--input-bg)',
          color: 'var(--text-main)',
          outline: 'none',
        }}
      />
    </div>
  );
};

export default SearchBar;
