export interface Suggestion {
  id: string;
  type: 'subject' | 'body' | 'completion';
  text: string;
  confidence: number;
  context: string;
}

class SuggestionService {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_DELAY = 800; // ms
  private readonly MIN_CHARS_FOR_SUGGESTION = 3;

  constructor() {
    this.initializeCommonSuggestions();
  }

  // Inicializar sugerencias comunes basadas en patrones
  private initializeCommonSuggestions() {
    // Esto podría expandirse con más patrones
  }

  // Obtener sugerencias basadas en el texto actual
  async getSuggestions(text: string, type: 'subject' | 'body'): Promise<Suggestion[]> {
    if (text.length < this.MIN_CHARS_FOR_SUGGESTION) {
      return [];
    }

    const suggestions: Suggestion[] = [];

    // Sugerencias para asunto
    if (type === 'subject') {
      suggestions.push(...this.getSubjectSuggestions(text));
    }

    // Sugerencias para cuerpo
    if (type === 'body') {
      suggestions.push(...this.getBodySuggestions(text));
    }

    // Sugerencias de autocompletado
    suggestions.push(...this.getCompletionSuggestions(text));

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  // Sugerencias específicas para asuntos
  private getSubjectSuggestions(text: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const lowerText = text.toLowerCase();

    // Patrones comunes para asuntos
    const patterns = [
      {
        pattern: /(re:|fwd:|respuesta:|reenvío:)/i,
        suggestions: [
          { text: 'Re: ', confidence: 0.9 },
          { text: 'Fwd: ', confidence: 0.8 }
        ]
      },
      {
        pattern: /(urgente|importante|inmediato)/i,
        suggestions: [
          { text: '[URGENTE] ', confidence: 0.95 },
          { text: '[IMPORTANTE] ', confidence: 0.85 }
        ]
      },
      {
        pattern: /(reunión|cita|agenda|meeting)/i,
        suggestions: [
          { text: 'Confirmación de reunión: ', confidence: 0.8 },
          { text: 'Agenda para: ', confidence: 0.75 }
        ]
      },
      {
        pattern: /(informe|reporte|report)/i,
        suggestions: [
          { text: 'Informe: ', confidence: 0.8 },
          { text: 'Reporte mensual: ', confidence: 0.75 }
        ]
      }
    ];

    patterns.forEach(({ pattern, suggestions: patternSuggestions }) => {
      if (pattern.test(lowerText)) {
        patternSuggestions.forEach(({ text, confidence }) => {
          if (!text.toLowerCase().includes(lowerText)) {
            suggestions.push({
              id: `subject_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              type: 'subject',
              text,
              confidence,
              context: text
            });
          }
        });
      }
    });

    return suggestions;
  }

  // Sugerencias específicas para el cuerpo del correo
  private getBodySuggestions(text: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const lowerText = text.toLowerCase();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Sugerencias de cierre basadas en el contexto
    if (lowerText.includes('gracias') || lowerText.includes('thank')) {
      suggestions.push({
        id: `body_${Date.now()}_1`,
        type: 'body',
        text: '\n\nQuedo a su disposición para cualquier consulta.\n\nSaludos cordiales,',
        confidence: 0.85,
        context: text
      });
    }

    if (lowerText.includes('adjunto') || lowerText.includes('attach')) {
      suggestions.push({
        id: `body_${Date.now()}_2`,
        type: 'body',
        text: '\n\nAdjunto encontrará el documento solicitado. Si tiene alguna pregunta, no dude en contactarme.',
        confidence: 0.8,
        context: text
      });
    }

    // Sugerencias para completar frases incompletas
    const lastSentence = sentences[sentences.length - 1] || '';
    if (lastSentence.trim().length > 0 && !lastSentence.match(/[.!?]$/)) {
      suggestions.push(...this.getSentenceCompletions(lastSentence));
    }

    return suggestions;
  }

  // Completado de frases
  private getSentenceCompletions(sentence: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const lowerSentence = sentence.toLowerCase().trim();

    const completionPatterns = [
      {
        pattern: /^(espero|le escribo para|el motivo de este correo)/i,
        completions: [
          { text: ' comunicarle que...', confidence: 0.9 },
          { text: ' informarle sobre...', confidence: 0.85 },
          { text: ' solicitar su apoyo con...', confidence: 0.8 }
        ]
      },
      {
        pattern: /^(le agradecemos|agradecemos|gracias por)/i,
        completions: [
          { text: ' su atención y colaboración.', confidence: 0.95 },
          { text: ' el tiempo dedicado a este asunto.', confidence: 0.9 }
        ]
      },
      {
        pattern: /^(le confirmo|confirmo que|nos complace informar)/i,
        completions: [
          { text: ' que hemos recibido su solicitud.', confidence: 0.9 },
          { text: ' la fecha y hora acordadas.', confidence: 0.85 }
        ]
      }
    ];

    completionPatterns.forEach(({ pattern, completions }: { pattern: RegExp; completions: { text: string; confidence: number }[] }) => {
      if (pattern.test(lowerSentence)) {
        completions.forEach(({ text, confidence }: { text: string; confidence: number }) => {
          suggestions.push({
            id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'completion',
            text,
            confidence,
            context: sentence
          });
        });
      }
    });

    return suggestions;
  }

  // Sugerencias de autocompletado general
  private getCompletionSuggestions(text: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1] || '';

    if (lastWord.length >= 2) {
      // Frases comunes de negocios
      const commonPhrases = [
        { text: 'Estimado/a ', confidence: 0.7 },
        { text: 'Buenos días/tardes, ', confidence: 0.7 },
        { text: 'Por este medio, ', confidence: 0.6 },
        { text: 'Quedo a su disposición, ', confidence: 0.6 },
        { text: 'Agradeciendo de antemano, ', confidence: 0.6 },
        { text: 'Sin otro particular, ', confidence: 0.5 }
      ];

      commonPhrases.forEach(({ text, confidence }: { text: string; confidence: number }) => {
        if (text.toLowerCase().startsWith(lastWord.toLowerCase())) {
          suggestions.push({
            id: `phrase_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'completion',
            text,
            confidence,
            context: lastWord
          });
        }
      });
    }

    return suggestions;
  }

  // Obtener sugerencias con debounce
  getSuggestionsDebounced(text: string, type: 'subject' | 'body', callback: (suggestions: Suggestion[]) => void): void {
    const key = `${type}_${text}`;
    
    // Limpiar timer anterior
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    // Configurar nuevo timer
    const timer = setTimeout(async () => {
      const suggestions = await this.getSuggestions(text, type);
      callback(suggestions);
      this.debounceTimers.delete(key);
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(key, timer);
  }

  // Aplicar sugerencia
  applySuggestion(currentText: string, suggestion: Suggestion): string {
    switch (suggestion.type) {
      case 'subject':
        return suggestion.text + currentText;
      
      case 'body':
        return currentText + suggestion.text;
      
      case 'completion':
        // Para completado, reemplazar la última palabra
        const words = currentText.split(/\s+/);
        words.pop(); // Eliminar última palabra
        return words.join(' ') + ' ' + suggestion.text;
      
      default:
        return currentText;
    }
  }

  // Limpiar timers
  cleanup(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// Exportar singleton
export const suggestionService = new SuggestionService();
