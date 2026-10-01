import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { itemById } from '../../content/content';
import { answerCard, buildQueue } from '../../db/repo';
import { db, type CardRecord } from '../../db/schema';
import { checkRu, type CheckResult } from '../../domain/evaluate/check';
import { formatInterval, previewIntervals, type Grade } from '../../domain/srs/fsrs';
import { Button } from '../components/Button';

export function ReviewScreen() {
  const [queue, setQueue] = useState<CardRecord[] | null>(null);
  useEffect(() => {
    void buildQueue(db).then((q) => setQueue([...q.due, ...q.fresh]));
  }, []);
  if (!queue) return null;
  return <Session initial={queue} />;
}

const GRADE_UI: { grade: Grade; label: string; tone: 'danger' | 'warn' | 'ok' | 'primary'; key: string }[] = [
  { grade: 'again', label: 'Otra vez', tone: 'danger', key: '1' },
  { grade: 'hard', label: 'Difícil', tone: 'warn', key: '2' },
  { grade: 'good', label: 'Bien', tone: 'ok', key: '3' },
  { grade: 'easy', label: 'Fácil', tone: 'primary', key: '4' },
];

function Session({ initial }: { initial: CardRecord[] }) {
  const [queue, setQueue] = useState(initial);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const card = queue[0];

  if (!card) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-2xl font-semibold">¡Listo!</p>
        <p className="text-slate-500">
          {done} tarjetas · {done ? Math.round((correct / done) * 100) : 0}% de aciertos
        </p>
        <Link to="/" className="inline-block rounded-2xl bg-sky-600 px-6 py-3 font-semibold text-white">Volver</Link>
      </div>
    );
  }

  const onAnswer = async (grade: Grade, ok: boolean, extra: { given?: string; expected?: string }, durationMs: number) => {
    await answerCard(db, card, { grade, correct: ok, durationMs, ...extra });
    setDone((n) => n + 1);
    if (ok) setCorrect((n) => n + 1);
    // "Otra vez" vuelve al final de la cola de esta sesión.
    setQueue((q) => (grade === 'again' ? [...q.slice(1), card] : q.slice(1)));
  };

  return (
    <div className="flex h-full flex-col pb-4">
      <div className="mb-2 flex justify-between text-sm text-slate-500">
        <Link to="/">← Salir</Link>
        <span>{queue.length} restantes</span>
      </div>
      {card.cardType === 'ru-es' ? (
        <FlipCard key={card.id + done} card={card} onAnswer={onAnswer} />
      ) : (
        <TypeCard key={card.id + done} card={card} onAnswer={onAnswer} />
      )}
    </div>
  );
}

type OnAnswer = (grade: Grade, ok: boolean, extra: { given?: string; expected?: string }, durationMs: number) => Promise<void>;

function GradeButtons({ card, grades, onPick }: { card: CardRecord; grades: Grade[]; onPick: (g: Grade) => void }) {
  const preview = previewIntervals(card.srs, Date.now());
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const g = GRADE_UI.find((x) => x.key === e.key && grades.includes(x.grade));
      if (g) onPick(g.grade);
      else if (e.key === 'Enter' && grades.includes('good')) onPick('good');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [grades, onPick]);
  return (
    <div className={`grid gap-2 ${grades.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {GRADE_UI.filter((g) => grades.includes(g.grade)).map((g) => (
        <Button key={g.grade} tone={g.tone} className="flex flex-col whitespace-nowrap !px-1 !text-sm" onClick={() => onPick(g.grade)}>
          {g.label}
          <span className="text-xs font-normal opacity-80">{formatInterval(preview[g.grade])}</span>
        </Button>
      ))}
    </div>
  );
}

function ExampleBlock({ itemId }: { itemId: string }) {
  const item = itemById.get(itemId);
  if (!item) return null;
  return (
    <div className="mt-6 space-y-1 text-center">
      <p className="text-sm text-slate-500">{item.detail}</p>
      <p className="text-lg">{item.example.ru}</p>
      <p className="text-sm text-slate-500">{item.example.es}</p>
    </div>
  );
}

/** ruso → español: ver, recordar, voltear y autocalificar. */
function FlipCard({ card, onAnswer }: { card: CardRecord; onAnswer: OnAnswer }) {
  const item = itemById.get(card.itemId)!;
  const [shown, setShown] = useState(false);
  const start = useRef(Date.now());
  useEffect(() => {
    if (shown) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setShown(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [shown]);
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="ru text-5xl" lang="ru">{item.ru}</p>
        {shown && (
          <>
            <p className="mt-4 text-2xl text-sky-500">{item.es.join(', ')}</p>
            <ExampleBlock itemId={item.id} />
          </>
        )}
      </div>
      {shown ? (
        <GradeButtons card={card} grades={['again', 'hard', 'good', 'easy']} onPick={(g) => void onAnswer(g, g !== 'again', {}, Date.now() - start.current)} />
      ) : (
        <Button className="w-full" onClick={() => setShown(true)}>Mostrar respuesta</Button>
      )}
    </>
  );
}

/** español → ruso: escribir la palabra. Si falla, calificación automática "Otra vez". */
function TypeCard({ card, onAnswer }: { card: CardRecord; onAnswer: OnAnswer }) {
  const item = itemById.get(card.itemId)!;
  const [text, setText] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const start = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const elapsed = () => Date.now() - start.current;

  useEffect(() => {
    if (!result) inputRef.current?.focus();
  }, [result]);

  useEffect(() => {
    if (!result || result.correct) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') void onAnswer('again', false, { given: text, expected: result.expected }, elapsed());
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const submit = () => {
    if (!text.trim()) return;
    setResult(checkRu(text, [item.ru]));
  };

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-4xl font-semibold">{item.es.join(', ')}</p>
        <p className="mt-2 text-sm text-slate-500">Escríbelo en ruso (el acento es opcional)</p>
        <input
          ref={inputRef}
          value={text}
          readOnly={!!result}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !result && submit()}
          lang="ru"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          className="ru mt-6 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center dark:border-slate-700 dark:bg-slate-800"
        />
        {result && (
          <div className="mt-4 space-y-2">
            {!result.correct && <p className="text-lg">{result.diff.map((p, i) => <DiffSpan key={i} part={p} />)}</p>}
            <p className={`ru ${result.correct ? 'text-emerald-500' : 'text-rose-500'}`} lang="ru">{result.expected}</p>
            <ExampleBlock itemId={item.id} />
          </div>
        )}
      </div>
      {!result ? (
        <Button className="w-full" onClick={submit} disabled={!text.trim()}>Comprobar</Button>
      ) : result.correct ? (
        <GradeButtons card={card} grades={['hard', 'good', 'easy']} onPick={(g) => void onAnswer(g, true, { given: text, expected: result.expected }, elapsed())} />
      ) : (
        <Button className="w-full" tone="danger" onClick={() => void onAnswer('again', false, { given: text, expected: result.expected }, elapsed())}>
          Continuar
        </Button>
      )}
    </>
  );
}

function DiffSpan({ part }: { part: CheckResult['diff'][number] }) {
  if (part.kind === 'same') return <span>{part.text}</span>;
  if (part.kind === 'extra') return <span className="bg-rose-500/30 line-through">{part.text}</span>;
  return <span className="bg-emerald-500/30 underline">{part.text}</span>;
}
