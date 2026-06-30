# Guía de contribución — Red de Acopio

¡Gracias por aportar a un proyecto con impacto humanitario! Esta guía explica la
arquitectura y cómo extender la app sin romper nada.

## Principios

1. **Los datos primero, con honestidad.** Nunca agregues centros inventados. Si
   un dato no está confirmado, su `status` debe ser `sin_verificar` y debe citar
   su `source`. La gente toma decisiones reales con esta información.
2. **Modular y desacoplado.** La UI no sabe qué base de datos hay debajo ni qué
   proveedor de mapa se usa. Respeta esas fronteras.
3. **Mobile-first y accesible.** La mayoría de usuarios entra desde el celular,
   a veces con conexión pobre. Cuida el peso, el contraste y los *touch targets*.

## Arquitectura en una frase

> La app habla con los datos **solo** a través de `CenterRepository`
> (`lib/db/`) y con el mapa **solo** a través de `<MapView/>` (`components/map/`).
> Todo lo demás se construye encima de esos dos contratos y de los tipos en
> `lib/types.ts`.

### Contratos centrales (`lib/`)

| Archivo | Responsabilidad | ¿Tocar? |
|---------|-----------------|---------|
| `lib/types.ts` | Tipos compartidos (`Center`, `CenterInput`, `MapViewProps`...). | Solo para agregar campos a un centro. |
| `lib/constants.ts` | Etiquetas de materiales/estados, centro del mapa. | Para nuevas categorías de material. |
| `lib/geo.ts` | Distancias y ordenamiento. | Rara vez. |
| `lib/validation.ts` | Esquema `zod` compartido cliente/servidor. | Si cambian las reglas del formulario. |
| `lib/db/repository.ts` | La interfaz `CenterRepository`. | Solo para ampliar el contrato de datos. |

> ⚠️ Cambiar un contrato impacta a toda la app. Hazlo de forma deliberada y
> actualiza todas las implementaciones.

## Cómo agregar… (recetas)

### …una nueva categoría de material
1. Añádela a `MATERIAL_CATEGORIES` en `lib/types.ts`.
2. Agrega su etiqueta en `MATERIAL_LABELS` y su emoji en `MATERIAL_EMOJI`
   (`lib/constants.ts`).
3. Listo: el formulario, los chips y los filtros la toman automáticamente.

### …un nuevo backend de base de datos (p. ej. Firestore o Supabase)
1. Crea `lib/db/firestoreStore.ts` con `class FirestoreStore implements CenterRepository`.
2. Regístralo en `lib/db/index.ts` dentro de `getRepository()` según la variable
   de entorno que lo active.
3. No tocas ni la API ni la UI.

### …un nuevo proveedor de mapa
1. Crea `components/map/MiMapa.tsx` que reciba las mismas props que `LeafletMap`.
2. Intégralo en `components/map/MapView.tsx` / `useMapProvider.ts`.
3. La UI sigue usando `<MapView/>` sin cambios.

### …filtros avanzados
- El componente `components/FilterBar.tsx` y el estado en `components/HomeView.tsx`
  son el punto de extensión. Agrega el control y la condición de filtrado allí.

### …notificaciones (push / email)
- Sugerido: un endpoint en `app/api/` que dispare la notificación al crear un
  centro (en `POST /api/centers`) o vía un *cron* de Vercel. Mantén la lógica de
  envío en `lib/notifications/`.

### …integración con WhatsApp para reportes
- Crea `app/api/whatsapp/route.ts` como *webhook* y reutiliza
  `centerInputSchema` (`lib/validation.ts`) para validar el mensaje entrante.
  Convierte el payload a `CenterInput` y llama `getRepository().create(...)`.

### …analítica de centros más usados
- Agrega un endpoint `app/api/centers/[id]/visit/route.ts` que registre la
  visita, y una columna/contador en el store. Expón un ranking en una nueva ruta.

### …una nueva fuente para el scraper
1. Copia `scripts/sources/_template.ts` a `scripts/sources/mi-fuente.ts`.
2. Implementa `run()` devolviendo `RawCenter[]` (usa `cheerio` sobre el HTML).
3. Regístrala en `scripts/sources/index.ts`.
4. Corre `npm run scrape` y revisa `data/scraped/curados.json`.

## Fronteras de archivos (para evitar choques)

| Módulo | Carpeta |
|--------|---------|
| Mapa | `components/map/` |
| UI / páginas | `app/`, `components/*` (excepto `map/`) |
| Backend / datos | `lib/db/`, `app/api/` |
| Scraper | `scripts/`, `data/scraped/`, `docs/fuentes.md` |
| Contratos | `lib/types.ts`, `lib/constants.ts`, `lib/geo.ts`, `lib/validation.ts`, `lib/db/repository.ts` |

## Estilo de código

- **TypeScript estricto.** Tipa todo; evita `any`.
- **Comentarios y textos de UI en español**, con tildes y signos correctos.
- Antes de abrir un PR:
  ```bash
  npm run lint
  npx tsc --noEmit
  npm run build
  ```

## Proceso de PR

1. Crea una rama descriptiva (`feat/filtros-avanzados`, `fix/geolocalizacion-ios`).
2. Cambios pequeños y enfocados; describe el *qué* y el *porqué*.
3. Si tocas datos de centros, indica la fuente y el estado de verificación.
4. ¡Gracias! 🙌
