import React, { useEffect, useState } from 'react';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('alhmail_theme') as 'light' | 'dark' || 'light';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (themeValue: 'light' | 'dark') => {
    if (themeValue === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const toggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('alhmail_theme', newTheme);
    applyTheme(newTheme);
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
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'var(--border-color, #e5e7eb)';
        e.currentTarget.style.color = 'var(--text-main, #374151)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover, #f3f4f6)';
        e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
      }}
      title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
    >
      <i className={`fas fa-${theme === 'light' ? 'moon' : 'sun'}`}></i>
    </button>
  );
};

export default ThemeToggle;
