import { dayKey } from '../domain/stats/stats';
import { knownCardState, newCardState, reviewCard, type Grade } from '../domain/srs/fsrs';
import { State } from 'ts-fsrs';
import type { Area, CardRecord, CardType, ItemKind, RusoDB } from './schema';

export const CARD_TYPES: CardType[] = ['ru-es', 'es-ru'];
export const DEFAULT_NEW_PER_DAY = 10;

export const cardId = (itemId: string, type: CardType) => `${itemId}:${type}`;
const areaOf = (kind: ItemKind): Area => (kind === 'verb' ? 'verbs' : 'vocab');

/** Crea las tarjetas de un ítem. known=true → intervalo largo ("ya la sé"). No pisa tarjetas existentes. */
export async function classifyItem(db: RusoDB, itemId: string, kind: ItemKind, known: boolean, now = Date.now()) {
  const records: CardRecord[] = [];
  for (const type of CARD_TYPES) {
    const id = cardId(itemId, type);
    if (await db.cards.get(id)) continue;
    const srs = known ? knownCardState(now) : newCardState(now);
    records.push({ id, itemId, itemKind: kind, cardType: type, area: areaOf(kind), due: srs.due, srs, priority: 0, updatedAt: now });
  }
  await db.cards.bulkAdd(records);
}

export async function classifiedItemIds(db: RusoDB): Promise<Set<string>> {
  return new Set((await db.cards.toCollection().primaryKeys()).map((k) => String(k).split(':')[0]!));
}

export async function getSetting<T>(db: RusoDB, key: string, fallback: T): Promise<T> {
  const r = await db.settings.get(key);
  return r ? (r.value as T) : fallback;
}

export async function setSetting(db: RusoDB, key: string, value: unknown, now = Date.now()) {
  await db.settings.put({ key, value, updatedAt: now });
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export async function newIntroducedToday(db: RusoDB, now = Date.now()): Promise<number> {
  const logs = await db.reviewLogs.where('ts').aboveOrEqual(startOfDay(now)).toArray();
  return logs.filter((l) => l.prevState === State.New).length;
}

export interface Queue {
  due: CardRecord[];
  fresh: CardRecord[];
}

/**
 * Cola de repaso: tarjetas vencidas (las de clase primero, luego las más atrasadas) y,
 * aparte, las nuevas que aún caben en el límite diario.
 */
export async function buildQueue(db: RusoDB, now = Date.now()): Promise<Queue> {
  const all = (await db.cards.toArray()).filter((c) => !c.suspended && !c.deleted);
  const byUrgency = (a: CardRecord, b: CardRecord) => b.priority - a.priority || a.due - b.due;
  const due = all.filter((c) => c.srs.state !== State.New && c.due <= now).sort(byUrgency);
  const newLimit = await getSetting(db, 'newPerDay', DEFAULT_NEW_PER_DAY);
  const room = Math.max(0, newLimit - (await newIntroducedToday(db, now)));
  const fresh = all.filter((c) => c.srs.state === State.New).sort(byUrgency).slice(0, room);
  return { due, fresh };
}

export interface AnswerInput {
  grade: Grade;
  correct: boolean;
  given?: string;
  expected?: string;
  durationMs: number;
}

export async function answerCard(db: RusoDB, card: CardRecord, a: AnswerInput, now = Date.now(), retention?: number) {
  const srs = reviewCard(card.srs, a.grade, now, retention);
  await db.transaction('rw', db.cards, db.reviewLogs, async () => {
    await db.cards.update(card.id, { srs, due: srs.due, updatedAt: now });
    await db.reviewLogs.add({
      id: crypto.randomUUID(),
      cardId: card.id,
      itemId: card.itemId,
      area: card.area,
      cardType: card.cardType,
      grade: a.grade,
      correct: a.correct,
      ...(a.given !== undefined ? { given: a.given } : {}),
      ...(a.expected !== undefined ? { expected: a.expected } : {}),
      durationMs: a.durationMs,
      prevState: card.srs.state,
      ts: now,
      updatedAt: now,
    });
  });
  return srs;
}

export async function practiceDays(db: RusoDB): Promise<Set<string>> {
  const days = new Set<string>();
  await db.reviewLogs.each((l) => days.add(dayKey(l.ts)));
  return days;
}
