// lib/ai/email-agent.ts
import { supabase } from '@/lib/supabase';

export interface EmailAnalysis {
  category: 'newsletter' | 'support' | 'contact' | 'information' | 'other';
  sentiment: 'positive' | 'negative' | 'neutral';
  priority: 'high' | 'medium' | 'low';
  suggestedResponse: string;
  confidence: number;
  needsHumanReview: boolean;
  relatedData?: any;
}

type ResponseMap = {
  [key: string]: {
    positive: string;
    negative: string;
    neutral: string;
  };
};

export class EmailAgent {
  async analyzeEmail(emailId: string): Promise<EmailAnalysis> {
    try {
      const { data: email, error } = await supabase
        .from('emails')
        .select('*')
        .eq('id', emailId)
        .single();

      if (error || !email) {
        throw new Error('Email non trouvé');
      }

      const analysis = await this.performAnalysis(email);

      await supabase
        .from('emails')
        .update({
          category: analysis.category,
          ai_analyzed: true,
          ai_response: analysis.suggestedResponse,
          ai_confidence: analysis.confidence,
          status: analysis.needsHumanReview ? 'pending' : 'analyzed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', emailId);

      return analysis;
    } catch (error) {
      console.error('❌ Erreur analyse:', error);
      throw error;
    }
  }

  private async performAnalysis(email: any): Promise<EmailAnalysis> {
    const content = `${email.subject} ${email.body}`.toLowerCase();

    let category: 'newsletter' | 'support' | 'contact' | 'information' | 'other' = 'other';
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let needsHumanReview = false;
    let confidence = 70;

    const keywords = {
      support: ['aide', 'problème', 'bug', 'erreur', 'assistance', 'support', 'help', 'issue', 'problem'],
      newsletter: ['newsletter', 'inscription', 'désinscription', 'abonnement', 'unsubscribe'],
      contact: ['contact', 'demande', 'renseignement', 'information', 'info', 'question'],
    };

    for (const [cat, words] of Object.entries(keywords)) {
      if (words.some(word => content.includes(word))) {
        category = cat as any;
        break;
      }
    }

    const positiveWords = ['merci', 'bravo', 'excellent', 'super', 'content', 'satisfait', 'good', 'great', 'thanks'];
    const negativeWords = ['problème', 'bug', 'erreur', 'mécontent', 'déçu', 'dommage', 'bad', 'issue', 'problem'];

    const positiveCount = positiveWords.filter(w => content.includes(w)).length;
    const negativeCount = negativeWords.filter(w => content.includes(w)).length;

    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    else sentiment = 'neutral';

    const urgentWords = ['urgent', 'urgence', 'rapide', 'immédiat', 'now', 'immediate', 'asap'];
    if (urgentWords.some(w => content.includes(w))) {
      priority = 'high';
      confidence = 85;
    }

    if (sentiment === 'negative' || priority === 'high') {
      needsHumanReview = true;
    }

    const suggestedResponse = this.generateSuggestedResponse(email, { category, sentiment, priority });

    let relatedData = null;
    if (category === 'support') {
      relatedData = await this.getRelatedData(email);
    }

    return {
      category,
      sentiment,
      priority,
      suggestedResponse,
      confidence,
      needsHumanReview,
      relatedData,
    };
  }

  private generateSuggestedResponse(email: any, analysis: any): string {
    const responses: ResponseMap = {
      newsletter: {
        positive: 'Merci pour votre intérêt pour notre newsletter ! Vous êtes bien inscrit(e).',
        neutral: 'Nous avons bien reçu votre demande concernant la newsletter.',
        negative: 'Nous sommes désolés d\'apprendre que vous souhaitez vous désinscrire. Pouvez-vous nous dire pourquoi ?',
      },
      support: {
        positive: 'Merci pour votre retour positif ! Nous sommes ravis de vous aider.',
        neutral: 'Nous avons bien reçu votre demande de support. Notre équipe va l\'étudier.',
        negative: 'Nous sommes désolés pour ce désagrément. Notre équipe va analyser le problème.',
      },
      contact: {
        positive: 'Merci de nous contacter ! Nous revenons vers vous rapidement.',
        neutral: 'Nous avons bien reçu votre message.',
        negative: 'Nous sommes désolés pour ce désagrément. Nous allons vous aider.',
      },
      other: {
        positive: 'Merci pour votre message. Nous le traiterons dans les plus brefs délais.',
        neutral: 'Nous avons bien reçu votre message.',
        negative: 'Nous sommes désolés. Nous allons étudier votre demande.',
      },
    };

    const categoryKey = analysis.category as keyof ResponseMap;
    const categoryResponses = responses[categoryKey] || responses.other;
    const sentimentKey = analysis.sentiment as 'positive' | 'negative' | 'neutral';
    return categoryResponses[sentimentKey] || categoryResponses.neutral;
  }

  private async getRelatedData(email: any): Promise<any> {
    try {
      const content = `${email.subject} ${email.body}`.toLowerCase();
      
      const { data: projects } = await supabase
        .from('projects')
        .select('name, slug, description')
        .limit(3);

      return { projects };
    } catch (error) {
      console.error('Erreur récupération données:', error);
      return null;
    }
  }

  async autoProcess(emailId: string): Promise<boolean> {
    const analysis = await this.analyzeEmail(emailId);

    if (!analysis.needsHumanReview && analysis.confidence > 80) {
      await this.sendAutoResponse(emailId, analysis.suggestedResponse);
      return true;
    }

    return false;
  }

  private async sendAutoResponse(emailId: string, response: string) {
    const { data: email } = await supabase
      .from('emails')
      .select('from_email')
      .eq('id', emailId)
      .single();

    if (!email) return;

    const { sendEmail } = await import('@/lib/email/sendgrid');
    await sendEmail({
      to: email.from_email,
      subject: 'Réponse automatique UNITECH',
      text: response,
      category: 'auto-response',
    });

    await supabase
      .from('emails')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', emailId);
  }
}