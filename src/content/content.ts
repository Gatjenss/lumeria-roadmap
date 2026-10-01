import wordsJson from '../../data/words.json';
import verbsJson from '../../data/verbs.json';
import { VerbsFileSchema, WordsFileSchema, type Level, type Verb, type Word } from './schema';
import type { ItemKind } from '../db/schema';

export const words: Word[] = WordsFileSchema.parse(wordsJson);
export const verbs: Verb[] = VerbsFileSchema.parse(verbsJson);

/** Vista común para tarjetas de vocabulario (palabras e infinitivos de verbos). */
export interface StudyItem {
  id: string;
  kind: ItemKind;
  ru: string;
  es: string[];
  example: { ru: string; es: string };
  level: Level;
  freq: number;
  detail: string; // categoría gramatical / género / aspecto, para mostrar
  verified: boolean;
}

const GENDER = { m: 'masculino', f: 'femenino', n: 'neutro' } as const;
const POS = {
  noun: 'sustantivo', verb: 'verbo', adj: 'adjetivo', adv: 'adverbio', pron: 'pronombre',
  num: 'numeral', prep: 'preposición', conj: 'conjunción', particle: 'partícula', interj: 'interjección', phrase: 'frase',
} as const;

export const items: StudyItem[] = [
  ...words.map<StudyItem>((w) => ({
    id: w.id,
    kind: 'word',
    ru: w.ru,
    es: w.es,
    example: w.example,
    level: w.level,
    freq: w.freq,
    detail: [POS[w.pos], w.gender ? GENDER[w.gender] : null].filter(Boolean).join(' · '),
    verified: w.verified,
  })),
  ...verbs.map<StudyItem>((v) => ({
    id: v.id,
    kind: 'verb',
    ru: v.inf,
    es: v.es,
    example: v.examples[0]!,
    level: v.level,
    freq: v.freq,
    detail: `verbo · ${v.aspect === 'impf' ? 'imperfectivo' : 'perfectivo'}`,
    verified: v.verified,
  })),
];

export const itemById = new Map(items.map((i) => [i.id, i]));
