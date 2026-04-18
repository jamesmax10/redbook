export const PROPERTY_TYPE_KEYWORDS = [
  "office",
  "retail",
  "industrial",
  "warehouse",
  "restaurant",
  "mixed use",
  "mixed-use",
  "apartment",
  "residential",
  "hotel",
  "pub",
  "shop",
  "showroom",
  "clinic",
  "crèche",
  "creche",
] as const;

export const ADDRESS_NOISE = [
  /\b(is\s+)?for\s+sale\b/gi,
  /\bto\s+(let|rent)\b/gi,
  /\bon\s+(Daft\.ie|MyHome\.ie|PropertyPal|Lisney|CBRE|BNP|JLL|Savills|Allsop)\b/gi,
  /\b(Sale Agreed|Price on Application|POA)\b/gi,
];

export function cleanAddress(raw: string): string {
  let addr = raw;
  for (const re of ADDRESS_NOISE) {
    addr = addr.replace(re, "");
  }
  return addr
    .replace(/\s*[,\-–|]\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function inferTransactionType(text: string): string {
  const lower = text.toLowerCase();
  if (/\bfor\s+sale\b/.test(lower) || /\bsale\s+agreed\b/.test(lower)) return "Sale";
  if (/\bto\s+(let|rent)\b/.test(lower) || /\bfor\s+rent\b/.test(lower)) return "Letting";
  return "";
}
