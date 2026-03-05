export interface EditRequest {
  type: 'improve' | 'make_formal' | 'make_informal' | 'shorten' | 'expand' | 'fix_grammar' | 'change_tone';
  content: string;
  context?: string;
  targetAudience?: string;
  customInstruction?: string;
}

export interface EditResult {
  originalContent: string;
  editedContent: string;
  type: string;
  improvements: string[];
  confidence: number;
  explanation?: string;
}

class AIEditService {
  private readonly API_URL = 'http://localhost:3001/ai/edit';

  constructor() {}

  // Mejorar el contenido existente
  async improveContent(request: EditRequest): Promise<EditResult> {
    try {
      console.log('🔧 Enviando petición de edición a IA:', request.type);

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error en la edición de IA');
      }

      console.log('✅ Edición completada:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error en improveContent:', error);
      throw error;
    }
  }

  // Obtener sugerencias de edición basadas en el contenido
  getEditSuggestions(content: string): Array<{
    type: EditRequest['type'];
    label: string;
    description: string;
    icon: string;
    priority: number;
  }> {
    const suggestions = [];
    const lowerContent = content.toLowerCase();

    // Analizar el contenido y sugerir mejoras
    if (lowerContent.length < 50) {
      suggestions.push({
        type: 'expand',
        label: 'Expandir',
        description: 'Añadir más detalles y contexto',
        icon: '📝',
        priority: 3
      });
    }

    if (lowerContent.length > 500) {
      suggestions.push({
        type: 'shorten',
        label: 'Resumir',
        description: 'Hacer el contenido más conciso',
        icon: '✂️',
        priority: 2
      });
    }

    // Detectar lenguaje informal
    const informalWords = ['hola', 'qué tal', 'ok', 'gracias', 'por favor', 'disculpa'];
    const hasInformalLanguage = informalWords.some(word => lowerContent.includes(word));
    
    if (hasInformalLanguage) {
      suggestions.push({
        type: 'make_formal',
        label: 'Hacer Formal',
        description: 'Convertir a lenguaje profesional',
        icon: '👔',
        priority: 4
      });
    }

    // Detectar lenguaje muy formal
    const formalWords = ['estimado', 'atentamente', 'saludos cordiales', 'les informo'];
    const hasFormalLanguage = formalWords.some(word => lowerContent.includes(word));
    
    if (hasFormalLanguage) {
      suggestions.push({
        type: 'make_informal',
        label: 'Hacer Informal',
        description: 'Hacer el tono más relajado',
        icon: '😊',
        priority: 1
      });
    }

    // Sugerir mejora general
    suggestions.push({
      type: 'improve',
      label: 'Mejorar',
      description: 'Optimizar claridad y estilo',
      icon: '✨',
      priority: 5
    });

    // Sugerir corrección gramatical
    if (this.hasGrammarIssues(content)) {
      suggestions.push({
        type: 'fix_grammar',
        label: 'Corregir Gramática',
        description: 'Fix errores gramaticales y ortográficos',
        icon: '📖',
        priority: 6
      });
    }

    // Ordenar por prioridad
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  // Detectar problemas gramaticales básicos
  private hasGrammarIssues(content: string): boolean {
    const issues = [
      /\b([a-z])\.([a-z])\b/g, // Minúsculas después de punto
      /\s{2,}/g, // Múltiples espacios
      /[,.!?]{2,}/g, // Múltiples signos de puntuación
      /\b(que|pero|y|o|a|de|en|con|por|para)\s{2,}/gi // Preposiciones con espacios extra
    ];

    return issues.some(issue => issue.test(content));
  }

  // Previsualizar cambios
  previewEdit(content: string, type: EditRequest['type']): string {
    switch (type) {
      case 'make_formal':
        return this.previewFormal(content);
      case 'make_informal':
        return this.previewInformal(content);
      case 'shorten':
        return this.previewShorten(content);
      case 'expand':
        return this.previewExpand(content);
      default:
        return content;
    }
  }

  // Previsualizar conversión a formal
  private previewFormal(content: string): string {
    const replacements = [
      { from: /\bhola\b/gi, to: 'Estimado/a' },
      { from: /\bqué tal\b/gi, to: '¿Cómo se encuentra?' },
      { from: /\bok\b/gi, to: 'De acuerdo' },
      { from: /\bgracias\b/gi, to: 'Agradezco' },
      { from: /\bpor favor\b/gi, to: 'Por favor' },
      { from: /\bdisculpa\b/gi, to: 'Disculpe' }
    ];

    let result = content;
    replacements.forEach(({ from, to }) => {
      result = result.replace(from, to);
    });

    return result;
  }

  // Previsualizar conversión a informal
  private previewInformal(content: string): string {
    const replacements = [
      { from: /estimado\/a/gi, to: 'Hola' },
      { from: /¿cómo se encuentra\?/gi, to: '¿Qué tal?' },
      { from: /de acuerdo/gi, to: 'OK' },
      { from: /agradezco/gi, to: 'Gracias' },
      { from: /atentamente/gi, to: 'Saludos' }
    ];

    let result = content;
    replacements.forEach(({ from, to }) => {
      result = result.replace(from, to);
    });

    return result;
  }

  // Previsualizar acortamiento
  private previewShorten(content: string): string {
    const sentences = content.split(/[.!?]+/);
    const importantSentences = sentences.filter(sentence => {
      const words = sentence.trim().split(/\s+/);
      return words.length >= 5 && words.length <= 20;
    });

    return importantSentences.slice(0, 3).join('. ') + (importantSentences.length > 3 ? '...' : '');
  }

  // Previsualizar expansión
  private previewExpand(content: string): string {
    return content + '\n\nPara proporcionar más contexto, me gustaría añadir que esta comunicación busca establecer una base sólida para nuestra interacción futura.';
  }

  // Obtener tipos de edición disponibles
  getAvailableEditTypes(): Array<{
    type: EditRequest['type'];
    label: string;
    description: string;
    icon: string;
    example: string;
  }> {
    return [
      {
        type: 'improve',
        label: 'Mejorar',
        description: 'Optimizar claridad, estilo y estructura',
        icon: '✨',
        example: 'Hace el texto más claro y profesional'
      },
      {
        type: 'make_formal',
        label: 'Hacer Formal',
        description: 'Convertir a lenguaje corporativo',
        icon: '👔',
        example: '"Hola" → "Estimado/a"'
      },
      {
        type: 'make_informal',
        label: 'Hacer Informal',
        description: 'Hacer el tono más relajado',
        icon: '😊',
        example: '"Estimado/a" → "Hola"'
      },
      {
        type: 'shorten',
        label: 'Resumir',
        description: 'Reducir longitud manteniendo esencia',
        icon: '✂️',
        example: 'Reduce el texto al 50% manteniendo ideas clave'
      },
      {
        type: 'expand',
        label: 'Expandir',
        description: 'Añadir detalles y contexto',
        icon: '📝',
        example: 'Añade contexto y ejemplos'
      },
      {
        type: 'fix_grammar',
        label: 'Corregir Gramática',
        description: 'Fix errores gramaticales y ortográficos',
        icon: '📖',
        example: 'Corrige: "hola" → "Hola", "k" → "que"'
      },
      {
        type: 'change_tone',
        label: 'Cambiar Tono',
        description: 'Ajustar el tono según audiencia',
        icon: '🎭',
        example: 'Adapta el tono para diferentes contextos'
      }
    ];
  }

  // Generar prompt para edición
  private generateEditPrompt(request: EditRequest): string {
    const prompts = {
      improve: `Mejora el siguiente texto para que sea más claro, profesional y efectivo. Mantén el significado original pero optimiza la estructura y el estilo:\n\n"${request.content}"`,
      
      make_formal: `Convierte el siguiente texto a un lenguaje formal y corporativo apropiado para comunicación profesional:\n\n"${request.content}"`,
      
      make_informal: `Convierte el siguiente texto a un lenguaje más informal y relajado, manteniendo el respeto:\n\n"${request.content}"`,
      
      shorten: `Resume el siguiente texto, manteniendo las ideas principales y reduciendo su longitud aproximadamente al 50%:\n\n"${request.content}"`,
      
      expand: `Expande el siguiente texto añadiendo más detalles, contexto y ejemplos relevantes para hacerlo más completo:\n\n"${request.content}"`,
      
      fix_grammar: `Corrige la gramática, ortografía y puntuación del siguiente texto. Solo devuelve el texto corregido sin explicaciones:\n\n"${request.content}"`,
      
      change_tone: `Reescribe el siguiente texto ajustando el tono para ${request.targetAudience || 'una audiencia general'}. ${request.customInstruction || ''}\n\nTexto original:\n"${request.content}"`
    };

    return prompts[request.type] || prompts.improve;
  }

  // Editar contenido con IA local (fallback)
  async editContentLocally(request: EditRequest): Promise<EditResult> {
    const editedContent = this.previewEdit(request.content, request.type);
    
    return {
      originalContent: request.content,
      editedContent,
      type: request.type,
      improvements: [this.getImprovementDescription(request.type)],
      confidence: 0.8,
      explanation: this.getExplanation(request.type)
    };
  }

  private getImprovementDescription(type: EditRequest['type']): string {
    const descriptions = {
      improve: 'Mejorada la claridad y estructura',
      make_formal: 'Convertido a lenguaje formal',
      make_informal: 'Convertido a lenguaje informal',
      shorten: 'Resumido manteniendo ideas clave',
      expand: 'Expandido con más detalles',
      fix_grammar: 'Corregida gramática y ortografía',
      change_tone: 'Ajustado el tono solicitado'
    };

    return descriptions[type] || 'Contenido editado';
  }

  private getExplanation(type: EditRequest['type']): string {
    const explanations = {
      improve: 'Se ha optimizado la estructura del texto para mejorar la claridad y el impacto.',
      make_formal: 'Se ha adaptado el lenguaje a un contexto profesional y corporativo.',
      make_informal: 'Se ha suavizado el tono para hacerlo más cercano y accesible.',
      shorten: 'Se ha condensado el contenido manteniendo las ideas principales.',
      expand: 'Se ha enriquecido el texto con detalles adicionales y contexto.',
      fix_grammar: 'Se han corregido errores gramaticales y de puntuación.',
      change_tone: 'Se ha ajustado el tono según la audiencia especificada.'
    };

    return explanations[type] || 'El contenido ha sido editado exitosamente.';
  }
}

// Exportar singleton
export const aiEditService = new AIEditService();
