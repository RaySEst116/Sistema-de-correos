import React, { useState, useEffect, useRef } from 'react';
import { suggestionService, Suggestion } from '../services/suggestionService';
import SuggestionPopup from './SuggestionPopup';

declare global {
  interface Window {
    Quill: any;
  }
}

interface ComposeEditorProps {
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  onToChange: (to: string[]) => void;
  onCcChange: (cc: string[]) => void;
  onBccChange: (bcc: string[]) => void;
  onSubjectChange: (subject: string) => void;
  onBodyChange: (body: string) => void;
  contacts?: { name: string; email: string }[];
  currentLang?: 'es' | 'en';
}

const translations = {
  es: {
    from: 'De:',
    to: 'Para:',
    cc: 'Cc',
    bcc: 'Cco',
    subject: 'Asunto',
    drop_files: 'Suelta archivos aquí',
  },
  en: {
    from: 'From:',
    to: 'To:',
    cc: 'Cc',
    bcc: 'Bcc',
    subject: 'Subject',
    drop_files: 'Drop files here',
  },
};

const ComposeEditor: React.FC<ComposeEditorProps> = ({
  from,
  to,
  cc,
  bcc,
  subject,
  body,
  onToChange,
  onCcChange,
  onBccChange,
  onSubjectChange,
  onBodyChange,
  contacts = [],
  currentLang = 'es',
}) => {
  const t = translations[currentLang];
  const [showCc, setShowCc] = useState(cc.length > 0);
  const [showBcc, setShowBcc] = useState(bcc.length > 0);
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<{ name: string; email: string }[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionPosition, setSuggestionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSuggestionField, setCurrentSuggestionField] = useState<'subject' | 'body' | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeField, setActiveField] = useState<'to' | 'cc' | 'bcc' | null>(null);
  const [suggestionClicked, setSuggestionClicked] = useState(false);
  const quillRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);

  // Cargar Quill si no está disponible
  useEffect(() => {
    // Cargar CSS de Quill si no está cargado
    if (!document.querySelector('link[href*="quill.snow"]')) {
      const link = document.createElement('link');
      link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    if (!window.Quill && editorContainerRef.current) {
      const script = document.createElement('script');
      script.src = 'https://cdn.quilljs.com/1.3.6/quill.js';
      script.async = true;
      script.onload = () => {
        initQuill();
      };
      document.body.appendChild(script);
    } else if (window.Quill && !quillRef.current && editorContainerRef.current) {
      initQuill();
    }
  }, []);

  const initQuill = () => {
    if (!window.Quill || !editorContainerRef.current || quillRef.current) return;
    
    // Limpiar el contenedor
    editorContainerRef.current.innerHTML = '';
    
    const quill = new window.Quill(editorContainerRef.current, {
      theme: 'snow',
      placeholder: 'Escribe tu correo aquí...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'clean'],
        ],
      },
    });
    
    // Habilitar el editor
    quill.enable(true);
    
    // Evento de cambio de texto
    quill.on('text-change', () => {
      const content = quill.root.innerHTML;
      onBodyChange(content);
    });
    
    // Evento de selección para manejar el foco
    quill.on('selection-change', (range) => {
      if (range) {
        // El editor tiene foco
      }
    });
    
    quillRef.current = quill;
    
    // Establecer contenido inicial si existe
    if (body) {
      quill.clipboard.dangerouslyPasteHTML(body);
    } else {
      // Establecer contenido vacío para asegurar que sea editable
      quill.setText('');
    }
    
    // Dar foco al editor después de un pequeño retraso
    setTimeout(() => {
      quill.focus();
    }, 100);
    
  };

  // Actualizar Quill cuando body cambia externamente
  useEffect(() => {
    if (quillRef.current && body !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = body;
    }
  }, [body]);

  // Efecto para asegurar que Quill esté inicializado y funcional
  useEffect(() => {
    const checkAndInitQuill = () => {
      if (window.Quill && !quillRef.current && editorContainerRef.current) {
        initQuill();
      } else if (quillRef.current && !quillRef.current.isEnabled()) {
        quillRef.current.enable(true);
      }
    };

    // Intentar inicializar inmediatamente
    checkAndInitQuill();

    // Reintentar después de un pequeño retraso
    const timer = setTimeout(checkAndInitQuill, 500);

    return () => clearTimeout(timer);
  }, [window.Quill]);

  const addChip = (value: string, field: 'to' | 'cc' | 'bcc') => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const arr = field === 'to' ? to : field === 'cc' ? cc : bcc;
    if (!arr.includes(trimmed)) {
      if (field === 'to') onToChange([...to, trimmed]);
      else if (field === 'cc') onCcChange([...cc, trimmed]);
      else onBccChange([...bcc, trimmed]);
    }
    if (field === 'to') setToInput('');
    else if (field === 'cc') setCcInput('');
    else setBccInput('');
    setAutocompleteSuggestions([]);
    setShowAutocomplete(false);
  };

  const removeChip = (index: number, field: 'to' | 'cc' | 'bcc') => {
    if (field === 'to') onToChange(to.filter((_, i) => i !== index));
    else if (field === 'cc') onCcChange(cc.filter((_, i) => i !== index));
    else onBccChange(bcc.filter((_, i) => i !== index));
  };

  const handleInputChange = (value: string, field: 'to' | 'cc' | 'bcc') => {
    if (field === 'to') setToInput(value);
    else if (field === 'cc') setCcInput(value);
    else setBccInput(value);
    setActiveField(field);

    // Autocompletado
    if (value) {
      const matches = contacts.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(value.toLowerCase())) ||
          (c.email && c.email.toLowerCase().includes(value.toLowerCase()))
      );
      setAutocompleteSuggestions(matches);
      setShowAutocomplete(true);
    } else {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'to' | 'cc' | 'bcc') => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      const value = field === 'to' ? toInput : field === 'cc' ? ccInput : bccInput;
      addChip(value, field);
    }
  };

  const selectSuggestion = (suggestion: { name: string; email: string }) => {
    setSuggestionClicked(true);
    if (activeField) {
      addChip(suggestion.email, activeField);
      // Limpiar el input del campo activo
      if (activeField === 'to') setToInput('');
      else if (activeField === 'cc') setCcInput('');
      else if (activeField === 'bcc') setBccInput('');
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      setActiveField(null); // Resetear el campo activo
    } else {
      console.error('No active field when selecting suggestion');
    }
  };

  const handleSubjectChange = (value: string) => {
    onSubjectChange(value);
    
    // Obtener sugerencias para el asunto
    if (value.length >= 3) {
      suggestionService.getSuggestionsDebounced(value, 'subject', (suggestions) => {
        setSuggestions(suggestions);
        if (suggestions.length > 0 && subjectInputRef.current) {
          const rect = subjectInputRef.current.getBoundingClientRect();
          setSuggestionPosition({
            x: rect.left,
            y: rect.bottom + 5
          });
          setCurrentSuggestionField('subject');
          setShowSuggestions(true);
        }
      });
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    if (currentSuggestionField === 'subject') {
      const newSubject = suggestionService.applySuggestion(subject, suggestion);
      onSubjectChange(newSubject);
    } else if (currentSuggestionField === 'body' && quillRef.current) {
      const currentText = quillRef.current.getText();
      const newText = suggestionService.applySuggestion(currentText, suggestion);
      quillRef.current.setText(newText);
      onBodyChange(newText);
    }
    
    setShowSuggestions(false);
    setSuggestionClicked(true);
    setTimeout(() => setSuggestionClicked(false), 100);
  };

  const renderChips = (arr: string[], field: 'to' | 'cc' | 'bcc') => {
    return arr.map((email, index) => (
      <span
        key={index}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#e8f0fe',
          color: '#1f1f1f',
          padding: '4px 10px',
          borderRadius: '16px',
          fontSize: '0.9rem',
          margin: '2px',
          border: '1px solid #c7d7fa',
        }}
      >
        {email}
        <i
          className="fas fa-times"
          onClick={() => removeChip(index, field)}
          style={{
            marginLeft: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            color: '#666',
          }}
        />
      </span>
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', overflow: 'hidden', padding: '0' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #e5e7eb)', marginBottom: '2px', alignItems: 'center', position: 'relative' }}>
        <label style={{ color: 'var(--text-muted, #6b7280)', fontWeight: '600', fontSize: '0.9rem', marginLeft: '8px', minWidth: '35px' }}>
          {t.from}
        </label>
        <input
          type="text"
          value={from}
          disabled
          style={{
            flex: 1,
            border: 'none',
            padding: '8px 10px',
            outline: 'none',
            fontFamily: 'inherit',
            background: 'transparent',
            color: 'var(--text-main, #374151)',
            fontWeight: '600',
          }}
        />
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #e5e7eb)', marginBottom: '2px', alignItems: 'flex-start', padding: '5px 0', position: 'relative' }}>
        <label style={{ color: 'var(--text-muted, #6b7280)', fontWeight: '600', fontSize: '0.9rem', marginLeft: '8px', minWidth: '35px', marginTop: '8px' }}>
          {t.to}
        </label>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '5px',
            border: '1px solid transparent',
            padding: '2px',
            minHeight: '38px',
            position: 'relative',
          }}
          onClick={() => document.getElementById('to-input')?.focus()}
        >
          {renderChips(to, 'to')}
          <input
            id="to-input"
            type="text"
            value={toInput}
            onChange={(e) => handleInputChange(e.target.value, 'to')}
            onKeyDown={(e) => handleKeyDown(e, 'to')}
            onBlur={() => {
              setTimeout(() => {
                if (!suggestionClicked) {
                  if (toInput) addChip(toInput, 'to');
                  setShowAutocomplete(false);
                }
                setSuggestionClicked(false);
              }, 300);
            }}
            placeholder=""
            autoComplete="off"
            style={{
              border: 'none',
              outline: 'none',
              padding: '5px',
              flex: 1,
              minWidth: '100px',
              fontSize: '0.95rem',
              background: 'transparent',
              color: 'var(--text-main, #374151)',
            }}
          />
        </div>
        <div style={{ position: 'absolute', right: '10px', top: '5px' }}>
          {!showCc && (
            <span
              onClick={() => setShowCc(true)}
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted, #6b7280)',
                cursor: 'pointer',
                fontWeight: '600',
                padding: '5px',
              }}
            >
              {t.cc}
            </span>
          )}
          {!showBcc && (
            <span
              onClick={() => setShowBcc(true)}
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted, #6b7280)',
                cursor: 'pointer',
                fontWeight: '600',
                padding: '5px',
                marginLeft: '5px',
              }}
            >
              {t.bcc}
            </span>
          )}
        </div>
        {showAutocomplete && activeField === 'to' && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            style={{
              position: 'absolute',
              top: '100%',
              left: '50px',
              right: 0,
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e5e7eb)',
              zIndex: 3000,
              maxHeight: '200px',
              overflowY: 'auto',
              display: 'block',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              borderRadius: '0 0 6px 6px',
            }}
          >
            {autocompleteSuggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => selectSuggestion(s)}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color, #e5e7eb)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #f3f4f6)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <strong style={{ color: 'var(--text-main, #374151)', fontSize: '0.95rem' }}>{s.name}</strong>
                <small style={{ color: 'var(--text-muted, #6b7280)', fontSize: '0.85rem' }}>{s.email}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCc && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #e5e7eb)', marginBottom: '5px', alignItems: 'flex-start', padding: '5px 0', position: 'relative' }}>
          <label style={{ color: 'var(--text-muted, #6b7280)', fontWeight: '600', fontSize: '0.9rem', marginRight: '10px', minWidth: '35px', marginTop: '8px' }}>
            {t.cc}:
          </label>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '5px',
              border: '1px solid transparent',
              padding: '2px',
              minHeight: '38px',
              position: 'relative',
            }}
            onClick={() => document.getElementById('cc-input')?.focus()}
          >
            {renderChips(cc, 'cc')}
            <input
              id="cc-input"
              type="text"
              value={ccInput}
              onChange={(e) => handleInputChange(e.target.value, 'cc')}
              onKeyDown={(e) => handleKeyDown(e, 'cc')}
              onBlur={() => {
                setTimeout(() => {
                  if (!suggestionClicked) {
                    if (ccInput) addChip(ccInput, 'cc');
                    setShowAutocomplete(false);
                  }
                  setSuggestionClicked(false);
                }, 300);
              }}
              placeholder=""
              autoComplete="off"
              style={{
                border: 'none',
                outline: 'none',
                padding: '5px',
                flex: 1,
                minWidth: '100px',
                fontSize: '0.95rem',
                background: 'transparent',
                color: 'var(--text-main, #374151)',
              }}
            />
          </div>
          <button
            onClick={() => {
              setShowCc(false);
              onCcChange([]);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #6b7280)',
              cursor: 'pointer',
              padding: '8px',
              marginLeft: '5px',
              fontSize: '1rem',
            }}
          >
            <i className="fas fa-times"></i>
          </button>
          {showAutocomplete && activeField === 'cc' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              style={{
                position: 'absolute',
                top: '100%',
                left: '50px',
                right: 0,
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e5e7eb)',
                zIndex: 3000,
                maxHeight: '200px',
                overflowY: 'auto',
                display: 'block',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                borderRadius: '0 0 6px 6px',
              }}
            >
              {autocompleteSuggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color, #e5e7eb)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #f3f4f6)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <strong style={{ color: 'var(--text-main, #374151)', fontSize: '0.95rem' }}>{s.name}</strong>
                  <small style={{ color: 'var(--text-muted, #6b7280)', fontSize: '0.85rem' }}>{s.email}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showBcc && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #e5e7eb)', marginBottom: '5px', alignItems: 'flex-start', padding: '5px 0', position: 'relative' }}>
          <label style={{ color: 'var(--text-muted, #6b7280)', fontWeight: '600', fontSize: '0.9rem', marginRight: '10px', minWidth: '35px', marginTop: '8px' }}>
            {t.bcc}:
          </label>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '5px',
              border: '1px solid transparent',
              padding: '2px',
              minHeight: '38px',
              position: 'relative',
            }}
            onClick={() => document.getElementById('bcc-input')?.focus()}
          >
            {renderChips(bcc, 'bcc')}
            <input
              id="bcc-input"
              type="text"
              value={bccInput}
              onChange={(e) => handleInputChange(e.target.value, 'bcc')}
              onKeyDown={(e) => handleKeyDown(e, 'bcc')}
              onBlur={() => {
                setTimeout(() => {
                  if (!suggestionClicked) {
                    if (bccInput) addChip(bccInput, 'bcc');
                    setShowAutocomplete(false);
                  }
                  setSuggestionClicked(false);
                }, 300);
              }}
              placeholder=""
              autoComplete="off"
              style={{
                border: 'none',
                outline: 'none',
                padding: '5px',
                flex: 1,
                minWidth: '100px',
                fontSize: '0.95rem',
                background: 'transparent',
                color: 'var(--text-main, #374151)',
              }}
            />
          </div>
          <button
            onClick={() => {
              setShowBcc(false);
              onBccChange([]);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #6b7280)',
              cursor: 'pointer',
              padding: '8px',
              marginLeft: '5px',
              fontSize: '1rem',
            }}
          >
            <i className="fas fa-times"></i>
          </button>
          {showAutocomplete && activeField === 'bcc' && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              style={{
                position: 'absolute',
                top: '100%',
                left: '50px',
                right: 0,
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e5e7eb)',
                zIndex: 3000,
                maxHeight: '200px',
                overflowY: 'auto',
                display: 'block',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                borderRadius: '0 0 6px 6px',
              }}
            >
              {autocompleteSuggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color, #e5e7eb)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #f3f4f6)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <strong style={{ color: 'var(--text-main, #374151)', fontSize: '0.95rem' }}>{s.name}</strong>
                  <small style={{ color: 'var(--text-muted, #6b7280)', fontSize: '0.85rem' }}>{s.email}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #e5e7eb)', marginBottom: '2px', alignItems: 'center' }}>
        <input
          type="text"
          value={subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          placeholder={t.subject}
          ref={subjectInputRef}
          style={{
            flex: 1,
            border: 'none',
            padding: '12px 10px',
            outline: 'none',
            fontFamily: 'inherit',
            background: 'transparent',
            color: 'var(--text-main, #374151)',
            fontWeight: '600',
          }}
        />
      </div>

      <div style={{ flex: 1, minHeight: 150, maxHeight: 250, position: 'relative', overflowY: 'auto' }}>
        <div 
          ref={editorContainerRef} 
          style={{ 
            height: '100%', 
            border: 'none', 
            color: 'var(--text-main, #374151)',
            overflowY: 'auto',
            backgroundColor: 'transparent',
            borderRadius: '4px',
            cursor: 'text'
          }} 
        />
      </div>
    
    {/* Popup de sugerencias */}
    {showSuggestions && suggestionPosition && (
      <SuggestionPopup
        suggestions={suggestions}
        position={suggestionPosition}
        onSelect={handleSuggestionSelect}
        onClose={() => setShowSuggestions(false)}
        currentText={currentSuggestionField === 'subject' ? subject : body}
      />
    )}
  </div>
  );
};

export default ComposeEditor;
