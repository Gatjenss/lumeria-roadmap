import type { Verb, Word } from './schema';

/** Comprobaciones más allá del esquema Zod: duplicados, pares de aspecto y acentos. Devuelve la lista de errores. */
export function validateContent(words: Word[], verbs: Verb[]): string[] {
  const errors: string[] = [];
  const seen = (label: string, values: string[]) => {
    const set = new Set<string>();
    for (const v of values) {
      if (set.has(v)) errors.push(`${label} duplicado: ${v}`);
      set.add(v);
    }
  };
  seen('id de palabra', words.map((w) => w.id));
  seen('palabra rusa', words.map((w) => w.ru.normalize('NFC')));
  seen('id de verbo', verbs.map((v) => v.id));
  seen('infinitivo', verbs.map((v) => v.inf.normalize('NFC')));

  const byId = new Map(verbs.map((v) => [v.id, v]));
  for (const v of verbs) {
    const pair = byId.get(v.pairId);
    if (!pair) errors.push(`${v.id}: par de aspecto inexistente (${v.pairId})`);
    else {
      if (pair.pairId !== v.id) errors.push(`${v.id}: el par ${pair.id} no apunta de vuelta`);
      if (pair.aspect === v.aspect) errors.push(`${v.id}: el par tiene el mismo aspecto`);
    }
  }
  const stressMark = /́/;
  for (const w of words) {
    const syllables = (w.ru.match(/[аеёиоуыэюя]/gi) ?? []).length;
    if (syllables > 1 && !/ё/i.test(w.ru) && !stressMark.test(w.ru.normalize('NFD')) && !w.ru.includes(' ')) {
      errors.push(`${w.id}: palabra de varias sílabas sin acento marcado`);
    }
  }
  return errors;
}
