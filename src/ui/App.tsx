import { NavLink, Route, Routes } from 'react-router-dom';
import { ClassifyScreen } from './screens/ClassifyScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { UpdatePrompt } from './components/UpdatePrompt';

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex-1 py-3 text-center text-sm font-medium ${isActive ? 'text-sky-500' : 'text-slate-500'}`;

export function App() {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col">
      <UpdatePrompt />
      <main className="safe-pt flex-1 overflow-y-auto px-4">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/classify" element={<ClassifyScreen />} />
          <Route path="/review" element={<ReviewScreen />} />
          <Route path="/progress" element={<ProgressScreen />} />
        </Routes>
      </main>
      <nav className="safe-pb flex border-t border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <NavLink to="/" end className={tab}>Inicio</NavLink>
        <NavLink to="/classify" className={tab}>Clasificar</NavLink>
        <NavLink to="/progress" className={tab}>Progreso</NavLink>
      </nav>
    </div>
  );
}
