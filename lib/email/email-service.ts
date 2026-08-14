// lib/email/email-service.ts
import { supabase } from '@/lib/supabase';
import { getEmailTemplate, getCategoryContent, getCategoryHeader } from './templates/EmailTemplates';
import { EmailTemplateData } from './templates/types';

export class EmailService {
  
  // ============================================================
  // RÉCUPÉRER LES IMAGES D'UN PROJET DEPUIS SUPABASE
  // ============================================================
  static async getProjectImages(projectId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('gallery')
        .eq('id', projectId)
        .single();

      if (error || !data) {
        console.warn('⚠️ Aucune image trouvée pour le projet:', projectId);
        return [];
      }

      return data.gallery || [];
    } catch (error) {
      console.error('❌ Erreur récupération images:', error);
      return [];
    }
  }

  // ============================================================
  // RÉCUPÉRER LE LOGO DE L'ENTREPRISE
  // ============================================================
  static async getCompanyLogo(companyId: string): Promise<string | undefined> {
    try {
      const { data, error } = await supabase
        .from('company_data')
        .select('logo_url')
        .eq('id', companyId)
        .single();

      if (error || !data) {
        return undefined;
      }

      return data.logo_url;
    } catch (error) {
      return undefined;
    }
  }

  // ============================================================
  // GÉNÉRER UN EMAIL PROFESSIONNEL
  // ============================================================
  static async generateEmail(data: {
    category: string;
    companyName: string;
    companyId?: string;
    userName: string;
    userEmail: string;
    subject: string;
    message: string;
    projectId?: string;
    projectSlug?: string;
    projectName?: string;
    projectDescription?: string;
    projectProgress?: number;
    projectStatus?: string;
    signature?: string;
    links?: {
      website: string;
      contact: string;
      projects: string;
    };
  }): Promise<string> {
    
    // Récupérer les images du projet
    let projectImages: string[] = [];
    if (data.projectId) {
      projectImages = await this.getProjectImages(data.projectId);
    }

    // Récupérer le logo de l'entreprise
    let logoUrl: string | undefined;
    if (data.companyId) {
      logoUrl = await this.getCompanyLogo(data.companyId);
    }

    // Préparer les données du template
    const templateData: EmailTemplateData = {
      company_name: data.companyName,
      user_name: data.userName,
      user_email: data.userEmail,
      subject: data.subject,
      message: data.message,
      category: data.category,
      signature: data.signature || `L'équipe ${data.companyName}`,
      logo_url: logoUrl,
      project_images: projectImages,
      project_name: data.projectName,
      project_slug: data.projectSlug,
      project_description: data.projectDescription,
      project_progress: data.projectProgress,
      project_status: data.projectStatus,
      links: data.links || {
        website: 'https://unitech-qvgo.onrender.com',
        contact: 'https://unitech-qvgo.onrender.com/contact',
        projects: 'https://unitech-qvgo.onrender.com/projects',
      },
    };

    // Générer le HTML complet
    return getEmailTemplate(data.category, templateData);
  }

  // ============================================================
  // GÉNÉRER UN EMAIL À PARTIR D'UNE CONVERSATION
  // ============================================================
  static async generateEmailFromConversation(
    conversation: any,
    companyData: any,
    projectData?: any
  ): Promise<string> {
    const category = conversation.category || 'information';
    
    // Récupérer les images du projet si disponible
    let projectImages: string[] = [];
    if (projectData?.id) {
      projectImages = await this.getProjectImages(projectData.id);
    }

    // Récupérer le logo
    let logoUrl: string | undefined;
    if (companyData?.id) {
      logoUrl = await this.getCompanyLogo(companyData.id);
    }

    const templateData: EmailTemplateData = {
      company_name: companyData?.name || 'UNITECH',
      user_name: conversation.from_email?.split('@')[0] || 'Client',
      user_email: conversation.from_email || '',
      subject: conversation.subject || 'Réponse à votre demande',
      message: conversation.body || '',
      category: category,
      signature: `L'équipe ${companyData?.name || 'UNITECH'}`,
      logo_url: logoUrl,
      project_images: projectImages,
      project_name: projectData?.name,
      project_slug: projectData?.slug,
      project_description: projectData?.description,
      project_progress: projectData?.progress,
      project_status: projectData?.status,
      links: {
        website: 'https://unitech-qvgo.onrender.com',
        contact: 'https://unitech-qvgo.onrender.com/contact',
        projects: 'https://unitech-qvgo.onrender.com/projects',
      },
    };

    return getEmailTemplate(category, templateData);
  }
}