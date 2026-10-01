import { describe, expect, it } from 'vitest';
import { checkEs, checkRu } from './check';
import { charDiff } from './diff';
import { normalizeEs, normalizeRu } from './normalize';

describe('normalizeRu', () => {
  it('ignora acentos, mayúsculas, espacios y ё', () => {
    expect(normalizeRu('  Молоко́ ')).toBe('молоко');
    expect(normalizeRu('ещё')).toBe(normalizeRu('еще'));
    expect(normalizeRu('Всё   хорошо')).toBe('все хорошо');
  });
  it('ignora puntuación final', () => {
    expect(normalizeRu('Привет!')).toBe('привет');
  });
});

describe('normalizeEs', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(normalizeEs('Él está')).toBe('el esta');
  });
});

describe('checkRu', () => {
  it('acepta respuesta sin acento', () => {
    expect(checkRu('молоко', ['молоко́']).correct).toBe(true);
  });
  it('devuelve la forma con acento cuando hay error', () => {
    const r = checkRu('малако', ['молоко́']);
    expect(r.correct).toBe(false);
    expect(r.expected).toBe('молоко́');
    expect(r.diff.some((p) => p.kind !== 'same')).toBe(true);
  });
  it('elige la variante aceptada más cercana', () => {
    expect(checkRu('сде́лал', ['де́лал', 'сде́лал']).correct).toBe(true);
  });
});

describe('checkEs', () => {
  it('acepta cualquiera de las traducciones', () => {
    expect(checkEs('Casa', ['hogar', 'casa']).correct).toBe(true);
    expect(checkEs('adiós', ['adios']).correct).toBe(true);
  });
  it('rechaza una respuesta distinta', () => {
    expect(checkEs('perro', ['gato']).correct).toBe(false);
  });
});

describe('charDiff', () => {
  it('marca letras sobrantes y faltantes', () => {
    const d = charDiff('кот', 'кит');
    const text = (k: string) => d.filter((p) => p.kind === k).map((p) => p.text).join('');
    expect(text('extra')).toBe('о');
    expect(text('missing')).toBe('и');
  });
  it('sin diferencias devuelve todo same', () => {
    expect(charDiff('да', 'да')).toEqual([{ text: 'да', kind: 'same' }]);
  });
});
