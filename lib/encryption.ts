// lib/encryption.ts
import crypto from 'crypto';

/**
 * Clé de chiffrement utilisée pour AES-256-CBC
 * Doit être une chaîne hexadécimale de 64 caractères (32 bytes)
 * 
 * Pour générer une nouvelle clé: 
 * node -e "console.log(crypto.randomBytes(32).toString('hex'))"
 */
/**
 * Lit la clé au moment de l'usage : sans clé valide on refuse de chiffrer
 * plutôt que d'utiliser une clé aléatoire (perdue au redémarrage) ou une
 * clé écrite dans le code (lisible par quiconque voit le dépôt).
 */
// Valeur d'environnement nettoyée : espaces, retours à la ligne et guillemets
// éventuellement collés avec la clé dans l'interface d'hébergement
function envKey(name: string): string | undefined {
  const raw = process.env[name];
  return raw ? raw.trim().replace(/^['"]|['"]$/g, '').trim() : undefined;
}

function getEncryptionKey(): Buffer {
  const key = envKey('EMAIL_ENCRYPTION_KEY');
  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('EMAIL_ENCRYPTION_KEY manquante ou invalide (64 caractères hexadécimaux attendus)');
  }
  if (/^(0123456789abcdef){4}$/i.test(key)) {
    console.warn('⚠️ EMAIL_ENCRYPTION_KEY est la valeur publique « 0123… » : faites tourner la clé');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Ancienne clé, pendant une rotation (EMAIL_ENCRYPTION_KEY_PREVIOUS) : elle
 * sert seulement à relire les valeurs pas encore re-chiffrées.
 */
function getPreviousKey(): Buffer | null {
  const key = envKey('EMAIL_ENCRYPTION_KEY_PREVIOUS');
  if (key && !/^[0-9a-fA-F]{64}$/.test(key)) {
    console.error('❌ EMAIL_ENCRYPTION_KEY_PREVIOUS invalide (64 caractères hexadécimaux attendus) : ignorée');
  }
  return key && /^[0-9a-fA-F]{64}$/.test(key) ? Buffer.from(key, 'hex') : null;
}

// Une mauvaise clé échoue presque toujours au déchiffrement ; dans les rares
// cas où elle « réussit », le résultat n'est pas du texte lisible
function looksLikeText(value: string): boolean {
  return value.length > 0 && !/[�\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
}

function decryptWithKey(key: Buffer, ivHex: string, encryptedText: string): string | null {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    const plain = decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');
    return looksLikeText(plain) ? plain : null;
  } catch {
    return null;
  }
}

/**
 * Déchiffre avec la clé actuelle, sinon avec l'ancienne. Indique laquelle a
 * servi : une valeur lue avec l'ancienne clé doit être re-chiffrée.
 */
export function decryptSecretDetailed(encryptedData: string): { plain: string; key: 'current' | 'previous' } | null {
  if (!encryptedData || typeof encryptedData !== 'string' || !encryptedData.includes(':')) return null;
  const [ivHex, encryptedText] = encryptedData.split(':');
  if (!ivHex || !encryptedText || ivHex.length !== IV_LENGTH * 2) return null;

  let current: Buffer | null = null;
  try {
    current = getEncryptionKey();
  } catch {
    current = null;
  }
  if (current) {
    const plain = decryptWithKey(current, ivHex, encryptedText);
    if (plain !== null) return { plain, key: 'current' };
  }
  const previous = getPreviousKey();
  if (previous) {
    const plain = decryptWithKey(previous, ivHex, encryptedText);
    if (plain !== null) return { plain, key: 'previous' };
  }
  return null;
}

/** true si la valeur n'est lisible qu'avec l'ancienne clé. */
export function needsReencryption(encryptedData: string): boolean {
  return decryptSecretDetailed(encryptedData)?.key === 'previous';
}

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
      getEncryptionKey(),
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
  const result = decryptSecretDetailed(encryptedData);
  if (!result) {
    console.error('❌ Déchiffrement impossible (format invalide ou clé différente)');
    return '';
  }
  return result.plain;
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