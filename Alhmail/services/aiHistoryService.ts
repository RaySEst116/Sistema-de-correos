export interface AIGeneratedEmail {
  id: string;
  prompt: string;
  to: string | null;
  subject: string;
  body: string;
  senderName: string;
  timestamp: number;
  used: boolean;
  category?: string;
  tags?: string[];
}

class AIHistoryService {
  private readonly STORAGE_KEY = 'alhmail_ai_history';
  private readonly MAX_HISTORY_ITEMS = 50;

  constructor() {
    this.cleanupOldHistory();
  }

  // Guardar correo generado en el historial
  saveGeneratedEmail(email: Omit<AIGeneratedEmail, 'id' | 'timestamp' | 'used'>): AIGeneratedEmail {
    const generatedEmail: AIGeneratedEmail = {
      ...email,
      id: `ai_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      used: false
    };

    try {
      const history = this.getHistory();
      history.unshift(generatedEmail); // Agregar al principio
      
      // Mantener solo los últimos MAX_HISTORY_ITEMS
      const trimmedHistory = history.slice(0, this.MAX_HISTORY_ITEMS);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
      
      return generatedEmail;
    } catch (error) {
      console.error('❌ Error guardando en historial de IA:', error);
      throw error;
    }
  }

  // Obtener todo el historial
  getHistory(): AIGeneratedEmail[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error obteniendo historial de IA:', error);
      return [];
    }
  }

  // Obtener historial filtrado
  getFilteredHistory(filters: {
    category?: string;
    tags?: string[];
    dateRange?: { start: number; end: number };
    search?: string;
  } = {}): AIGeneratedEmail[] {
    let history = this.getHistory();

    // Filtrar por categoría
    if (filters.category) {
      history = history.filter(item => item.category === filters.category);
    }

    // Filtrar por tags
    if (filters.tags && filters.tags.length > 0) {
      history = history.filter(item => 
        item.tags && filters.tags!.some(tag => item.tags!.includes(tag))
      );
    }

    // Filtrar por rango de fechas
    if (filters.dateRange) {
      history = history.filter(item => 
        item.timestamp >= filters.dateRange!.start && 
        item.timestamp <= filters.dateRange!.end
      );
    }

    // Filtrar por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      history = history.filter(item => 
        item.prompt.toLowerCase().includes(searchLower) ||
        item.subject.toLowerCase().includes(searchLower) ||
        item.body.toLowerCase().includes(searchLower) ||
        (item.to && item.to.toLowerCase().includes(searchLower))
      );
    }

    return history;
  }

  // Obtener correo por ID
  getEmailById(id: string): AIGeneratedEmail | null {
    const history = this.getHistory();
    return history.find(item => item.id === id) || null;
  }

  // Marcar correo como usado
  markAsUsed(id: string): void {
    try {
      const history = this.getHistory();
      const emailIndex = history.findIndex(item => item.id === id);
      
      if (emailIndex >= 0) {
        history[emailIndex].used = true;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      }
    } catch (error) {
      console.error('❌ Error marcando correo como usado:', error);
    }
  }

  // Eliminar correo del historial
  deleteEmail(id: string): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter(item => item.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('❌ Error eliminando correo del historial:', error);
    }
  }

  // Obtener categorías disponibles
  getCategories(): string[] {
    const history = this.getHistory();
    const categories = new Set<string>();
    
    history.forEach(item => {
      if (item.category) {
        categories.add(item.category);
      }
    });
    
    return Array.from(categories).sort();
  }

  // Obtener tags disponibles
  getTags(): string[] {
    const history = this.getHistory();
    const tags = new Set<string>();
    
    history.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => tags.add(tag));
      }
    });
    
    return Array.from(tags).sort();
  }

  // Obtener estadísticas
  getStats(): {
    totalGenerated: number;
    totalUsed: number;
    averagePromptLength: number;
    mostUsedCategories: { category: string; count: number }[];
    recentActivity: { date: string; count: number }[];
  } {
    const history = this.getHistory();
    
    const totalGenerated = history.length;
    const totalUsed = history.filter(item => item.used).length;
    
    const averagePromptLength = history.length > 0 
      ? history.reduce((sum, item) => sum + item.prompt.length, 0) / history.length 
      : 0;

    // Categorías más usadas
    const categoryCounts: { [key: string]: number } = {};
    history.forEach(item => {
      if (item.category) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
    });
    const mostUsedCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Actividad reciente (últimos 7 días)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentEmails = history.filter(item => item.timestamp >= sevenDaysAgo);
    
    const activityByDate: { [key: string]: number } = {};
    recentEmails.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });
    
    const recentActivity = Object.entries(activityByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalGenerated,
      totalUsed,
      averagePromptLength: Math.round(averagePromptLength),
      mostUsedCategories,
      recentActivity
    };
  }

  // Categorizar automáticamente basado en el contenido
  categorizeEmail(prompt: string, subject: string, body: string): string {
    const text = `${prompt} ${subject} ${body}`.toLowerCase();
    
    // Patrones de categorización
    const categories = [
      { name: 'Reunión', keywords: ['reunión', 'meeting', 'cita', 'agenda', 'calendar', 'schedule'] },
      { name: 'Soporte', keywords: ['soporte', 'support', 'ayuda', 'help', 'problema', 'issue', 'error'] },
      { name: 'Ventas', keywords: ['venta', 'sales', 'cotización', 'quote', 'precio', 'price', 'compra'] },
      { name: 'Recursos Humanos', keywords: ['rrhh', 'hr', 'vacaciones', 'permiso', 'contrato', 'empleo'] },
      { name: 'Finanzas', keywords: ['factura', 'invoice', 'pago', 'payment', 'cobro', 'presupuesto'] },
      { name: 'Marketing', keywords: ['marketing', 'promoción', 'campaña', 'publicidad', 'newsletter'] },
      { name: 'Información', keywords: ['información', 'information', 'consulta', 'query', 'duda'] },
      { name: 'Seguimiento', keywords: ['seguimiento', 'follow-up', 'recordatorio', 'reminder', 'estado'] }
    ];

    for (const category of categories) {
      const matchCount = category.keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = text.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);

      if (matchCount > 0) {
        return category.name;
      }
    }

    return 'General';
  }

  // Extraer tags automáticamente
  extractTags(prompt: string, subject: string, body: string): string[] {
    const text = `${prompt} ${subject} ${body}`.toLowerCase();
    const tags: string[] = [];

    // Patrones comunes para extraer tags
    const tagPatterns = [
      { pattern: /\b(urgente|importante|inmediato)\b/gi, tag: 'Prioridad Alta' },
      { pattern: /\b(reunión|meeting|cita)\b/gi, tag: 'Reunión' },
      { pattern: /\b(informe|reporte|report)\b/gi, tag: 'Reporte' },
      { pattern: /\b(adjunto|attachment|adjunto)\b/gi, tag: 'Con Adjunto' },
      { pattern: /\b(gracias|thank|agradec)\b/gi, tag: 'Agradecimiento' },
      { pattern: /\b(disculpa|sorry|perdón)\b/gi, tag: 'Disculpa' },
      { pattern: /\b(felicitación|congratulation|feliz)\b/gi, tag: 'Felicitación' }
    ];

    tagPatterns.forEach(({ pattern, tag }) => {
      if (pattern.test(text)) {
        tags.push(tag);
      }
    });

    // Eliminar duplicados
    return [...new Set(tags)];
  }

  // Limpiar historial antiguo (más de 30 días)
  private cleanupOldHistory(): void {
    try {
      const history = this.getHistory();
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const filtered = history.filter(item => item.timestamp > thirtyDaysAgo);
      
      if (filtered.length !== history.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('❌ Error en limpieza de historial de IA:', error);
    }
  }

  // Exportar historial
  exportHistory(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }

  // Importar historial
  importHistory(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const data = JSON.parse(jsonData);
      
      if (!Array.isArray(data)) {
        errors.push('El formato de datos no es válido');
        return { success: false, imported: 0, errors };
      }

      const currentHistory = this.getHistory();
      
      data.forEach((item: any) => {
        try {
          // Validar estructura del item
          if (!item.prompt || !item.subject || !item.body) {
            errors.push(`Item inválido: falta información requerida`);
            return;
          }

          // Verificar si ya existe
          const exists = currentHistory.some(h => 
            h.prompt === item.prompt && 
            h.subject === item.subject && 
            h.timestamp === item.timestamp
          );

          if (!exists) {
            const emailItem: AIGeneratedEmail = {
              id: item.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              prompt: item.prompt,
              to: item.to || null,
              subject: item.subject,
              body: item.body,
              senderName: item.senderName || 'Importado',
              timestamp: item.timestamp || Date.now(),
              used: item.used || false,
              category: item.category,
              tags: item.tags
            };

            currentHistory.push(emailItem);
            imported++;
          }
        } catch (error) {
          errors.push(`Error procesando item: ${error}`);
        }
      });

      // Guardar historial actualizado
      const trimmedHistory = currentHistory.slice(0, this.MAX_HISTORY_ITEMS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));

      return { 
        success: errors.length === 0, 
        imported, 
        errors 
      };
    } catch (error) {
      errors.push(`Error parsing JSON: ${error}`);
      return { success: false, imported: 0, errors };
    }
  }
}

// Exportar singleton
export const aiHistoryService = new AIHistoryService();
