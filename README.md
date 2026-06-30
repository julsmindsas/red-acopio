# Red de Acopio 🧭🤝

Aplicación web **mobile-first** para mapear **centros de acopio de ayuda humanitaria** y ayudar a la gente a encontrar el punto de donación más cercano. Pensada inicialmente para coordinar donaciones en **Medellín, Colombia** (apoyo a afectados por los terremotos en Venezuela), pero **genérica y reutilizable** para cualquier ciudad o emergencia.

> **⚠️ Nota de responsabilidad sobre los datos**
> Esta es una herramienta humanitaria real. Una dirección o teléfono equivocados envían personas a lugares equivocados. Por eso:
> - Cada centro tiene un **estado de verificación** (`verificado`, `sin_verificar`, `reportado`) que la interfaz muestra siempre.
> - Los datos de ejemplo y los scrapeados se marcan como **`sin_verificar`** con un aviso explícito de confirmar antes de acudir.
> - El proyecto **no inventa** centros: el scraper solo registra lo hallado en fuentes públicas, citando la URL de origen (ver [`docs/fuentes.md`](docs/fuentes.md)).

---

## ✨ Funcionalidades

- 📍 **Geolocalización** del usuario (con manejo de permisos y *fallback* al centro de Medellín).
- 🗺️ **Mapa interactivo** con pines de centros cercanos, usando **Leaflet + OpenStreetMap**.
- 🔁 **Fallback automático a Google Maps** si los *tiles* de OSM fallan al cargar (requiere API key opcional).
- 📏 **Ordenamiento por distancia** (fórmula de Haversine) al usuario.
- 🏷️ Para cada centro: **nombre, dirección, teléfono, materiales que acepta, horario y distancia**, con acciones "Llamar" y "Cómo llegar".
- 📝 **Formulario de reporte ciudadano** con validación (cliente + servidor) compartida vía `zod`.
- 🗃️ **Base de datos simple e intercambiable** (JSON local en desarrollo, Postgres/Neon en producción).
- 🌐 **Scraper modular** de fuentes públicas de coordinación humanitaria.

---

## 🧱 Stack

| Capa | Tecnología |
|------|------------|
| Framework | **Next.js 16** (App Router) + **React 19** + **TypeScript** |
| Estilos | **Tailwind CSS v4** (mobile-first) |
| Mapa | **Leaflet** + OpenStreetMap, con *fallback* a **Google Maps** |
| Validación | **zod** (esquema compartido cliente/servidor) |
| Base de datos | **JSON local** (dev) · **Postgres/Neon** (prod) — patrón *Repository* intercambiable |
| Scraping | **cheerio** + `fetch`, geocodificación con Nominatim (OSM) |
| Deploy | **Vercel** |

---

## 📁 Estructura del proyecto

```
red-acopio/
├── app/
│   ├── layout.tsx              # Layout raíz (es, metadata, viewport mobile)
│   ├── page.tsx                # Home (Server Component): carga centros y renderiza HomeView
│   ├── reportar/page.tsx       # Página del formulario de reporte
│   ├── globals.css             # Tema Tailwind v4 (paleta humanitaria)
│   └── api/
│       └── centers/
│           ├── route.ts        # GET (lista) y POST (crear) centros
│           └── [id]/route.ts   # GET centro por id
├── components/
│   ├── HomeView.tsx            # Orquesta mapa + lista + geolocalización + filtros (cliente)
│   ├── CenterList.tsx          # Lista de centros ordenados por distancia
│   ├── CenterCard.tsx          # Tarjeta de un centro
│   ├── ReportForm.tsx          # Formulario de reporte con validación
│   ├── FilterBar.tsx           # Filtros (material/estado) — punto de extensión
│   ├── Header.tsx              # Encabezado
│   └── map/                    # MÓDULO DE MAPA (proveedor intercambiable)
│       ├── MapView.tsx         # Componente público: Leaflet con fallback a Google
│       ├── LeafletMap.tsx      # Implementación Leaflet + OSM
│       ├── GoogleMap.tsx       # Implementación Google Maps
│       └── useMapProvider.ts   # Hook que decide el proveedor
├── lib/
│   ├── types.ts                # Contratos: Center, CenterInput, MapViewProps, etc.
│   ├── constants.ts            # MEDELLIN_CENTER, etiquetas de materiales/estados
│   ├── geo.ts                  # Haversine, ordenar por distancia, formatear
│   ├── validation.ts           # Esquema zod compartido
│   └── db/
│       ├── repository.ts       # Interfaz CenterRepository (el "contrato" de datos)
│       ├── jsonStore.ts        # Implementación con archivo JSON (desarrollo)
│       ├── postgresStore.ts    # Implementación con Postgres/Neon (producción)
│       └── index.ts            # getRepository(): elige el store según el entorno
├── scripts/
│   ├── scrape.ts               # Orquestador del scraper (npm run scrape)
│   ├── seed-db.ts              # Siembra Postgres desde la semilla (npm run seed)
│   └── sources/                # Adaptadores de fuentes (pluggable)
├── data/
│   ├── centers.seed.json       # Semilla versionada (datos de ejemplo/curados)
│   ├── centers.local.json      # Store local mutable (git-ignored)
│   └── scraped/                # Salida cruda del scraper (git-ignored)
├── docs/
│   └── fuentes.md              # Fuentes consultadas por el scraper (transparencia)
└── .env.example                # Variables de entorno
```

