import React, { useState, useEffect, useRef } from 'react';
import { Suggestion } from '../services/suggestionService';

interface SuggestionPopupProps {
  suggestions: Suggestion[];
  position: { x: number; y: number };
  onSelect: (suggestion: Suggestion) => void;
  onClose: () => void;
  currentText: string;
}

const SuggestionPopup: React.FC<SuggestionPopupProps> = ({
  suggestions,
  position,
  onSelect,
  onClose,
  currentText
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [suggestions, selectedIndex, onSelect, onClose]);

  if (suggestions.length === 0) return null;

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'subject':
        return '📝';
      case 'body':
        return '📄';
      case 'completion':
        return '✨';
      default:
        return '💡';
    }
  };

  const getSuggestionText = (suggestion: Suggestion) => {
    // Mostrar vista previa de cómo se vería la sugerencia aplicada
    const preview = suggestion.text.length > 50 
      ? suggestion.text.substring(0, 50) + '...' 
      : suggestion.text;
    return preview;
  };

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        zIndex: 1000,
        minWidth: '250px',
        maxWidth: '350px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}
    >
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #f3f4f6',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '#6b7280',
        backgroundColor: '#f9fafb'
      }}>
        💡 Sugerencias inteligentes
      </div>
      
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.id}
          onClick={() => onSelect(suggestion)}
          style={{
            padding: '10px 12px',
            cursor: 'pointer',
            backgroundColor: index === selectedIndex ? '#f3f4f6' : 'white',
            borderBottom: index < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span style={{ fontSize: '0.9rem' }}>
            {getSuggestionIcon(suggestion.type)}
          </span>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.85rem',
              color: '#374151',
              fontWeight: '500',
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {getSuggestionText(suggestion)}
            </div>
            
            <div style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>
                {suggestion.type === 'subject' && 'Asunto'}
                {suggestion.type === 'body' && 'Cuerpo'}
                {suggestion.type === 'completion' && 'Completar'}
              </span>
              <span>•</span>
              <span>{Math.round(suggestion.confidence * 100)}% confianza</span>
            </div>
          </div>
          
          <div style={{
            fontSize: '0.75rem',
            color: '#d1d5db',
            padding: '2px 6px',
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            border: '1px solid #e5e7eb'
          }}>
            {index === selectedIndex ? '↵' : 'Tab'}
          </div>
        </div>
      ))}
      
      <div style={{
        padding: '6px 12px',
        fontSize: '0.7rem',
        color: '#9ca3af',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #f3f4f6',
        textAlign: 'center'
      }}>
        Usa ↑↓ para navegar • Enter para aceptar • Esc para cerrar
      </div>
    </div>
  );
};

export default SuggestionPopup;
