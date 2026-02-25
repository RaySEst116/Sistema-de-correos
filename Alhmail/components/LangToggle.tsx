import React, { useEffect, useState } from 'react';

const translations = {
  es: 'ES',
  en: 'EN',
};

const LangToggle: React.FC = () => {
  const [lang, setLang] = useState<'es' | 'en'>('es');

  useEffect(() => {
    const saved = localStorage.getItem('alhmail_lang') as 'es' | 'en' || 'es';
    setLang(saved);
  }, []);

  const toggle = () => {
    const newLang = lang === 'es' ? 'en' : 'es';
    setLang(newLang);
    localStorage.setItem('alhmail_lang', newLang);
    // Opcional: disparar evento para que otros componentes se actualicen
    window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: newLang } }));
  };

  return (
    <button
      onClick={toggle}
      style={{
        width: '100%',
        height: '35px',
        background: 'var(--bg-hover, #f3f4f6)',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        color: 'var(--text-muted, #6b7280)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: '0.2s',
        fontSize: '0.85rem',
        fontWeight: 'bold',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'var(--border-color, #e5e7eb)';
        e.currentTarget.style.color = 'var(--text-main, #374151)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover, #f3f4f6)';
        e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
      }}
      title={lang === 'es' ? 'Cambiar a inglés' : 'Cambiar a español'}
    >
      <i className="fas fa-globe" style={{ marginRight: '5px' }}></i>
      {translations[lang]}
    </button>
  );
};

export default LangToggle;
