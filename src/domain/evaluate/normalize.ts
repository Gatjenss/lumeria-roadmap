const COMBINING_ACCENTS = /[̀́]/g;

/** Normaliza para comparar respuestas en ruso: sin acento, е=ё, sin mayúsculas ni espacios extra. */
export function normalizeRu(s: string): string {
  return s
    .normalize('NFD')
    .replace(COMBINING_ACCENTS, '')
    .normalize('NFC')
    .replace(/ё/gi, 'е')
    .toLowerCase()
    .replace(/[.,!?;:…"«»]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normaliza respuestas en español: ignora tildes, mayúsculas y espacios extra. */
export function normalizeEs(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.,!?¡¿;:"]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
