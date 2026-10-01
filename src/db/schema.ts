import Dexie, { type EntityTable } from 'dexie';
import type { Grade, SrsState } from '../domain/srs/fsrs';

export type Area = 'vocab' | 'verbs';
export type CardType = 'ru-es' | 'es-ru';
export type ItemKind = 'word' | 'verb';

/** Campos comunes para la sincronización (fase 2): last-write-wins por registro. */
interface Syncable {
  updatedAt: number;
  deleted?: boolean;
}

export interface CardRecord extends Syncable {
  id: string; // `${itemId}:${cardType}`
  itemId: string;
  itemKind: ItemKind;
  cardType: CardType;
  area: Area;
  due: number; // copia de srs.due para indexar
  srs: SrsState;
  priority: number; // >0 = sale antes (palabras de clase)
  suspended?: boolean;
}

export interface ReviewLog extends Syncable {
  id: string;
  cardId: string;
  itemId: string;
  area: Area;
  cardType: CardType;
  grade: Grade;
  correct: boolean;
  given?: string;
  expected?: string;
  durationMs: number;
  prevState: number;
  ts: number;
}

export interface SettingRecord extends Syncable {
  key: string;
  value: unknown;
}

export class RusoDB extends Dexie {
  cards!: EntityTable<CardRecord, 'id'>;
  reviewLogs!: EntityTable<ReviewLog, 'id'>;
  settings!: EntityTable<SettingRecord, 'key'>;

  constructor(name = 'ruso-practica') {
    super(name);
    this.version(1).stores({
      cards: 'id, itemId, area, due, updatedAt',
      reviewLogs: 'id, cardId, area, ts, updatedAt',
      settings: 'key, updatedAt',
    });
  }
}

export const db = new RusoDB();
