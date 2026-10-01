import { useRegisterSW } from 'virtual:pwa-register/react';

/** Aviso "Nueva versión disponible — recargar" cuando el service worker detecta una actualización. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Busca actualizaciones cada hora mientras la app está abierta.
      if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000);
    },
  });
  if (!needRefresh) return null;
  return (
    <div className="safe-pt fixed inset-x-0 top-0 z-50 mx-auto max-w-xl px-4">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-600 px-4 py-3 text-white shadow-lg">
        <span className="text-sm">Nueva versión disponible</span>
        <button className="rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold" onClick={() => void updateServiceWorker(true)}>
          Recargar
        </button>
      </div>
    </div>
  );
}
