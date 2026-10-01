import { useLiveQuery } from 'dexie-react-hooks';
import { itemById } from '../../content/content';
import { db } from '../../db/schema';
import { accuracy, countCards, dayKey, minutesByDay } from '../../domain/stats/stats';

const AREAS = { vocab: 'Vocabulario', verbs: 'Verbos' } as const;

export function ProgressScreen() {
  const data = useLiveQuery(async () => {
    const [cards, logs] = await Promise.all([db.cards.toArray(), db.reviewLogs.toArray()]);
    return { cards, logs };
  }, []);
  if (!data) return null;
  const { cards, logs } = data;

  const week = Date.now() - 7 * 86_400_000;
  const minutes = minutesByDay(logs);
  const weekMinutes = [...minutes].filter(([k]) => k >= dayKey(week)).reduce((n, [, m]) => n + m, 0);
  const todayMinutes = minutes.get(dayKey(Date.now())) ?? 0;

  const mistakes = new Map<string, number>();
  for (const l of logs) if (!l.correct) mistakes.set(l.itemId, (mistakes.get(l.itemId) ?? 0) + 1);
  const top = [...mistakes].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="space-y-5 pb-6">
      <h1 className="text-2xl font-bold">Progreso</h1>
      <div className="grid grid-cols-2 gap-3">
        <Card label="Minutos hoy" value={todayMinutes.toFixed(0)} />
        <Card label="Minutos (7 días)" value={weekMinutes.toFixed(0)} />
      </div>
      <section className="space-y-2">
        <h2 className="font-semibold">Por área</h2>
        {(Object.keys(AREAS) as (keyof typeof AREAS)[]).map((a) => {
          const acc = accuracy(logs.filter((l) => l.area === a));
          const c = countCards(cards.filter((x) => x.area === a).map((x) => x.srs));
          return (
            <div key={a} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
              <div className="flex justify-between font-medium">
                <span>{AREAS[a]}</span>
                <span>{acc === null ? '—' : `${Math.round(acc * 100)}%`}</span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {c.mature} maduras · {c.learning} aprendiendo · {c.new} nuevas
              </div>
            </div>
          );
        })}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Errores frecuentes</h2>
        {top.length === 0 && <p className="text-sm text-slate-500">Aún no hay errores registrados.</p>}
        {top.map(([id, n]) => (
          <div key={id} className="flex justify-between rounded-xl bg-white p-3 dark:bg-slate-800">
            <span className="text-lg" lang="ru">{itemById.get(id)?.ru ?? id}</span>
            <span className="text-slate-500">{n}×</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
