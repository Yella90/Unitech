// lib/dona/processor-tfidf.ts
import { supabase } from '@/lib/supabase';

type KeywordConfig = {
  id: string;
  category: string;
  keywords: string[];
  priority: number;
  is_active: boolean;
};

type AnalysisResult = {
  category: 'support' | 'commercial' | 'project' | 'newsletter' | 'information' | 'spam' | 'other';
  priority: 'high' | 'medium' | 'low';
  assigned_agent: string;
  confidence: number;
  matched_keywords: string[];
  summary: string;
  score: number;
  matched_category: string;
  similarity: number;
};

type EmailData = {
  from: string;
  to: string;
  subject: string;
  body: string;
};

type ContactData = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
};

// ✅ Catégories avec exemples enrichis
const CATEGORY_EXAMPLES = {
  commercial: [
    'prix devis acheter tarif facture paiement',
    'combien coute votre solution',
    'je veux acheter votre produit',
    'envoyez moi un devis',
    'quels sont vos tarifs',
    'je suis intéressé par vos services',
    'achat commande abonnement souscription',
    'offre promotion reduction',
    'cout investissement budget',
    'produit domotique boutique scolaire',
  ],
  project: [
    'projet developpement prestation sur mesure',
    'je souhaite développer une application',
    'j ai un projet de site web',
    'solution de gestion logiciel',
    'prestation service réalisation',
    'saas application mobile',
    'automatisation plateforme',
    'integration systeme',
    'creation site internet',
  ],
  support: [
    'probleme bug erreur panne incident',
    'je n arrive pas à me connecter',
    'une erreur apparaît sur le site',
    'j ai besoin d aide',
    'comment résoudre ce bug',
    'assistance support technique',
    'difficulte bloqué plante',
    'fonctionne pas marche pas',
    'incident urgent',
  ],
  newsletter: [
    'newsletter inscription abonnement',
    'inscrire à la newsletter',
    'désabonner de la newsletter',
    'recevoir les actualités',
    'se desinscrire unsubscribe',
    'infolettre actualite information',
    'rejoindre quitter',
  ],
  information: [
    'information renseignement question',
    'j ai une simple question',
    'comment fonctionne votre solution',
    'en savoir plus',
    'details precisions expliquer',
    'connaitre savoir',
  ],
  spam: [
    'gagnant prix offre exceptionnelle',
    'gagnez 1000 maintenant',
    'offre exceptionnelle viagra',
    'cliquez ici pour gagner',
    'phishing lottery',
    'million gratuit argent facile',
  ],
};

export class DonaTFIDF {
  private categoryVectors: Record<string, Record<string, number>> = {};
  private vocabulary: Set<string> = new Set();
  private keywordConfigs: KeywordConfig[] = [];
  private isInitialized = false;

  // ✅ Initialiser les vecteurs TF-IDF et la config
  async init() {
    if (this.isInitialized) return;
    
    console.log('📊 DONA TF-IDF: Initialisation...');

    // 1. Charger la configuration des mots-clés
    const { data, error } = await supabase
      .from('keyword_config')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Erreur chargement config:', error);
    } else {
      this.keywordConfigs = data || [];
      console.log(`📋 ${this.keywordConfigs.length} catégories chargées`);
    }

