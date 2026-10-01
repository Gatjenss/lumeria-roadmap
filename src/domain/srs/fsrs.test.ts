import { describe, expect, it } from 'vitest';
import { formatInterval, isMature, knownCardState, newCardState, previewIntervals, reviewCard } from './fsrs';

const NOW = Date.UTC(2026, 0, 1, 12);
const DAY = 86_400_000;

describe('FSRS wrapper', () => {
  it('tarjeta nueva vence ahora', () => {
    const s = newCardState(NOW);
    expect(s.due).toBeLessThanOrEqual(NOW);
    expect(s.reps).toBe(0);
  });

  it('"Bien" programa más lejos que "Otra vez"', () => {
    const s = newCardState(NOW);
    const again = reviewCard(s, 'again', NOW);
    const good = reviewCard(s, 'good', NOW);
    expect(good.due).toBeGreaterThan(again.due);
    expect(good.reps).toBe(1);
  });

  it('fallar una tarjeta madura suma un lapso y acorta el intervalo', () => {
    const known = knownCardState(NOW);
    const later = NOW + 30 * DAY;
    const failed = reviewCard(known, 'again', later);
    expect(failed.lapses).toBe(1);
    expect(failed.due - later).toBeLessThan(known.due - NOW);
  });

  it('"ya la sé" entra en repaso con intervalo largo', () => {
    const s = knownCardState(NOW, 30);
    expect(s.due - NOW).toBe(30 * DAY);
    expect(isMature(s)).toBe(true);
  });

  it('acertar una tarjeta conocida alarga el intervalo', () => {
    const known = knownCardState(NOW, 30);
    const next = reviewCard(known, 'good', known.due);
    expect(next.due - known.due).toBeGreaterThan(30 * DAY);
  });

  it('previewIntervals es creciente de again a easy', () => {
    const p = previewIntervals(knownCardState(NOW), NOW + 30 * DAY);
    expect(p.again).toBeLessThan(p.hard);
    expect(p.hard).toBeLessThanOrEqual(p.good);
    expect(p.good).toBeLessThan(p.easy);
  });

  it('formatInterval', () => {
    expect(formatInterval(5 / 1440)).toBe('5 min');
    expect(formatInterval(0.5)).toBe('12 h');
    expect(formatInterval(10)).toBe('10 d');
    expect(formatInterval(90)).toBe('3 mes');
  });
});
