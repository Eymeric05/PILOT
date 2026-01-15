const domainMapping: Record<string, string> = {
  "carrefour": "carrefour.fr",
  "leclerc": "e.leclerc",
  "auchan": "auchan.fr",
  "monoprix": "monoprix.fr",
  "decathlon": "decathlon.fr"
};

export function getClearbitLogoUrl(name: string): string {
  if (!name) return "";
  const normalized = name.toLowerCase().trim();
  const domain = domainMapping[normalized] || `${normalized.replace(/\s+/g, "")}.com`;
  const token = "pk_WouWW28wRw6g3LkkOhbwFg";
  return `https://img.logo.dev/${domain}?token=${token}`;
}

export function getGoogleFaviconUrl(name: string): string {
  const normalized = name.toLowerCase().trim();
  const domain = domainMapping[normalized] || `${normalized.replace(/\s+/g, "")}.com`;
  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
}