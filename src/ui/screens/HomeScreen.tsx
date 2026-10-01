import { Link } from 'react-router-dom';
import { useHomeData } from '../hooks';

export function HomeScreen() {
  const data = useHomeData();
  if (!data) return null;
  const total = data.dueCount + data.freshCount;
  return (
    <div className="space-y-4 pb-6">
      <h1 className="text-2xl font-bold">Ruso diario</h1>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Racha" value={`${data.streak} ${data.streak === 1 ? 'día' : 'días'}`} />
        <Stat label="Hoy" value={data.practicedToday ? 'Practicado ✓' : 'Pendiente'} />
        <Stat label="Para repasar" value={String(data.dueCount)} />
        <Stat label="Nuevas hoy" value={String(data.freshCount)} />
      </div>
      {!data.classified ? (
        <Link to="/classify" className="block rounded-2xl bg-sky-600 p-5 text-center text-lg font-semibold text-white">
          Empezar: clasifica lo que ya sabes
        </Link>
      ) : total > 0 ? (
        <Link to="/review" className="block rounded-2xl bg-sky-600 p-5 text-center text-lg font-semibold text-white">
          Repasar ({total})
        </Link>
      ) : (
        <p className="rounded-2xl bg-emerald-600/10 p-5 text-center text-emerald-600">No hay nada pendiente por ahora 🎉</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
