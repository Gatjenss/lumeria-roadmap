import { z } from 'zod';

export const LevelSchema = z.enum(['A1', 'A2', 'B1']);
export type Level = z.infer<typeof LevelSchema>;

const nonEmpty = z.string().min(1);
const ExampleSchema = z.object({ ru: nonEmpty, es: nonEmpty });

export const WordSchema = z.object({
  id: nonEmpty,
  ru: nonEmpty,
  es: z.array(nonEmpty).min(1),
  pos: z.enum(['noun', 'verb', 'adj', 'adv', 'pron', 'num', 'prep', 'conj', 'particle', 'interj', 'phrase']),
  gender: z.enum(['m', 'f', 'n']).optional(),
  example: ExampleSchema,
  tags: z.array(nonEmpty).min(1),
  level: LevelSchema,
  freq: z.number().int().positive(),
  verified: z.boolean(),
  notes: z.string().optional(),
});
export type Word = z.infer<typeof WordSchema>;

const Pronouns6 = z.object({
  ya: nonEmpty,
  ty: nonEmpty,
  on: nonEmpty,
  my: nonEmpty,
  vy: nonEmpty,
  oni: nonEmpty,
});

export const VerbSchema = z.object({
  id: nonEmpty,
  inf: nonEmpty,
  es: z.array(nonEmpty).min(1),
  aspect: z.enum(['impf', 'pf']),
  pairId: nonEmpty,
  group: z.enum(['1', '2']),
  irregular: z.boolean(),
  alternation: z.string().optional(),
  reflexive: z.boolean(),
  /** Presente (imperfectivo) o futuro simple (perfectivo). Viene de los datos, no de reglas. */
  nonPast: Pronouns6,
  past: z.object({ m: nonEmpty, f: nonEmpty, n: nonEmpty, pl: nonEmpty }),
  imperative: z.object({ sg: nonEmpty, pl: nonEmpty }),
  government: z.string().optional(),
  examples: z.array(ExampleSchema).min(1),
  level: LevelSchema,
  freq: z.number().int().positive(),
  verified: z.boolean(),
});
export type Verb = z.infer<typeof VerbSchema>;

export const WordsFileSchema = z.array(WordSchema);
export const VerbsFileSchema = z.array(VerbSchema);
