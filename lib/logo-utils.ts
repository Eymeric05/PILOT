const domainMapping: Record<string, string> = {
  "carrefour": "carrefour.fr",
  "leclerc": "e.leclerc",
  "auchan": "auchan.fr",
  "intermarché": "intermarche.com",
  "monoprix": "monoprix.fr",
};

export function extractDomainFromName(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (domainMapping[normalized]) return domainMapping[normalized];
  return `${normalized.replace(/\s+/g, "")}.com`;
}

// CETTE FONCTION DOIT ÊTRE EXPORTÉE SOUS LES DEUX NOMS POUR LE BUILD
export function getLogoDevUrl(name: string): string {
  if (!name) return "";
  const domain = extractDomainFromName(name);
  const apiToken = "pk_WouWW28wRw6g3LkkOhbwFg";
  return `https://img.logo.dev/${domain}?token=${apiToken}`;
}

// Alias pour la compatibilité avec expense-list.tsx
export const getClearbitLogoUrl = getLogoDevUrl;

export function getGoogleFaviconUrl(name: string): string {
  if (!name) return "";
  const domain = extractDomainFromName(name);
  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
}