// lib/agents/dona.ts
import { supabase } from '@/lib/supabase';

export class AgentDona {
  // ✅ Analyse rapide sans stockage
  async quickAnalyze(emailData: {
    from: string;
    subject: string;
    body: string;
  }): Promise<any> {
    const content = `${emailData.subject} ${emailData.body}`.toLowerCase();
    
    // 🔍 Détection spam
    const spamWords = ['spam', 'viagra', 'casino', 'porn', 'phishing', 'click here', '$$$'];
    if (spamWords.some(word => content.includes(word))) {
      return {
        category: 'spam',
        is_relevant: false,
        priority: 'low',
        assigned_agent: 'none',
      };
    }

    // 🔍 Détection newsletter
    if (content.includes('newsletter') || 
        content.includes('abonnement') || 
        content.includes('unsubscribe') ||
        content.includes('désinscription')) {
      return {
        category: 'newsletter',
        is_relevant: true,
        priority: 'medium',
        assigned_agent: 'NEWSLETTER-IA',
        interests: this.extractInterests(content),
      };
    }

    // 🔍 Détection catégorie
    let category = 'information';
    let assigned_agent = 'DONA';
    
    if (content.includes('support') || content.includes('aide') || content.includes('problème') || content.includes('bug')) {
      category = 'support';
      assigned_agent = 'SUPPORT-IA';
    } else if (content.includes('achat') || content.includes('prix') || content.includes('devis') || content.includes('commande')) {
      category = 'commercial';
      assigned_agent = 'COMMERCIAL-IA';
    } else if (content.includes('projet') || content.includes('développement') || content.includes('prestation')) {
      category = 'project';
      assigned_agent = 'PROJET-IA';
    }

    const priority = content.includes('urgent') ? 'high' : 'medium';

    return {
      category,
      is_relevant: true,
      priority,
      assigned_agent,
      summary: `Email de ${emailData.from}`,
    };
  }

  private extractInterests(content: string): string[] {
    const interests: string[] = [];
    const keywords = {
      scolaire: ['scolaire', 'école', 'élève', 'professeur', 'classe', 'éducation'],
      commerce: ['commerce', 'boutique', 'stock', 'vente', 'client', 'facturation'],
      domotique: ['domotique', 'énergie', 'solaire', 'capteur', 'automation', 'maison'],
      ia: ['ia', 'intelligence artificielle', 'machine learning', 'automation'],
      formation: ['formation', 'cours', 'apprentissage', 'module', 'certification'],
    };

    for (const [key, words] of Object.entries(keywords)) {
      if (words.some(word => content.includes(word))) {
        interests.push(key);
      }
    }

    return interests.length > 0 ? interests : ['general'];
  }
}