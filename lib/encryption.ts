// lib/encryption.ts
import crypto from 'crypto';

/**
 * Clé de chiffrement utilisée pour AES-256-CBC
 * Doit être une chaîne hexadécimale de 64 caractères (32 bytes)
 * 
 * Pour générer une nouvelle clé: 
 * node -e "console.log(crypto.randomBytes(32).toString('hex'))"
 */
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Taille de l'IV (vecteur d'initialisation) en bytes
 * AES-256-CBC utilise 16 bytes
 */
const IV_LENGTH = 16;

/**
 * Algorithme de chiffrement utilisé
 */
const ALGORITHM = 'aes-256-cbc';

/**
 * Chiffre un mot de passe avec AES-256-CBC
 * 
 * @param password - Mot de passe en clair à chiffrer
 * @returns Chaîne chiffrée au format "iv:encrypted"
 * 
 * @example
 * const encrypted = encryptPassword('monMotDePasse');
 * // Résultat: "8f3a7c2e91d64b508a17c9e4f62b3d8a:cc878a57d30e8bc57e83fcc4d847ada5"
 */
export function encryptPassword(password: string): string {
  try {
    // Générer un IV aléatoire de 16 bytes
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Créer le chiffreur
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    // Chiffrer le mot de passe
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retourner IV + texte chiffré séparés par ':'
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ Erreur chiffrement:', error);
    throw new Error('Erreur lors du chiffrement du mot de passe');
  }
}

/**
 * Déchiffre un mot de passe chiffré avec AES-256-CBC
 * 
 * @param encryptedData - Chaîne chiffrée au format "iv:encrypted"
 * @returns Mot de passe en clair
 * 
 * @example
 * const decrypted = decryptPassword("8f3a7c2e91d64b508a17c9e4f62b3d8a:cc878a57d30e8bc57e83fcc4d847ada5");
 * // Résultat: "monMotDePasse"
 */
export function decryptPassword(encryptedData: string): string {
  try {
    // Vérifier le format
    if (!encryptedData || typeof encryptedData !== 'string') {
      console.error('❌ Données invalides');
      return '';
    }

    // Vérifier la présence du séparateur
    if (!encryptedData.includes(':')) {
      console.error('❌ Format invalide: séparateur ":" manquant');
      return '';
    }

    // Extraire l'IV et le texte chiffré
    const [ivHex, encryptedText] = encryptedData.split(':');
    
    if (!ivHex || !encryptedText) {
      console.error('❌ IV ou texte chiffré manquant');
      return '';
    }

    // Vérifier la longueur de l'IV (32 caractères hex = 16 bytes)
    if (ivHex.length !== IV_LENGTH * 2) {
      console.error(`❌ IV invalide: ${ivHex.length} caractères (attendu: ${IV_LENGTH * 2})`);
      return '';
    }

    // Vérifier que la clé est valide
    try {
      Buffer.from(ENCRYPTION_KEY, 'hex');
    } catch (error) {
      console.error('❌ Clé de chiffrement invalide');
      return '';
    }

    // Créer le déchiffreur
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    // Déchiffrer le texte
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    console.error('❌ Erreur déchiffrement:', error.message || error);
    return '';
  }
}

/**
 * Teste si le chiffrement/déchiffrement fonctionne correctement
 * 
 * @returns true si le test est réussi, false sinon
 */
export function testEncryption(): boolean {
  try {
    const testPassword = 'test123';
    console.log('🧪 Test de chiffrement/déchiffrement...');
    
    const encrypted = encryptPassword(testPassword);
    console.log(`📝 Chiffré: ${encrypted.substring(0, 20)}... (${encrypted.length} caractères)`);
    
    const decrypted = decryptPassword(encrypted);
    console.log(`📝 Déchiffré: ${decrypted}`);
    
    const success = decrypted === testPassword;
    console.log(`✅ Test ${success ? 'réussi' : 'échoué'}`);
    
    return success;
  } catch (error) {
    console.error('❌ Erreur test:', error);
    return false;
  }
}

/**
 * Génère une nouvelle clé de chiffrement
 * 
 * @returns Clé hexadécimale de 64 caractères (32 bytes)
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(32).toString('hex');
  console.log(`🔑 Nouvelle clé générée: ${key}`);
  return key;
}

/**
 * Vérifie si une chaîne est une clé valide
 * 
 * @param key - Clé à vérifier
 * @returns true si la clé est valide
 */
export function isValidEncryptionKey(key: string): boolean {
  try {
    const buffer = Buffer.from(key, 'hex');
    return buffer.length === 32;
  } catch {
    return false;
  }
}

/**
 * Vérifie si une donnée est chiffrée (format "iv:encrypted")
 * 
 * @param data - Donnée à vérifier
 * @returns true si la donnée semble être chiffrée
 */
export function isEncrypted(data: string): boolean {
  if (!data || typeof data !== 'string') return false;
  if (!data.includes(':')) return false;
  
  const parts = data.split(':');
  if (parts.length !== 2) return false;
  
  const [ivHex, encryptedText] = parts;
  if (ivHex.length !== 32) return false;
  if (encryptedText.length === 0) return false;
  
  // Vérifier que ce sont bien des hex
  try {
    Buffer.from(ivHex, 'hex');
    Buffer.from(encryptedText, 'hex');
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default {
  encryptPassword,
  decryptPassword,
  testEncryption,
  generateEncryptionKey,
  isValidEncryptionKey,
  isEncrypted
};