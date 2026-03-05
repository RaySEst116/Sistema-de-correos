import React, { useState, useEffect } from 'react';
import { aiHistoryService, AIGeneratedEmail } from '../services/aiHistoryService';

interface AIHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmail: (email: AIGeneratedEmail) => void;
  currentLang: 'es' | 'en';
}

const AIHistoryModal: React.FC<AIHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectEmail,
  currentLang
}) => {
  const [history, setHistory] = useState<AIGeneratedEmail[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<AIGeneratedEmail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'usage' | 'prompt'>('date');
  const [showStats, setShowStats] = useState(false);

  const translations = {
    es: {
      title: 'Historial de Correos IA',
      search: 'Buscar...',
      category: 'Categoría',
      all: 'Todas',
      sortBy: 'Ordenar por',
      date: 'Fecha',
      usage: 'Uso',
      prompt: 'Prompt',
      stats: 'Estadísticas',
      totalGenerated: 'Total Generados',
      totalUsed: 'Usados',
      avgPromptLength: 'Longitud Promedio',
      recentActivity: 'Actividad Reciente',
      noResults: 'No se encontraron resultados',
      useEmail: 'Usar Correo',
      deleteEmail: 'Eliminar',
      markAsUsed: 'Marcar como Usado',
      export: 'Exportar',
      import: 'Importar'
    },
    en: {
      title: 'AI Email History',
      search: 'Search...',
      category: 'Category',
      all: 'All',
      sortBy: 'Sort by',
      date: 'Date',
      usage: 'Usage',
      prompt: 'Prompt',
      stats: 'Statistics',
      totalGenerated: 'Total Generated',
      totalUsed: 'Used',
      avgPromptLength: 'Avg Prompt Length',
      recentActivity: 'Recent Activity',
      noResults: 'No results found',
      useEmail: 'Use Email',
      deleteEmail: 'Delete',
      markAsUsed: 'Mark as Used',
      export: 'Export',
      import: 'Import'
    }
  };

  const t = translations[currentLang];

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [history, searchTerm, selectedCategory, sortBy]);

  const loadHistory = () => {
    const emailHistory = aiHistoryService.getHistory();
    setHistory(emailHistory);
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Filtrar por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(email =>
        email.prompt.toLowerCase().includes(searchLower) ||
        email.subject.toLowerCase().includes(searchLower) ||
        email.body.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por categoría
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(email => email.category === selectedCategory);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.timestamp - a.timestamp;
        case 'usage':
          return (b.used ? 1 : 0) - (a.used ? 1 : 0);
        case 'prompt':
          return a.prompt.localeCompare(b.prompt);
        default:
          return b.timestamp - a.timestamp;
      }
    });

    setFilteredHistory(filtered);
  };

  const handleSelectEmail = (email: AIGeneratedEmail) => {
    onSelectEmail(email);
    aiHistoryService.markAsUsed(email.id);
    loadHistory(); // Recargar para actualizar el estado
  };

  const handleDeleteEmail = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('¿Estás seguro de que quieres eliminar este correo del historial?')) {
      aiHistoryService.deleteEmail(id);
      loadHistory();
    }
  };

  const handleMarkAsUsed = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    aiHistoryService.markAsUsed(id);
    loadHistory();
  };

  const handleExport = () => {
    const data = aiHistoryService.exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_history_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const result = aiHistoryService.importHistory(content);
          
          if (result.success) {
            alert(`Se importaron ${result.imported} correos exitosamente`);
            loadHistory();
          } else {
            alert(`Error: ${result.errors.join(', ')}`);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(currentLang === 'es' ? 'es-ES' : 'en-US');
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const categories = ['all', ...aiHistoryService.getCategories()];

  if (!isOpen) return null;

  const stats = aiHistoryService.getStats();

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
        maxWidth: '900px',
        maxHeight: '80vh',
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
            {t.title}
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowStats(!showStats)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {t.stats}
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {t.export}
            </button>
            <button
              onClick={handleImport}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {t.import}
            </button>
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
        </div>

        {/* Filtros */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px'
            }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px'
            }}
          >
            <option value="all">{t.all}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? t.all : cat}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px'
            }}
          >
            <option value="date">{t.date}</option>
            <option value="usage">{t.usage}</option>
            <option value="prompt">{t.prompt}</option>
          </select>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {showStats ? (
            <div>
              <h3>{t.stats}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    {stats.totalGenerated}
                  </div>
                  <div style={{ color: '#6b7280' }}>{t.totalGenerated}</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                    {stats.totalUsed}
                  </div>
                  <div style={{ color: '#6b7280' }}>{t.totalUsed}</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                    {stats.averagePromptLength}
                  </div>
                  <div style={{ color: '#6b7280' }}>{t.avgPromptLength}</div>
                </div>
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              {t.noResults}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredHistory.map((email) => (
                <div
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  style={{
                    padding: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: email.used ? '#f9fafb' : 'white',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = email.used ? '#f9fafb' : 'white';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' }}>
                        {email.subject}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '5px' }}>
                        {truncateText(email.prompt, 100)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {formatDate(email.timestamp)}
                        {email.category && ` • ${email.category}`}
                        {email.used && ' • ✅ Usado'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {!email.used && (
                        <button
                          onClick={(e) => handleMarkAsUsed(email.id, e)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                          title={t.markAsUsed}
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteEmail(email.id, e)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                        title={t.deleteEmail}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#4b5563',
                    maxHeight: '60px',
                    overflow: 'hidden',
                    lineHeight: '1.4'
                  }}>
                    {truncateText(email.body.replace(/<[^>]*>/g, ''), 150)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIHistoryModal;
