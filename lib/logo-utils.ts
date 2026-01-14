/**
 * Mapping manuel pour les noms d'entreprises compliqués
 */
const domainMapping: Record<string, string> = {
  "carrefour": "carrefour.fr",
  "leclerc": "e.leclerc",
  "auchan": "auchan.fr",
  "intermarché": "intermarche.com",
  "intermarche": "intermarche.com",
  "casino": "casino.fr",
  "monoprix": "monoprix.fr",
  "fnac": "fnac.com",
  "darty": "darty.com",
  "leroy merlin": "leroymerlin.fr",
  "leroymerlin": "leroymerlin.fr",
  "castorama": "castorama.fr",
  "brico dépôt": "bricodepot.fr",
  "bricodepot": "bricodepot.fr",
  "ikea": "ikea.com",
  "decathlon": "decathlon.fr",
  "zara": "zara.com",
  "hm": "hm.com",
  "conforama": "conforama.fr",
  "but": "but.fr",
};

/**
 * Extrait un nom de domaine à partir d'un nom de dépense
 * Utilise un mapping manuel pour les cas spéciaux
 * Ex: "EDF" -> "edf.com", "Carrefour" -> "carrefour.fr"
 */
export function extractDomainFromName(name: string): string {
  const normalized = name.toLowerCase().trim();
  
  // Vérifier le mapping manuel en premier
  if (domainMapping[normalized]) {
    return domainMapping[normalized];
  }
  
  // Vérifier les variations avec espaces/accents
  const variations = [
    normalized.replace(/\s+/g, ""),
    normalized.replace(/[éèêë]/g, "e").replace(/[àâ]/g, "a").replace(/[ôö]/g, "o").replace(/[ùûü]/g, "u").replace(/[îï]/g, "i"),
    normalized.replace(/\s+/g, "").replace(/[éèêë]/g, "e").replace(/[àâ]/g, "a").replace(/[ôö]/g, "o").replace(/[ùûü]/g, "u").replace(/[îï]/g, "i"),
  ];
  
  for (const variation of variations) {
    if (domainMapping[variation]) {
      return domainMapping[variation];
    }
  }

  const commonDomains = [".com", ".fr", ".net", ".org"];

  // Si le nom contient déjà un domaine, le retourner
  if (commonDomains.some(domain => normalized.includes(domain))) {
    return normalized;
  }

  // Sinon, retourner avec .com (sera testé avec d'autres extensions ailleurs)
  return `${normalized}.com`;
}

/**
 * Retourne toujours un domaine, en testant plusieurs extensions si nécessaire
 */
export function getDomainWithFallback(name: string): string {
  const baseDomain = extractDomainFromName(name);
  
  // Si c'est déjà un domaine complet (contient un point), le retourner
  if (baseDomain.includes(".")) {
    return baseDomain;
  }
  
  // Sinon, essayer .com par défaut
  return `${baseDomain}.com`;
}

/**
 * Génère une URL de logo Clearbit
 * Retourne toujours une URL (jamais null)
 * @param name - Le nom de l'entreprise
 * @param greyscale - Si true, retourne le logo en niveaux de gris (par défaut: true)
 */
export function getClearbitLogoUrl(name: string, greyscale: boolean = true): string {
  if (!name || name.length < 1) {
    return "";
  }

  const domain = extractDomainFromName(name);
  const greyscaleParam = greyscale ? "?greyscale=true" : "";
  return `https://logo.clearbit.com/${domain}${greyscaleParam}`;
}

/**
 * Génère une URL de favicon Google en secours
 * @param name - Le nom de l'entreprise
 */
export function getGoogleFaviconUrl(name: string): string {
  if (!name || name.length < 1) {
    return "";
  }

  const domain = extractDomainFromName(name);
  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
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