    // 2. Construire les vecteurs TF-IDF
    this.buildVectors();
    this.isInitialized = true;
    console.log('✅ DONA TF-IDF initialisé');
  }

  private buildVectors() {
    // 1. Construire le vocabulaire
    for (const examples of Object.values(CATEGORY_EXAMPLES)) {
      for (const text of examples) {
        const words = text.split(' ');
        for (const word of words) {
          if (word.length > 2) {
            this.vocabulary.add(word);
          }
        }
      }
    }

    const vocabArray = Array.from(this.vocabulary);
    console.log(`📚 Vocabulaire: ${vocabArray.length} mots`);

    // 2. Calculer TF-IDF pour chaque catégorie
    for (const [category, examples] of Object.entries(CATEGORY_EXAMPLES)) {
      const vector: Record<string, number> = {};

      // TF par catégorie
      const categoryTF: Record<string, number> = {};
      for (const text of examples) {
        const words = text.split(' ');
        for (const word of words) {
          if (word.length > 2) {
            categoryTF[word] = (categoryTF[word] || 0) + 1;
          }
        }
      }

      // IDF pour chaque mot
      const idf: Record<string, number> = {};
      for (const word of vocabArray) {
        let count = 0;
        for (const examples2 of Object.values(CATEGORY_EXAMPLES)) {
          for (const text of examples2) {
            if (text.includes(word)) {
              count++;
              break;
            }
          }
        }
        idf[word] = Math.log(Object.keys(CATEGORY_EXAMPLES).length / (count + 1));
      }

      // Calculer le vecteur
      for (const word of vocabArray) {
        const tf = (categoryTF[word] || 0) / examples.length;
        vector[word] = tf * (idf[word] || 0);
      }

      this.categoryVectors[category] = vector;
    }

    console.log(`✅ ${Object.keys(this.categoryVectors).length} catégories vectorisées`);
  }

  // ✅ Calculer la similarité cosinus
  private cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
    const keys = Object.keys(vecA);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const key of keys) {
      const valA = vecA[key] || 0;
      const valB = vecB[key] || 0;
      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // ✅ Analyser un texte
  async analyze(input: {
    from?: string;
    subject?: string;
    body: string;
    source: 'email' | 'contact';
  }): Promise<AnalysisResult> {
    // Initialiser si besoin
    if (!this.isInitialized) {
      await this.init();
    }

    const text = `${input.subject || ''} ${input.body}`.toLowerCase();

    // 1. Nettoyer le texte
    const cleanText = text
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = cleanText.split(' ').filter(w => w.length > 2);

    if (words.length === 0) {
      return this.getDefaultResult('Texte vide', 'information', 0);
    }

    // 2. Créer le vecteur du texte
    const textVector: Record<string, number> = {};
    for (const word of words) {
      textVector[word] = (textVector[word] || 0) + 1;
    }

    // 3. Normaliser
    for (const key of Object.keys(textVector)) {
      textVector[key] = textVector[key] / words.length;
    }

    // 4. Comparer avec les catégories
    let bestCategory = 'information';
    let bestScore = 0;
    let bestSimilarity = 0;

    for (const [category, vector] of Object.entries(this.categoryVectors)) {
      const similarity = this.cosineSimilarity(textVector, vector);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCategory = category;
      }
    }

    // 5. Vérifier avec les mots-clés (pour renforcer)
    let keywordScore = 0;
    let matchedKeywords: string[] = [];

    for (const config of this.keywordConfigs) {
      if (config.category === bestCategory) {
        for (const keyword of config.keywords) {
          if (text.includes(keyword.toLowerCase())) {
            matchedKeywords.push(keyword);
            keywordScore++;
          }
        }
      }
    }

    // 6. Calculer le score final
    const confidence = Math.min(Math.round((bestSimilarity * 100) + (keywordScore * 5)), 100);

    console.log(`📊 Catégorie: ${bestCategory} (similarité: ${(bestSimilarity * 100).toFixed(1)}%, mots-clés: ${matchedKeywords.length})`);

    // 7. Seuil minimum
    if (bestSimilarity < 0.05 && keywordScore < 2) {
      return {
        category: 'other',
        priority: 'medium',
        assigned_agent: 'HUMAN',
        confidence: Math.round(bestSimilarity * 100),
        matched_keywords: matchedKeywords,
        summary: `Score trop bas (${Math.round(bestSimilarity * 100)}%), classé en "autre"`,
        score: bestSimilarity,
        matched_category: bestCategory,
        similarity: bestSimilarity,
      };
    }

    return {
      category: bestCategory as any,
      priority: this.getPriority(bestCategory),
      assigned_agent: this.getAgent(bestCategory),
      confidence: confidence,
      matched_keywords: matchedKeywords,
      summary: `Catégorie "${bestCategory}" (confiance: ${confidence}%)`,
      score: bestSimilarity,
      matched_category: bestCategory,
      similarity: bestSimilarity,
    };
  }

  private getDefaultResult(reason: string, category: string = 'information', score: number = 0): AnalysisResult {
    return {
      category: category as any,
      priority: 'medium',
      assigned_agent: 'HUMAN',
      confidence: 10,
      matched_keywords: [],
      summary: reason,
      score: score,
      matched_category: category,
      similarity: 0,
    };
  }

  private getPriority(category: string): 'high' | 'medium' | 'low' {
    const map: Record<string, 'high' | 'medium' | 'low'> = {
      support: 'high',
      commercial: 'high',
      project: 'high',
      newsletter: 'medium',
      information: 'medium',
      spam: 'low',
      other: 'medium',
    };
    return map[category] || 'medium';
  }

  private getAgent(category: string): string {
    const map: Record<string, string> = {
      support: 'SUPPORT',
      commercial: 'COMMERCIAL',
      project: 'PROJET',
      newsletter: 'NEWSLETTER',
      information: 'HUMAN',
      spam: 'NONE',
      other: 'HUMAN',
    };
    return map[category];
  }

  // ✅ Traiter un email entrant
  async processEmail(emailData: EmailData) {
    console.log(`📧 DONA TF-IDF analyse un email de ${emailData.from}`);

    const analysis = await this.analyze({
      from: emailData.from,
      subject: emailData.subject,
      body: emailData.body,
      source: 'email',
    });

    console.log(`📊 Catégorie: ${analysis.category} (confiance: ${analysis.confidence}%)`);

    if (analysis.category === 'spam') {
      console.log(`🚫 Email ignoré (spam)`);
      return { action: 'ignored', reason: 'spam' };
    }

    if (analysis.category === 'newsletter') {
      await this.handleNewsletter(emailData);
      return { action: 'newsletter', analysis };
    }

    const { data, error } = await supabase
      .from('incoming_emails')
      .insert({
        from_email: emailData.from,
        to_email: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        received_at: new Date().toISOString(),
        category: analysis.category,
        priority: analysis.priority,
        assigned_agent: analysis.assigned_agent,
        status: 'pending',
        ai_analysis: analysis,
        is_relevant: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion:', error);
      return { action: 'error', error };
    }

    console.log(`✅ Email ${data.id} stocké et assigné à ${analysis.assigned_agent}`);

    return { action: 'stored', email_id: data.id, analysis };
  }

  // ✅ Traiter un contact
  async processContact(contactData: ContactData) {
    console.log(`📧 DONA TF-IDF analyse un contact de ${contactData.name}`);

    const analysis = await this.analyze({
      from: contactData.email,
      subject: contactData.subject,
      body: contactData.message,
      source: 'contact',
    });

    console.log(`📊 Catégorie: ${analysis.category} (confiance: ${analysis.confidence}%)`);

    const updateData: any = {
      status: 'read',
      category: analysis.category,
      assigned_agent: analysis.assigned_agent,
      priority: analysis.priority,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactData.id);

    if (error) {
      console.error('❌ Erreur mise à jour contact:', error);
      return { action: 'error', error };
    }

    console.log(`✅ Contact ${contactData.id} classé: ${analysis.category} (confiance: ${analysis.confidence}%)`);

    return { action: 'updated', analysis };
  }

  private async handleNewsletter(emailData: EmailData) {
    try {
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', emailData.from)
        .single();

      if (existing) {
        console.log(`📬 ${emailData.from} déjà abonné`);
        return;
      }

      await supabase
        .from('newsletter_subscribers')
        .insert({
          email: emailData.from,
          interests: ['general'],
          source: 'email',
          is_active: true,
        });

      console.log(`📬 ${emailData.from} ajouté à la newsletter`);
    } catch (error) {
      console.error('❌ Erreur newsletter:', error);
    }
  }
}

export const dona = new DonaTFIDF();