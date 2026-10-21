// lib/api/rate-limit.ts
// Limiteur en mémoire (fenêtre fixe) pour protéger les quotas des
// fournisseurs IA. Suffisant pour une seule instance Node (Render) ;
// avec plusieurs instances, chaque instance a son propre compteur.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'inconnu';
}

/** true si la requête est acceptée, false si la limite est atteinte. */
export function takeToken(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}
