import { readFileSync } from 'node:fs';
import { VerbsFileSchema, WordsFileSchema } from '../src/content/schema';
import { validateContent } from '../src/content/validate';

const read = (f: string) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const words = WordsFileSchema.safeParse(read('words.json'));
const verbs = VerbsFileSchema.safeParse(read('verbs.json'));
const errors: string[] = [];
if (!words.success) errors.push(...words.error.issues.map((i) => `words.json ${i.path.join('.')}: ${i.message}`));
if (!verbs.success) errors.push(...verbs.error.issues.map((i) => `verbs.json ${i.path.join('.')}: ${i.message}`));
if (words.success && verbs.success) errors.push(...validateContent(words.data, verbs.data));

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} error(es)`);
  process.exit(1);
}
console.log(`OK: ${words.success ? words.data.length : 0} palabras, ${verbs.success ? verbs.data.length : 0} verbos`);
