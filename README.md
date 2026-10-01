# Ruso diario

PWA personal para practicar ruso ~30 min al día (A2 → B1) con repetición espaciada (FSRS).
Local-first: todo vive en IndexedDB y funciona sin conexión. (Sincronización con Supabase: fase 2.)

> El `index.html` original del repo (app "Roadmap") está en `legacy-roadmap/`.

## Estado: Fase 1
Instalable en iPhone, modelo de datos local, seed pequeño (51 palabras, 16 verbos), clasificación inicial,
tarjetas de vocabulario con FSRS (ru→es voltear, es→ru escribiendo) y progreso básico.

## Cómo correrla
```bash
npm install
npm run dev            # desarrollo en http://localhost:5173
npm test               # Vitest (SRS, evaluación de respuestas, stats, repositorio)
npm run validate-data  # valida data/*.json (Zod, duplicados, pares de aspecto, acentos)
npm run typecheck
npm run build && npm run preview   # build de producción con service worker (http://localhost:4173)
```
El service worker solo se genera en el build de producción: para probar offline/instalación usa `build` + `preview`.

## Deploy en Vercel
1. Entra en <https://vercel.com> e inicia sesión con GitHub.
2. **Add New → Project** y elige el repo `lumeria-roadmap`.
3. En *Production Branch* usa `claude/russian-practice-pwa-okbh23` (o `main` cuando lo fusiones). Vercel detecta Vite solo:
   Build `npm run build`, Output `dist`.
4. **Deploy**. Cada push vuelve a desplegar y la app mostrará "Nueva versión disponible" con **Recargar**.

(En Netlify: Build `npm run build`, Publish `dist`, y añade una regla de redirect `/* /index.html 200`.)

## Instalar en el iPhone
1. Abre la URL de Vercel en **Safari** (tiene que ser Safari).
2. Botón Compartir → **Añadir a pantalla de inicio**.
3. Ábrela desde el icono: se ve en modo standalone, sin barra de Safari.

## Cómo agregar contenido
Edita `data/words.json` y `data/verbs.json` y corre `npm run validate-data`.
- Escribe el acento con el carácter combinante (`молоко́`) y todas las formas conjugadas a mano: no se generan por reglas.
- Todo entra con `"verified": false`.
- El validador falla si hay campos vacíos, duplicados, pares de aspecto que no se apuntan entre sí o palabras de varias sílabas sin acento.

Iconos y splash: `npm run generate-assets` (regenera `public/` y los `<link>` de `index.html`).

## Estructura
```
data/                contenido (JSON) · src/content/  esquemas Zod + carga
src/domain/          lógica pura con tests: srs/ evaluate/ stats/
src/db/              Dexie (schema.ts) y operaciones (repo.ts)
src/ui/              pantallas y componentes
```

## Prueba manual en el iPhone (Fase 1)
- [ ] Se instala desde Safari y abre en standalone con icono y splash propios.
- [ ] El contenido respeta notch y barra inferior; los inputs no hacen zoom al enfocarlos.
- [ ] Clasificar: marcar "Ya la sé" en algunas y guardar; las demás aparecen como nuevas.
- [ ] Repaso: voltear y calificar; escribir en ruso con el teclado ruso (con y sin acento, con е por ё).
- [ ] Un error muestra la diferencia resaltada y la forma correcta con acento.
- [ ] Modo avión: la app abre y se puede repasar.
- [ ] Cierra y reabre la app: el progreso sigue ahí.
- [ ] Tras un nuevo deploy aparece "Nueva versión disponible" y Recargar actualiza.
