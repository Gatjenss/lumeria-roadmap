import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { itemById, items, type StudyItem } from '../../content/content';
import { classifiedItemIds, classifyItem } from '../../db/repo';
import { db } from '../../db/schema';
import { Button } from '../components/Button';

const BATCH = 10;

/** Modo de clasificación inicial: lotes de ítems A1 para marcar "ya la sé" o "practicar". */
export function ClassifyScreen() {
  const done = useLiveQuery(() => classifiedItemIds(db), []);
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  if (!done) return null;

  const pending = items.filter((i) => i.level === 'A1' && !done.has(i.id)).sort((a, b) => a.freq - b.freq);
  const batch = pending.slice(0, BATCH);

  if (batch.length === 0) {
    return <p className="py-10 text-center text-slate-500">No quedan palabras A1 por clasificar. 🎉</p>;
  }

  const save = async () => {
    for (const it of batch) await classifyItem(db, it.id, it.kind, marks[it.id] ?? false);
    setMarks({});
  };
  const markAll = (known: boolean) => setMarks(Object.fromEntries(batch.map((i) => [i.id, known])));

  return (
    <div className="space-y-3 pb-6">
      <h1 className="text-2xl font-bold">Clasificar A1</h1>
      <p className="text-sm text-slate-500">
        Marca las que ya sabes; entran con intervalos largos. Las demás entran como nuevas. Quedan {pending.length}.
      </p>
      <div className="flex gap-2">
        <button className="text-sm text-sky-500" onClick={() => markAll(true)}>Todas las sé</button>
        <button className="text-sm text-sky-500" onClick={() => markAll(false)}>Ninguna</button>
      </div>
      <ul className="space-y-2">
        {batch.map((it) => (
          <Row key={it.id} item={it} known={marks[it.id] ?? false} onToggle={() => setMarks((m) => ({ ...m, [it.id]: !(m[it.id] ?? false) }))} />
        ))}
      </ul>
      <Button className="w-full" onClick={() => void save()}>Guardar y siguiente lote</Button>
    </div>
  );
}

function Row({ item, known, onToggle }: { item: StudyItem; known: boolean; onToggle: () => void }) {
  const es = itemById.get(item.id)?.es.join(', ');
  return (
    <li>
      <button
        onClick={onToggle}
        className={`flex w-full items-center justify-between rounded-2xl p-4 text-left ${known ? 'bg-emerald-600/15 ring-2 ring-emerald-600' : 'bg-white dark:bg-slate-800'}`}
      >
        <span>
          <span className="block text-2xl font-semibold">{item.ru}</span>
          <span className="block text-sm text-slate-500">{es}</span>
        </span>
        <span className={`text-sm font-semibold ${known ? 'text-emerald-600' : 'text-slate-400'}`}>{known ? 'Ya la sé' : 'Practicar'}</span>
      </button>
    </li>
  );
}
