import { autoSaveService } from './autoSaveService';
import { Email } from '../types';

export interface AutoSaveDraft {
  id: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  timestamp: number;
  isGenerating?: boolean;
  generationStatus?: string;
}

export interface DraftEmail extends Omit<Email, 'id'> {
  id: string; // ID temporal del autoguardado
  isAutoSave: boolean;
  lastModified: number;
}

class DraftService {
  // Convertir un borrador de autoguardado a formato Email
  convertAutoSaveToEmail(autoSaveDraft: AutoSaveDraft): DraftEmail {
    return {
      id: autoSaveDraft.id,
      folder: 'drafts',
      unread: false,
      sender: 'Yo',
      email: 'draft@local',
      subject: autoSaveDraft.subject || 'Sin asunto',
      preview: autoSaveDraft.body ? autoSaveDraft.body.substring(0, 100) + '...' : '',
      body: autoSaveDraft.body || '',
      date: new Date(autoSaveDraft.timestamp).toISOString(),
      hasAttachments: false,
      to: autoSaveDraft.to.join(', '),
      cc: autoSaveDraft.cc.length > 0 ? autoSaveDraft.cc.join(', ') : undefined,
      bcc: autoSaveDraft.bcc.length > 0 ? autoSaveDraft.bcc.join(', ') : undefined,
      attachments: [],
      isAutoSave: true,
      lastModified: autoSaveDraft.timestamp
    };
  }

  // Obtener todos los borradores (autoguardados + de base de datos)
  async getAllDrafts(userEmail: string): Promise<DraftEmail[]> {
    try {
      // 1. Obtener borradores autoguardados
      const autoSaveDrafts = autoSaveService.getAllDrafts();
      const localDrafts = autoSaveDrafts.map(draft => this.convertAutoSaveToEmail(draft));

      // 2. Obtener borradores de la base de datos
      const response = await fetch(`http://localhost:3001/emails?userEmail=${userEmail}`);
      const allEmails = await response.json();
      const dbDrafts = allEmails.filter((email: Email) => email.folder === 'drafts');

      // 3. Combinar y ordenar por fecha de modificación
      const allDrafts = [...localDrafts, ...dbDrafts];
      
      // Ordenar por última modificación (más reciente primero)
      return allDrafts.sort((a, b) => {
        const dateA = a.isAutoSave ? a.lastModified : new Date(a.date).getTime();
        const dateB = b.isAutoSave ? b.lastModified : new Date(b.date).getTime();
        return dateB - dateA;
      });

    } catch (error) {
      console.error('Error obteniendo borradores:', error);
      return [];
    }
  }

  // Eliminar un borrador
  async deleteDraft(draftId: string, isAutoSave: boolean): Promise<boolean> {
    try {
      if (isAutoSave) {
        // Eliminar borrador autoguardado
        autoSaveService.deleteDraft(draftId);
        return true;
      } else {
        // Eliminar borrador de la base de datos
        const response = await fetch(`http://localhost:3001/emails/${draftId}`, {
          method: 'DELETE'
        });
        return response.ok;
      }
    } catch (error) {
      console.error('Error eliminando borrador:', error);
      return false;
    }
  }

  // Convertir un borrador autoguardado a un borrador permanente en la base de datos
  async saveDraftToDatabase(autoSaveDraft: AutoSaveDraft, userEmail: string): Promise<Email | null> {
    try {
      const draftData = {
        owner_email: userEmail,
        folder: 'drafts',
        sender: userEmail,
        email: userEmail,
        subject: autoSaveDraft.subject || 'Sin asunto',
        preview: autoSaveDraft.body ? autoSaveDraft.body.substring(0, 100) + '...' : '',
        body: autoSaveDraft.body || '',
        date: new Date(autoSaveDraft.timestamp).toISOString(),
        unread: false,
        hasAttachments: false,
        to: autoSaveDraft.to.join(', '),
        cc: autoSaveDraft.cc.length > 0 ? autoSaveDraft.cc.join(', ') : null,
        bcc: autoSaveDraft.bcc.length > 0 ? autoSaveDraft.bcc.join(', ') : null,
        attachments: JSON.stringify([])
      };

      const response = await fetch('http://localhost:3001/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(draftData)
      });

      if (response.ok) {
        // Eliminar el borrador autoguardado después de guardarlo en la BD
        autoSaveService.deleteDraft(autoSaveDraft.id);
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('Error guardando borrador en base de datos:', error);
      return null;
    }
  }

  // Obtener un borrador específico
  async getDraft(draftId: string, isAutoSave: boolean): Promise<DraftEmail | null> {
    try {
      if (isAutoSave) {
        const autoSaveDraft = autoSaveService.getDraft(draftId);
        if (autoSaveDraft) {
          return this.convertAutoSaveToEmail(autoSaveDraft);
        }
      } else {
        const response = await fetch(`http://localhost:3001/emails/${draftId}`);
        if (response.ok) {
          const email = await response.json();
          if (email.folder === 'drafts') {
            return {
              ...email,
              isAutoSave: false,
              lastModified: new Date(email.date).getTime()
            };
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo borrador:', error);
      return null;
    }
  }

  // Limpiar borradores autoguardados antiguos
  cleanupOldAutoSaveDrafts(): void {
    // La limpieza se hace automáticamente en el servicio de autoguardado
  }

  // Verificar si un borrador necesita ser guardado permanentemente
  shouldSaveToDatabase(autoSaveDraft: AutoSaveDraft): boolean {
    // Considerar guardar si tiene contenido significativo
    const hasContent = autoSaveDraft.subject.length > 0 || autoSaveDraft.body.length > 50;
    const isOld = Date.now() - autoSaveDraft.timestamp > 5 * 60 * 1000; // 5 minutos
    
    return hasContent && isOld;
  }

  // Procesar borradores autoguardados para guardar los importantes en la BD
  async processAutoSaveDrafts(userEmail: string): Promise<void> {
    try {
      const drafts = autoSaveService.getAllDrafts();
      
      for (const draft of drafts) {
        if (this.shouldSaveToDatabase(draft)) {
          await this.saveDraftToDatabase(draft, userEmail);
        }
      }
    } catch (error) {
      console.error('Error procesando borradores autoguardados:', error);
    }
  }
}

// Exportar singleton
export const draftService = new DraftService();
