/**
 * Extrait un nom de domaine à partir d'un nom de dépense
 * Ex: "EDF" -> "edf.com", "Carrefour" -> "carrefour.com"
 */
export function extractDomainFromName(name: string): string {
  const normalized = name.toLowerCase().trim();
  const commonDomains = [
    ".com",
    ".fr",
    ".net",
    ".org"
  ];

  // Si le nom contient déjà un domaine, le retourner
  if (commonDomains.some(domain => normalized.includes(domain))) {
    return normalized;
  }

  // Sinon, ajouter .com
  return `${normalized}.com`;
}

/**
 * Génère une URL de logo Clearbit
 * Retourne null si le nom est trop court ou invalide
 * @param name - Le nom de l'entreprise
 * @param greyscale - Si true, retourne le logo en niveaux de gris (par défaut: true)
 */
export function getClearbitLogoUrl(name: string, greyscale: boolean = true): string | null {
  if (!name || name.length < 2) {
    return null;
  }

  const domain = extractDomainFromName(name);
  const greyscaleParam = greyscale ? "?greyscale=true" : "";
  return `https://logo.clearbit.com/${domain}${greyscaleParam}`;
}

/**
 * Vérifie si une URL de logo est valide en tentant de la charger
 */
export async function validateLogoUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", mode: "no-cors" });
    return true;
  } catch {
    // En mode no-cors, on ne peut pas vérifier la réponse
    // On retourne true par défaut et on laisse l'image gérer l'erreur
    return true;
  }
}
