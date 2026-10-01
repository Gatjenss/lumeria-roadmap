import { createEmptyCard, fsrs, Rating, State, type Card } from 'ts-fsrs';

export const DEFAULT_RETENTION = 0.9;
/** Intervalo inicial (días) de una tarjeta marcada "ya la sé". */
export const KNOWN_INTERVAL_DAYS = 30;

export type Grade = 'again' | 'hard' | 'good' | 'easy';
export const GRADES: Grade[] = ['again', 'hard', 'good', 'easy'];

/** Estado FSRS serializable (fechas en ms) para guardarlo en IndexedDB y sincronizarlo. */
export interface SrsState {
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview?: number;
}

const DAY = 86_400_000;
const RATING: Record<Grade, Rating.Again | Rating.Hard | Rating.Good | Rating.Easy> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const toCard = (s: SrsState): Card => ({
  due: new Date(s.due),
  stability: s.stability,
  difficulty: s.difficulty,
  elapsed_days: s.elapsedDays,
  scheduled_days: s.scheduledDays,
  learning_steps: s.learningSteps,
  reps: s.reps,
  lapses: s.lapses,
  state: s.state as State,
  ...(s.lastReview !== undefined ? { last_review: new Date(s.lastReview) } : {}),
});

const fromCard = (c: Card): SrsState => ({
  due: c.due.getTime(),
  stability: c.stability,
  difficulty: c.difficulty,
  elapsedDays: c.elapsed_days,
  scheduledDays: c.scheduled_days,
  learningSteps: c.learning_steps,
  reps: c.reps,
  lapses: c.lapses,
  state: c.state,
  ...(c.last_review ? { lastReview: c.last_review.getTime() } : {}),
});

export function newCardState(now: number): SrsState {
  return fromCard(createEmptyCard(new Date(now)));
}

/** Tarjeta "ya la sé": entra directamente en repaso con un intervalo largo. */
export function knownCardState(now: number, days = KNOWN_INTERVAL_DAYS): SrsState {
  return {
    due: now + days * DAY,
    stability: days,
    difficulty: 5,
    elapsedDays: 0,
    scheduledDays: days,
    learningSteps: 0,
    reps: 1,
    lapses: 0,
    state: State.Review,
    lastReview: now,
  };
}

export function reviewCard(s: SrsState, grade: Grade, now: number, retention = DEFAULT_RETENTION): SrsState {
  const scheduler = fsrs({ request_retention: retention, enable_fuzz: false });
  return fromCard(scheduler.next(toCard(s), new Date(now), RATING[grade]).card);
}

/** Vista previa del próximo intervalo (días, fraccionario) para cada botón. */
export function previewIntervals(s: SrsState, now: number, retention = DEFAULT_RETENTION): Record<Grade, number> {
  const out = {} as Record<Grade, number>;
  for (const g of GRADES) out[g] = (reviewCard(s, g, now, retention).due - now) / DAY;
  return out;
}

export function formatInterval(days: number): string {
  const minutes = days * 1440;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  if (days < 1) return `${Math.round(minutes / 60)} h`;
  if (days < 30) return `${Math.round(days)} d`;
  if (days < 365) return `${Math.round(days / 30)} mes`;
  return `${(days / 365).toFixed(1)} a`;
}

export const isMature = (s: SrsState) => s.state === State.Review && s.stability >= 21;
export const isNew = (s: SrsState) => s.state === State.New;
