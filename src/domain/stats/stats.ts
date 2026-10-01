import { isMature, type SrsState } from '../srs/fsrs';
import { State } from 'ts-fsrs';

export const dayKey = (ts: number): string => {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const shiftDay = (key: string, delta: number): string => {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return dayKey(new Date(y, m - 1, d + delta, 12).getTime());
};

/** Racha: días consecutivos con práctica. Si hoy aún no practicas, la racha de ayer sigue viva. */
export function computeStreak(practiceDays: Iterable<string>, today: string): number {
  const set = new Set(practiceDays);
  let cursor = set.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

export interface LogLike {
  ts: number;
  correct: boolean;
  durationMs: number;
}

export function accuracy(logs: LogLike[]): number | null {
  if (logs.length === 0) return null;
  return logs.filter((l) => l.correct).length / logs.length;
}

/** Minutos por día (clave AAAA-MM-DD). Limita cada respuesta a 2 min para ignorar pausas olvidadas. */
export function minutesByDay(logs: LogLike[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const l of logs) {
    const k = dayKey(l.ts);
    out.set(k, (out.get(k) ?? 0) + Math.min(l.durationMs, 120_000) / 60_000);
  }
  return out;
}

export interface CardCounts {
  total: number;
  new: number;
  learning: number;
  mature: number;
}

export function countCards(states: SrsState[]): CardCounts {
  const c: CardCounts = { total: states.length, new: 0, learning: 0, mature: 0 };
  for (const s of states) {
    if (s.state === State.New) c.new++;
    else if (isMature(s)) c.mature++;
    else c.learning++;
  }
  return c;
}
