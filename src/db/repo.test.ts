import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { answerCard, buildQueue, classifiedItemIds, classifyItem, practiceDays, setSetting } from './repo';
import { RusoDB } from './schema';

const NOW = new Date(2026, 5, 10, 12).getTime();
const DAY = 86_400_000;
let db: RusoDB;

beforeEach(async () => {
  db = new RusoDB(`test-${Math.random()}`);
  await db.open();
});

describe('clasificación', () => {
  it('crea dos tarjetas por ítem y no las duplica', async () => {
    await classifyItem(db, 'w-dom', 'word', false, NOW);
    await classifyItem(db, 'w-dom', 'word', true, NOW);
    expect(await db.cards.count()).toBe(2);
    expect((await classifiedItemIds(db)).has('w-dom')).toBe(true);
  });

  it('"ya la sé" no aparece vencida hoy; "practicar" sí como nueva', async () => {
    await classifyItem(db, 'w-dom', 'word', true, NOW);
    await classifyItem(db, 'w-voda', 'word', false, NOW);
    const q = await buildQueue(db, NOW);
    expect(q.due).toHaveLength(0);
    expect(q.fresh.map((c) => c.itemId)).toEqual(['w-voda', 'w-voda']);
  });

  it('las conocidas vencen pasado el intervalo', async () => {
    await classifyItem(db, 'w-dom', 'word', true, NOW);
    expect((await buildQueue(db, NOW + 31 * DAY)).due).toHaveLength(2);
  });
});

describe('repaso', () => {
  it('guarda el log y reprograma la tarjeta', async () => {
    await classifyItem(db, 'w-dom', 'word', false, NOW);
    const [card] = (await buildQueue(db, NOW)).fresh;
    await answerCard(db, card!, { grade: 'good', correct: true, durationMs: 3000 }, NOW);
    const updated = await db.cards.get(card!.id);
    expect(updated!.srs.reps).toBe(1);
    expect(updated!.due).toBe(updated!.srs.due);
    expect(await db.reviewLogs.count()).toBe(1);
    expect((await practiceDays(db)).size).toBe(1);
  });

  it('respeta el límite diario de nuevas', async () => {
    for (const id of ['a', 'b', 'c']) await classifyItem(db, `w-${id}`, 'word', false, NOW);
    await setSetting(db, 'newPerDay', 2, NOW);
    const q1 = await buildQueue(db, NOW);
    expect(q1.fresh).toHaveLength(2);
    await answerCard(db, q1.fresh[0]!, { grade: 'good', correct: true, durationMs: 1 }, NOW);
    expect((await buildQueue(db, NOW)).fresh).toHaveLength(1);
  });
});
