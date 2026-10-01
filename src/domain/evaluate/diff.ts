export interface DiffPart {
  text: string;
  kind: 'same' | 'extra' | 'missing';
}

/**
 * Diff carácter a carácter (LCS) entre lo escrito y lo esperado.
 * 'extra' = letras que escribiste de más; 'missing' = letras que faltaron.
 */
export function charDiff(given: string, expected: string): DiffPart[] {
  const a = [...given];
  const b = [...expected];
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  const parts: DiffPart[] = [];
  const push = (text: string, kind: DiffPart['kind']) => {
    const last = parts[parts.length - 1];
    if (last && last.kind === kind) last.text += text;
    else parts.push({ text, kind });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(a[i]!, 'same');
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      push(a[i]!, 'extra');
      i++;
    } else {
      push(b[j]!, 'missing');
      j++;
    }
  }
  while (i < a.length) push(a[i++]!, 'extra');
  while (j < b.length) push(b[j++]!, 'missing');
  return parts;
}
