// lib/dona/processor.ts
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

export class Dona {
  private keywordConfigs: KeywordConfig[] = [];
  private stopWords: string[] = ['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or', 'pour', 'par', 'avec', 'sans', 'chez', 'de', 'du', 'au', 'aux', 'en', 'dans', 'sur', 'sous', 'entre', 'vers', 'depuis', 'pendant', 'pour', 'sans', 'ne', 'pas', 'plus', 'moins', 'très', 'trop', 'assez', 'peu', 'beaucoup', 'votre', 'mon', 'ton', 'son', 'notre', 'vos', 'mes', 'tes', 'ses', 'nos', 'à', 'dans', 'par', 'pour', 'avec', 'sur', 'sous', 'entre', 'vers', 'depuis'];

  async loadConfig() {
    const { data, error } = await supabase
      .from('keyword_config')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('❌ Erreur chargement config:', error);
      return;
    }

    this.keywordConfigs = data || [];
    console.log(`📋 ${this.keywordConfigs.length} catégories chargées`);
  }

  async analyze(input: {
    from?: string;
    subject?: string;
    body: string;
    source: 'email' | 'contact';
  }): Promise<AnalysisResult> {
    if (this.keywordConfigs.length === 0) {
      await this.loadConfig();
    }

    // 1. Nettoyer et normaliser le texte
    const text = this.normalizeText(`${input.subject || ''} ${input.body}`);
    const words = this.extractWords(text);
    
    console.log(`🔍 Analyse de ${words.length} mots`);

    const results: (AnalysisResult & { score: number })[] = [];

    // 2. Analyser chaque catégorie
    for (const config of this.keywordConfigs) {
      const analysis = this.analyzeCategory(words, config);
      if (analysis) {
        results.push(analysis);
      }
    }

    // 3. Si aucun résultat
    if (results.length === 0) {
      return this.getDefaultResult('Aucun mot-clé spécifique détecté');
    }

    // 4. Trier par score (le plus haut d'abord)
    results.sort((a, b) => b.score - a.score);

    // 5. Prendre le meilleur résultat
    const best = results[0];

    // 6. Vérifier le spam (priorité haute)
    const spamConfig = this.keywordConfigs.find(c => c.category === 'spam');
    if (spamConfig) {
      const spamScore = this.calculateCategoryScore(words, spamConfig.keywords);
      if (spamScore > 0.3) {
        return {
          category: 'spam',
          priority: 'low',
          assigned_agent: 'NONE',
          confidence: Math.round(spamScore * 100),
          matched_keywords: this.getMatchedKeywords(words, spamConfig.keywords),
          summary: 'Email identifié comme spam',
          score: spamScore,
        };
      }
    }

    // 7. Retourner le meilleur résultat
    return {
      ...best,
      confidence: Math.min(Math.round(best.score * 100), 100),
    };
  }

  private analyzeCategory(words: string[], config: KeywordConfig): (AnalysisResult & { score: number }) | null {
    const score = this.calculateCategoryScore(words, config.keywords);
    
    // Seuil minimum pour considérer la catégorie
    if (score < 0.05) return null;

    // Niveau de priorité
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (config.priority === 0) priority = 'low';
    else if (config.priority === 1) priority = 'medium';
    else priority = 'high';

    return {
      category: config.category as any,
      priority,
      assigned_agent: this.getAgentForCategory(config.category),
      confidence: Math.round(score * 100),
      matched_keywords: this.getMatchedKeywords(words, config.keywords),
      summary: `Analyse par DONA: ${this.getMatchedKeywords(words, config.keywords).length} mots-clés trouvés (score: ${Math.round(score * 100)}%)`,
      score,
    };
  }

  private calculateCategoryScore(words: string[], keywords: string[]): number {
    let matches = 0;
    let totalWeight = 0;

    // Compter les correspondances
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      let found = false;

      for (const word of words) {
        // 1. Correspondance exacte
        if (word === keywordLower) {
          found = true;
          matches++;
          break;
        }
        // 2. Correspondance partielle (le mot contient le mot-clé)
        if (word.includes(keywordLower) && keywordLower.length > 3) {
          found = true;
          matches += 0.5;
          break;
        }
        // 3. Correspondance par racine (4 premières lettres)
        if (keywordLower.length >= 4) {
          const wordRoot = word.slice(0, 4);
          const keywordRoot = keywordLower.slice(0, 4);
          if (wordRoot === keywordRoot) {
            found = true;
            matches += 0.3;
            break;
          }
        }
        // 4. Distance de Levenshtein (similarité)
        if (keywordLower.length >= 3 && word.length >= 3) {
          const distance = this.levenshteinDistance(word, keywordLower);
          const maxLen = Math.max(word.length, keywordLower.length);
          const similarity = 1 - (distance / maxLen);
          if (similarity > 0.7) {
            found = true;
            matches += similarity * 0.3;
            break;
          }
        }
      }

      totalWeight += 1;
    }

    // Score normalisé entre 0 et 1
    const score = totalWeight > 0 ? matches / totalWeight : 0;
    return Math.min(score, 1);
  }

  private getMatchedKeywords(words: string[], keywords: string[]): string[] {
    const matched: string[] = [];

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      for (const word of words) {
        if (word === keywordLower || word.includes(keywordLower) && keywordLower.length > 3) {
          if (!matched.includes(keyword)) {
            matched.push(keyword);
          }
          break;
        }
      }
    }

    return matched.slice(0, 10);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s]/g, ' ')    // Garder seulement lettres, chiffres et espaces
      .replace(/\s+/g, ' ')            // Supprimer les espaces multiples
      .trim();
  }

  private extractWords(text: string): string[] {
    const words = text.split(' ');
    
    // Filtrer les mots vides
    return words
      .filter(word => word.length > 0 && !this.stopWords.includes(word))
      .map(word => word.trim());
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i-1] === a[j-1]) {
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i-1][j-1] + 1,
            matrix[i][j-1] + 1,
            matrix[i-1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  private getAgentForCategory(category: string): string {
    const agentMap: Record<string, string> = {
      support: 'SUPPORT',
      commercial: 'COMMERCIAL',
      project: 'PROJET',
      newsletter: 'NEWSLETTER',
      information: 'HUMAN',
      spam: 'NONE',
      other: 'HUMAN',
    };
    return agentMap[category] || 'HUMAN';
  }

  private getDefaultResult(reason: string): AnalysisResult {
    return {
      category: 'information',
      priority: 'medium',
      assigned_agent: 'HUMAN',
      confidence: 10,
      matched_keywords: [],
      summary: reason,
      score: 0,
    };
  }

  // ✅ Traiter un email entrant
  async processEmail(emailData: EmailData) {
    console.log(`📧 DONA analyse un email de ${emailData.from}`);

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
    console.log(`📧 DONA analyse un contact de ${contactData.name}`);

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

export const dona = new Dona();