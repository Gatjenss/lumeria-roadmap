import { charDiff, type DiffPart } from './diff';
import { normalizeEs, normalizeRu } from './normalize';

export interface CheckResult {
  correct: boolean;
  /** Diff entre la respuesta normalizada y la forma normalizada más cercana. */
  diff: DiffPart[];
  /** Respuesta correcta tal como se muestra (con acento). */
  expected: string;
}

function closest(given: string, candidates: string[], norm: (s: string) => string) {
  const g = norm(given);
  let best = candidates[0] ?? '';
  let bestScore = -1;
  for (const c of candidates) {
    if (norm(c) === g) return { match: c, exact: true };
    const same = charDiff(g, norm(c))
      .filter((p) => p.kind === 'same')
      .reduce((n, p) => n + [...p.text].length, 0);
    if (same > bestScore) {
      bestScore = same;
      best = c;
    }
  }
  return { match: best, exact: false };
}

/** Evalúa una respuesta en ruso. `accepted` son las formas válidas (con acento). */
export function checkRu(given: string, accepted: string[]): CheckResult {
  const { match, exact } = closest(given, accepted, normalizeRu);
  return {
    correct: exact,
    diff: exact ? [] : charDiff(normalizeRu(given), normalizeRu(match)),
    expected: match,
  };
}

/** Evalúa una respuesta en español contra varias traducciones válidas. */
export function checkEs(given: string, accepted: string[]): CheckResult {
  const { match, exact } = closest(given, accepted, normalizeEs);
  return {
    correct: exact,
    diff: exact ? [] : charDiff(normalizeEs(given), normalizeEs(match)),
    expected: match,
  };
}
