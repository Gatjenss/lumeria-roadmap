import { describe, expect, it } from 'vitest';
import { knownCardState, newCardState, reviewCard } from '../srs/fsrs';
import { accuracy, computeStreak, countCards, dayKey, minutesByDay } from './stats';

describe('computeStreak', () => {
  it('cuenta días consecutivos terminando hoy', () => {
    expect(computeStreak(['2026-03-01', '2026-02-28', '2026-02-27'], '2026-03-01')).toBe(3);
  });
  it('si hoy no hay práctica, mantiene la racha de ayer', () => {
    expect(computeStreak(['2026-02-28', '2026-02-27'], '2026-03-01')).toBe(2);
  });
  it('se rompe con un día de hueco', () => {
    expect(computeStreak(['2026-02-27'], '2026-03-01')).toBe(0);
  });
  it('cruza el fin de mes y de año', () => {
    expect(computeStreak(['2026-01-01', '2025-12-31'], '2026-01-01')).toBe(2);
  });
});

describe('accuracy / minutes', () => {
  it('porcentaje de aciertos', () => {
    expect(accuracy([])).toBeNull();
    expect(accuracy([{ ts: 0, correct: true, durationMs: 1 }, { ts: 0, correct: false, durationMs: 1 }])).toBe(0.5);
  });
  it('agrupa minutos por día y limita pausas largas', () => {
    const ts = new Date(2026, 0, 5, 10).getTime();
    const m = minutesByDay([{ ts, correct: true, durationMs: 60_000 }, { ts, correct: true, durationMs: 3_600_000 }]);
    expect(m.get(dayKey(ts))).toBeCloseTo(3);
  });
});

describe('countCards', () => {
  it('separa nuevas, en aprendizaje y maduras', () => {
    const now = Date.UTC(2026, 0, 1);
    const counts = countCards([newCardState(now), knownCardState(now), reviewCard(newCardState(now), 'good', now)]);
    expect(counts).toEqual({ total: 3, new: 1, mature: 1, learning: 1 });
  });
});
