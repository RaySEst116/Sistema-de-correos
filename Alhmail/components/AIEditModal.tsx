import React, { useState, useEffect } from 'react';
import { aiEditService, EditRequest, EditResult } from '../services/aiEditService';

interface AIEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  contentType: 'subject' | 'body';
  onApplyEdit: (editedContent: string) => void;
  currentLang: 'es' | 'en';
}

const AIEditModal: React.FC<AIEditModalProps> = ({
  isOpen,
  onClose,
  content,
  contentType,
  onApplyEdit,
  currentLang
}) => {
  const [selectedType, setSelectedType] = useState<EditRequest['type']>('improve');
  const [customInstruction, setCustomInstruction] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editResult, setEditResult] = useState<EditResult | null>(null);
  const [preview, setPreview] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const translations = {
    es: {
      title: 'Editar con IA',
      selectEditType: 'Seleccionar tipo de edición',
      customInstruction: 'Instrucción personalizada (opcional)',
      targetAudience: 'Audiencia objetivo (opcional)',
      advanced: 'Opciones avanzadas',
      preview: 'Vista previa',
      original: 'Original',
      edited: 'Editado',
      improvements: 'Mejoras aplicadas',
      confidence: 'Confianza',
      apply: 'Aplicar',
      cancel: 'Cancelar',
      editing: 'Editando...',
      noChanges: 'No se detectaron cambios necesarios',
      subject: 'Asunto',
      body: 'Cuerpo del correo'
    },
    en: {
      title: 'Edit with AI',
      selectEditType: 'Select edit type',
      customInstruction: 'Custom instruction (optional)',
      targetAudience: 'Target audience (optional)',
      advanced: 'Advanced options',
      preview: 'Preview',
      original: 'Original',
      edited: 'Edited',
      improvements: 'Applied improvements',
      confidence: 'Confidence',
      apply: 'Apply',
      cancel: 'Cancel',
      editing: 'Editing...',
      noChanges: 'No necessary changes detected',
      subject: 'Subject',
      body: 'Email body'
    }
  };

  const t = translations[currentLang];

  useEffect(() => {
    if (isOpen) {
      // Obtener sugerencias basadas en el contenido
      const suggestions = aiEditService.getEditSuggestions(content);
      if (suggestions.length > 0) {
        setSelectedType(suggestions[0].type);
      }
      
      // Generar vista previa inicial
      updatePreview();
    }
  }, [isOpen, content, selectedType]);

  useEffect(() => {
    updatePreview();
  }, [selectedType, customInstruction, targetAudience]);

  const updatePreview = () => {
    const previewContent = aiEditService.previewEdit(content, selectedType);
    setPreview(previewContent);
  };

  const handleEdit = async () => {
    setIsEditing(true);
    setEditResult(null);

    try {
      const editRequest: EditRequest = {
        type: selectedType,
        content: content,
        customInstruction: customInstruction || undefined,
        targetAudience: targetAudience || undefined
      };

      const result = await aiEditService.improveContent(editRequest);
      setEditResult(result);
      setPreview(result.editedContent);
    } catch (error) {
      console.error('Error en edición:', error);
      // Usar edición local como fallback
      const fallbackResult = await aiEditService.editContentLocally({
        type: selectedType,
        content: content,
        customInstruction: customInstruction,
        targetAudience: targetAudience
      });
      setEditResult(fallbackResult);
      setPreview(fallbackResult.editedContent);
    } finally {
      setIsEditing(false);
    }
  };

  const handleApply = () => {
    const finalContent = editResult ? editResult.editedContent : preview;
    onApplyEdit(finalContent);
    onClose();
  };

  const editTypes = aiEditService.getAvailableEditTypes();
  const suggestions = aiEditService.getEditSuggestions(content);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem' }}>
            {t.title} - {contentType === 'subject' ? t.subject : t.body}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Sugerencias rápidas */}
          {suggestions.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '1.1rem' }}>
                💡 Sugerencias rápidas
              </h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.type}
                    onClick={() => setSelectedType(suggestion.type)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: selectedType === suggestion.type ? '#3b82f6' : '#f3f4f6',
                      color: selectedType === suggestion.type ? 'white' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{suggestion.icon}</span>
                    <span>{suggestion.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tipo de edición */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '1.1rem' }}>
              {t.selectEditType}
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {editTypes.map((type) => (
                <div
                  key={type.type}
                  onClick={() => setSelectedType(type.type)}
                  style={{
                    padding: '15px',
                    border: `2px solid ${selectedType === type.type ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedType === type.type ? '#f0f9ff' : 'white',
                    transition: 'all 0.2s ease'
                  }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{type.icon}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                          {type.label}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          {type.description}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>
                      Ej: {type.example}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Opciones avanzadas */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                marginBottom: '10px'
              }}
            >
              {showAdvanced ? '▼' : '▶'} {t.advanced}
            </button>

            {showAdvanced && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                    {t.customInstruction}
                  </label>
                  <textarea
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="Ej: Hazlo más amigable y añade un saludo cordial"
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' }}>
                    {t.targetAudience}
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Ej: Clientes, equipo interno, directivos"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vista previa */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '1.1rem' }}>
              {t.preview}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#6b7280' }}>
                  {t.original}
                </div>
                <div style={{
                  padding: '10px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  maxHeight: '150px',
                  overflow: 'auto'
                }}>
                  {content}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#6b7280' }}>
                  {t.edited}
                </div>
                <div style={{
                  padding: '10px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  maxHeight: '150px',
                  overflow: 'auto'
                }}>
                  {preview || (isEditing ? t.editing : '...')}
                </div>
              </div>
            </div>
          </div>

          {/* Resultado de la edición */}
          {editResult && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#166534' }}>
                {t.improvements}:
              </div>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#166534' }}>
                {editResult.improvements.map((improvement, index) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
              {editResult.explanation && (
                <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#166534' }}>
                  {editResult.explanation}
                </div>
              )}
              <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#166534' }}>
                {t.confidence}: {Math.round(editResult.confidence * 100)}%
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {t.cancel}
          </button>
          <button
            onClick={handleEdit}
            disabled={isEditing}
            style={{
              padding: '10px 20px',
              backgroundColor: isEditing ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isEditing ? 'not-allowed' : 'pointer'
            }}
          >
            {isEditing ? t.editing : 'Editar con IA'}
          </button>
          <button
            onClick={handleApply}
            disabled={!preview || preview === content}
            style={{
              padding: '10px 20px',
              backgroundColor: (!preview || preview === content) ? '#d1d5db' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (!preview || preview === content) ? 'not-allowed' : 'pointer'
            }}
          >
            {t.apply}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIEditModal;
