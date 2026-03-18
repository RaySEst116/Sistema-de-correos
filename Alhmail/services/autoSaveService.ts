interface AutoSaveDraft {
  id: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  timestamp: number;
  isGenerating?: boolean;
  generationPrompt?: string;
}

class AutoSaveService {
  private saveInterval: NodeJS.Timeout | null = null;
  private currentDraftId: string | null = null;
  private readonly SAVE_INTERVAL = 30000; // 30 segundos
  private readonly STORAGE_KEY = 'alhmail_autosave_drafts';

  constructor() {
    this.cleanupOldDrafts();
  }

  // Iniciar autoguardado para un borrador específico
  startAutoSave(draftId: string, getDraftData: () => AutoSaveDraft) {
    this.currentDraftId = draftId;
    
    // Guardar inmediatamente
    this.saveDraft(getDraftData());

    // Configurar intervalo de guardado
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }

    this.saveInterval = setInterval(() => {
      const draftData = getDraftData();
      if (this.hasContentChanged(draftData)) {
        this.saveDraft(draftData);
      }
    }, this.SAVE_INTERVAL);
  }

  // Detener autoguardado
  stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    this.currentDraftId = null;
  }

  // Guardar borrador en localStorage
  private saveDraft(draft: AutoSaveDraft) {
    try {
      const drafts = this.getAllDrafts();
      
      // Actualizar o agregar el borrador actual
      const existingIndex = drafts.findIndex(d => d.id === draft.id);
      if (existingIndex >= 0) {
        drafts[existingIndex] = { ...draft, timestamp: Date.now() };
      } else {
        drafts.push({ ...draft, timestamp: Date.now() });
      }

      // Mantener solo los últimos 10 borradores
      const sortedDrafts = drafts
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sortedDrafts));
    } catch (error) {
      console.error('❌ Error guardando borrador:', error);
    }
  }

  // Obtener todos los borradores guardados
  getAllDrafts(): AutoSaveDraft[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error obteniendo borradores:', error);
      return [];
    }
  }

  // Obtener un borrador específico
  getDraft(id: string): AutoSaveDraft | null {
    const drafts = this.getAllDrafts();
    return drafts.find(d => d.id === id) || null;
  }

  // Eliminar un borrador
  deleteDraft(id: string) {
    try {
      const drafts = this.getAllDrafts();
      const filtered = drafts.filter(d => d.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('❌ Error eliminando borrador:', error);
    }
  }

  // Verificar si el contenido ha cambiado significativamente
  private hasContentChanged(newDraft: AutoSaveDraft): boolean {
    const existingDraft = this.getDraft(newDraft.id);
    if (!existingDraft) return true;

    return (
      existingDraft.subject !== newDraft.subject ||
      existingDraft.body !== newDraft.body ||
      JSON.stringify(existingDraft.to) !== JSON.stringify(newDraft.to) ||
      JSON.stringify(existingDraft.cc) !== JSON.stringify(newDraft.cc) ||
      JSON.stringify(existingDraft.bcc) !== JSON.stringify(newDraft.bcc)
    );
  }

  // Limpiar borradores antiguos (más de 7 días)
  private cleanupOldDrafts() {
    try {
      const drafts = this.getAllDrafts();
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      const filtered = drafts.filter(d => d.timestamp > sevenDaysAgo);
      
      if (filtered.length !== drafts.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('❌ Error en limpieza de borradores:', error);
    }
  }

  // Obtener borradores que están en proceso de generación
  getGeneratingDrafts(): AutoSaveDraft[] {
    return this.getAllDrafts().filter(d => d.isGenerating);
  }

  // Marcar un borrador como en proceso de generación
  markAsGenerating(id: string, prompt: string) {
    const draft = this.getDraft(id);
    if (draft) {
      draft.isGenerating = true;
      draft.generationPrompt = prompt;
      this.saveDraft(draft);
    }
  }

  // Marcar un borrador como generación completada
  markGenerationCompleted(id: string) {
    const draft = this.getDraft(id);
    if (draft) {
      draft.isGenerating = false;
      delete draft.generationPrompt;
      this.saveDraft(draft);
    }
  }
}

// Exportar singleton
export const autoSaveService = new AutoSaveService();