> **Arquitectura modular:** la app habla con la base de datos solo a través de `CenterRepository`, y con el mapa solo a través de `<MapView/>`. Cambiar de Postgres a Firestore, o de Leaflet a otro mapa, no toca la UI. Ver [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🚀 Puesta en marcha (local)

Requisitos: **Node.js 20+** y npm.

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar en desarrollo (¡no requiere configurar nada!)
npm run dev
```

Abre **http://localhost:3000**. Sin variables de entorno, la app usa el **store JSON local** (`data/centers.local.json`, sembrado automáticamente desde `data/centers.seed.json`). Perfecto para desarrollar sin base de datos.

### Variables de entorno (opcionales)

Copia `.env.example` a `.env.local` y completa lo que necesites:

| Variable | Para qué sirve |
|----------|----------------|
| `DATABASE_URL` / `POSTGRES_URL` | Conexión a Postgres/Neon. **Si está vacía, se usa el store JSON local.** |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | API key de Google Maps para el *fallback* del mapa. **Si está vacía, la app se queda en Leaflet/OSM** (no falla). |

---

## 🗄️ Base de datos (producción)

En **Vercel** el sistema de archivos es efímero, así que el store JSON **no** sirve para producción: usa **Postgres**.

1. Crea una base Postgres (la integración **Neon** del Marketplace de Vercel inyecta `DATABASE_URL` automáticamente).
2. Define `DATABASE_URL` (o `POSTGRES_URL`) en las variables de entorno del proyecto.
3. Siembra los datos iniciales:

```bash
npm run seed   # crea la tabla y carga data/centers.seed.json (upsert por id)
```

El selector de store vive en `lib/db/index.ts`: si detecta `DATABASE_URL`/`POSTGRES_URL` usa Postgres; si no, JSON local.

---

## 🌐 Scraper de fuentes públicas

```bash
npm run scrape   # ejecuta los adaptadores de scripts/sources/ y genera data/scraped/curados.json
```

- Las fuentes son **adaptadores intercambiables** en `scripts/sources/`. Para añadir una, copia `scripts/sources/_template.ts`.
- Cada centro scrapeado se guarda con su **URL de origen** y estado `sin_verificar`.
- La transparencia sobre qué se halló (y qué no) está en [`docs/fuentes.md`](docs/fuentes.md).
- Los datos curados se integran a `data/centers.seed.json` tras revisión humana.

---

## ☁️ Despliegue en Vercel

```bash
npm i -g vercel        # si no lo tienes
vercel login
vercel                 # despliegue de previsualización
vercel --prod          # despliegue a producción
```

Recuerda configurar `DATABASE_URL` y (opcional) `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en el panel del proyecto, y correr `npm run seed` una vez.

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Lee **[CONTRIBUTING.md](CONTRIBUTING.md)** para la arquitectura, las fronteras entre módulos y los puntos de extensión sugeridos (filtros avanzados, notificaciones, integración con WhatsApp, analítica de centros más usados).

## 📄 Licencia

MIT. Úsalo, adáptalo y compártelo para cualquier causa humanitaria.
