import type { Metadata } from "next";
import Header from "@/components/Header";
import Badge from "@/components/apidocs/Badge";
import CodeBlock from "@/components/apidocs/CodeBlock";
import CodeTabs from "@/components/apidocs/CodeTabs";
import EndpointRow from "@/components/apidocs/EndpointRow";
import ScalarEmbed from "@/components/apidocs/ScalarEmbed";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_EMOJI,
  MATERIAL_LABELS,
  STATUS_META,
  VERIFICATION_STATUSES,
} from "@/lib/constants";

/*
 * Página de documentación de la API pública de Red de Acopio.
 * -------------------------------------------------------------------------
 * Server Component que compone secciones estáticas + componentes cliente
 * (bloques con copiar, pestañas, visor OpenAPI). Pensada para desarrolladores:
 * clara, técnica y coherente con la identidad esmeralda de la app.
 *
 * Reglas del proyecto: este código solo vive en app/api-docs/** y
 * components/apidocs/**. La API la implementa otro módulo; aquí solo la
 * documentamos contra su contrato.
 */

// --- Constantes de presentación --------------------------------------------

const REPO_URL = "https://github.com/julsmindsas/red-acopio";
const SPEC_URL = "/api/openapi.json";
const BASE_URL = "https://red-acopio-two.vercel.app";
const API_PREFIX = `${BASE_URL}/api/v1`;

export const metadata: Metadata = {
  title: "API de Red de Acopio — Documentación para desarrolladores",
  description:
    "API REST pública, gratuita y abierta de centros de acopio en Colombia. OpenAPI 3.1, CORS habilitado, licencia MIT. Datos comunitarios con atribución a acopiove.org.",
};

// --- Ejemplos de código (Inicio rápido) ------------------------------------

const QUICKSTART_SAMPLES = [
  {
    id: "curl",
    label: "cURL",
    lang: "bash",
    code: `# Listar todos los centros de acopio (JSON)
curl ${API_PREFIX}/centers`,
  },
  {
    id: "fetch",
    label: "JavaScript",
    lang: "javascript",
    code: `// Centros verificados en Medellín
const res = await fetch(
  "${API_PREFIX}/centers?city=Medellín&status=verificado"
);
const { attribution, total, items } = await res.json();

console.log(\`\${total} centros · \${attribution}\`);
for (const centro of items) {
  console.log(centro.name, "—", centro.address);
}`,
  },
  {
    id: "filtro",
    label: "Filtros",
    lang: "bash",
    code: `# Combina filtros: solo fuente oficial que reciba alimentos
curl "${API_PREFIX}/centers?source=official&material=alimentos"

# Búsqueda de texto libre (nombre, dirección, notas…)
curl "${API_PREFIX}/centers?q=cruz%20roja"`,
  },
];

// Respuesta de ejemplo del listado, para que se vea la forma del JSON.
const LIST_RESPONSE_SAMPLE = `{
  "attribution": "Datos de centros oficiales por acopiove.org",
  "total": 128,
  "items": [
    {
      "id": "acopio-42",
      "name": "Parroquia San José",
      "address": "Cra. 50 #45-12, La Candelaria",
      "phone": "+57 604 000 0000",
      "materials": ["alimentos", "agua", "aseo"],
      "schedule": "Lun-Sáb 8:00am - 6:00pm",
      "lat": 6.2476,
      "lng": -75.5658,
      "city": "Medellín",
      "country": "Colombia",
      "notes": "Fuente: acopiove.org",
      "source": "acopiove.org",
      "status": "verificado",
      "readOnly": true,
      "createdAt": "2025-06-29T18:00:00.000Z",
      "updatedAt": "2025-06-29T18:00:00.000Z"
    }
  ]
}`;

// Ejemplo de creación (POST) de un centro reportado por la ciudadanía.
const POST_SAMPLE = `curl -X POST ${API_PREFIX}/centers \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Colegio San Ignacio",
    "address": "Cra. 43 #16-90, El Poblado",
    "phone": "+57 300 000 0000",
    "materials": ["alimentos", "cobijas"],
    "schedule": "Lun-Vie 7:00am - 4:00pm",
    "lat": 6.2105,
    "lng": -75.5680,
    "notes": "Entrada por la portería principal"
  }'`;

// Documentación del modelo Center (refleja lib/types.ts). Estática a propósito.
const CENTER_FIELDS: { name: string; type: string; desc: string }[] = [
  { name: "id", type: "string", desc: "Identificador único del centro." },
  { name: "name", type: "string", desc: "Nombre del centro de acopio." },
  { name: "address", type: "string", desc: "Dirección legible." },
  { name: "phone", type: "string | null", desc: "Teléfono de contacto." },
  {
    name: "materials",
    type: "string[]",
    desc: "Categorías de material que recibe (ver tabla de valores).",
  },
  { name: "schedule", type: "string", desc: "Horario en texto libre." },
  { name: "lat", type: "number", desc: "Latitud (grados decimales)." },
  { name: "lng", type: "number", desc: "Longitud (grados decimales)." },
  { name: "city", type: "string | null", desc: "Ciudad o municipio." },
  { name: "country", type: "string | null", desc: "País (por defecto Colombia)." },
  { name: "notes", type: "string | null", desc: "Notas o aclaraciones." },
  {
    name: "source",
    type: "string | null",
    desc: "Origen del dato: acopiove.org, reporte-ciudadano, etc.",
  },
  {
    name: "status",
    type: "enum",
    desc: "verificado · sin_verificar · reportado.",
  },
  {
    name: "readOnly",
    type: "boolean",
    desc: "true si proviene de una fuente externa de solo lectura.",
  },
  { name: "createdAt", type: "string", desc: "Fecha de creación (ISO 8601)." },
  { name: "updatedAt", type: "string", desc: "Última actualización (ISO 8601)." },
];

// Enlaces de la sub-navegación interna (anclas dentro de la página).
const SECTION_LINKS = [
  { href: "#introduccion", label: "Introducción" },
  { href: "#inicio-rapido", label: "Inicio rápido" },
  { href: "#endpoints", label: "Endpoints" },
  { href: "#modelo", label: "Modelo de datos" },
  { href: "#referencia", label: "Referencia" },
];

export default function ApiDocsPage() {
  return (
    <>
      <Header variant="home" />

      <main className="flex-1">
        {/* ============================ HERO ============================ */}
        <section className="relative overflow-hidden bg-brand-900 text-white">
          {/* Malla de gradiente y "blobs" decorativos para dar profundidad */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-brand-400/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 right-0 size-80 rounded-full bg-accent-500/20 blur-3xl"
          />

          <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-50 ring-1 ring-inset ring-white/20 backdrop-blur">
                <span aria-hidden="true">●</span> API pública v1
              </span>
            </div>

            <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              API de Red de Acopio
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-brand-50/85 sm:text-lg">
              Una API REST gratuita y abierta para construir sobre la red de
              centros de acopio de Colombia. Integra los datos en tu app, bot o
              panel y ayuda a que la ayuda humanitaria llegue más lejos.
            </p>

            {/* Badges informativos (estilo "glass" sobre el hero) */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: "📘", label: "OpenAPI 3.1" },
                { icon: "🌐", label: "CORS habilitado" },
                { icon: "⚖️", label: "Licencia MIT" },
                { icon: "🆓", label: "Sin API key" },
              ].map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur"
                >
                  <span aria-hidden="true">{b.icon}</span>
                  {b.label}
                </span>
              ))}
            </div>

            {/* CTAs: repo + spec */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-brand-900 shadow-sm transition-transform hover:scale-[1.02]"
              >
                <span aria-hidden="true">★</span>
                Ver en GitHub
              </a>
              <a
                href={SPEC_URL}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 font-mono text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                <span aria-hidden="true">{"{ }"}</span>
                Spec OpenAPI
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            {/* Base URL destacada y copiable */}
            <div className="mt-8 max-w-xl">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-brand-100/70">
                Base URL
              </p>
              <code className="block overflow-x-auto rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-mono text-sm text-brand-50 backdrop-blur">
                {API_PREFIX}
              </code>
            </div>
          </div>
        </section>

        {/* ===================== SUB-NAVEGACIÓN ===================== */}
        <nav
          aria-label="Secciones de la documentación"
          className="sticky top-16 z-30 border-b border-border bg-surface/85 backdrop-blur-md"
        >
          <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECTION_LINKS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium text-foreground/65 transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
          {/* ===================== INTRODUCCIÓN ===================== */}
          <section id="introduccion" className="scroll-mt-28">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              ¿Qué es esta API?
            </h2>
            <div className="mt-4 grid gap-4 text-pretty leading-relaxed text-foreground/75 sm:text-lg">
              <p>
                <strong className="text-foreground">Red de Acopio</strong> es un
                proyecto comunitario y de código abierto que mapea centros de
                acopio activos para coordinar donaciones de ayuda humanitaria.
                Esta API expone esos datos para que cualquier persona los
                consuma e integre libremente.
              </p>
              <p>
                Los centros provienen de una{" "}
                <strong className="text-foreground">fuente híbrida</strong>: los
                datos oficiales y verificados son cortesía de{" "}
                <a
                  href="https://acopiove.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
                >
                  acopiove.org
                </a>
                , complementados con aportes locales reportados por la
                comunidad. Cada respuesta incluye un campo{" "}
                <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-sm text-brand-700">
                  attribution
                </code>{" "}
                con el crédito correspondiente.
              </p>
            </div>

            {/* Tarjetas de "ventajas" */}
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: "🆓",
                  title: "Gratis y abierta",
                  body: "Sin claves ni registro. Código bajo licencia MIT en GitHub.",
                },
                {
                  icon: "🌐",
                  title: "CORS habilitado",
                  body: "Consúmela directamente desde el navegador, sin proxy.",
                },
                {
                  icon: "🤝",
                  title: "Con atribución",
                  body: "Datos oficiales acreditados a acopiove.org en cada respuesta.",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className="rounded-2xl border border-border bg-surface p-5"
                >
                  <span aria-hidden="true" className="text-2xl">
                    {c.icon}
                  </span>
                  <h3 className="mt-2 font-semibold text-foreground">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-sm text-foreground/65">{c.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ===================== INICIO RÁPIDO ===================== */}
          <section id="inicio-rapido" className="mt-16 scroll-mt-28">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Inicio rápido
              </h2>
              <Badge tone="neutral">sin autenticación</Badge>
            </div>
            <p className="mt-3 max-w-2xl text-foreground/70">
              Haz tu primera petición en segundos. Todos los ejemplos apuntan a
              producción y devuelven JSON.
            </p>

            <div className="mt-6">
              <CodeTabs samples={QUICKSTART_SAMPLES} />
            </div>

            <h3 className="mt-8 text-lg font-semibold text-foreground">
              Respuesta del listado
            </h3>
            <p className="mt-1.5 text-sm text-foreground/65">
              El endpoint de listado responde con{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-brand-700">
                {"{ attribution, total, items }"}
              </code>
              . Cada elemento de{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-brand-700">
                items
              </code>{" "}
              es un objeto <em>Center</em>:
            </p>
            <div className="mt-3">
              <CodeBlock code={LIST_RESPONSE_SAMPLE} lang="json" label="200 OK · application/json" />
            </div>
          </section>

          {/* ===================== ENDPOINTS ===================== */}
          <section id="endpoints" className="mt-16 scroll-mt-28">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Endpoints
            </h2>
            <p className="mt-3 max-w-2xl text-foreground/70">
              Tres operaciones cubren la mayoría de los casos: listar, consultar
              uno y reportar uno nuevo. Las rutas cuelgan de{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-sm text-brand-700">
                /api/v1
              </code>
              .
            </p>

            <ul className="mt-6 grid gap-4">
              <EndpointRow
                method="GET"
                path="/api/v1/centers"
                description="Lista los centros de acopio. Acepta filtros opcionales por fuente, ciudad, material, estado y texto libre."
                params={[
                  {
                    name: "source",
                    type: "all | official | local",
                    description:
                      "Origen de los datos. Por defecto all (oficiales + locales).",
                  },
                  {
                    name: "city",
                    type: "string",
                    description: "Filtra por ciudad o municipio (ej. Medellín).",
                  },
                  {
                    name: "material",
                    type: "enum",
                    description:
                      "Categoría de material (alimentos, agua, ropa, medicamentos, aseo, bebes, cobijas, herramientas, otros).",
                  },
                  {
                    name: "status",
                    type: "enum",
                    description:
                      "Estado de verificación (verificado, sin_verificar, reportado).",
                  },
                  {
                    name: "q",
                    type: "string",
                    description:
                      "Búsqueda de texto libre sobre nombre, dirección y notas.",
                  },
                ]}
              />

              <EndpointRow
                method="GET"
                path="/api/v1/centers/{id}"
                description="Devuelve un único centro por su id. Responde 404 con { error } si no existe."
                params={[
                  {
                    name: "id",
                    type: "string",
                    required: true,
                    description: "Identificador del centro (parámetro de ruta).",
                  },
                ]}
              />

              <EndpointRow
                method="POST"
                path="/api/v1/centers"
                description="Reporta un nuevo centro (queda en estado reportado, pendiente de revisión). Responde 201 con el Center creado, o 400 con { error, fields } si la validación falla."
                params={[
                  {
                    name: "name",
                    type: "string",
                    required: true,
                    description: "Nombre del centro.",
                  },
                  {
                    name: "address",
                    type: "string",
                    required: true,
                    description: "Dirección legible.",
                  },
                  {
                    name: "phone",
                    type: "string?",
                    description: "Teléfono de contacto (opcional).",
                  },
                  {
                    name: "materials",
                    type: "string[]",
                    required: true,
                    description: "Categorías de material que recibe.",
                  },
                  {
                    name: "schedule",
                    type: "string",
                    required: true,
                    description: "Horario en texto libre.",
                  },
                  {
                    name: "lat",
                    type: "number",
                    required: true,
                    description: "Latitud (grados decimales).",
                  },
                  {
                    name: "lng",
                    type: "number",
                    required: true,
                    description: "Longitud (grados decimales).",
                  },
                  {
                    name: "notes",
                    type: "string?",
                    description: "Notas adicionales (opcional).",
                  },
                ]}
              />
            </ul>

            <h3 className="mt-8 text-lg font-semibold text-foreground">
              Ejemplo: reportar un centro
            </h3>
            <p className="mt-1.5 text-sm text-foreground/65">
              Envía un cuerpo JSON con los campos requeridos. El servidor asigna{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-brand-700">
                id
              </code>
              ,{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-brand-700">
                status
              </code>{" "}
              y las fechas.
            </p>
            <div className="mt-3">
              <CodeBlock code={POST_SAMPLE} lang="bash" label="POST · crear centro" />
            </div>
          </section>

          {/* ===================== MODELO DE DATOS ===================== */}
          <section id="modelo" className="mt-16 scroll-mt-28">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Modelo de datos
            </h2>
            <p className="mt-3 max-w-2xl text-foreground/70">
              El objeto <strong className="text-foreground">Center</strong> es la
              unidad central de la API. Estos son sus campos:
            </p>

            {/* Tabla del modelo: scroll horizontal en móvil */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/60">
                      <th className="px-4 py-3 font-semibold text-foreground/70">
                        Campo
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground/70">
                        Tipo
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground/70">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CENTER_FIELDS.map((f) => (
                      <tr
                        key={f.name}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 align-top">
                          <code className="font-mono text-[13px] font-semibold text-brand-700">
                            {f.name}
                          </code>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 align-top font-mono text-[12px] text-foreground/55">
                          {f.type}
                        </td>
                        <td className="px-4 py-2.5 align-top text-foreground/70">
                          {f.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Valores de enums: materiales y estados (fuente de verdad: lib) */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Valores de <code className="font-mono text-base">material</code>
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {MATERIAL_CATEGORIES.map((m) => (
                    <li
                      key={m}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-600/15"
                      title={MATERIAL_LABELS[m]}
                    >
                      <span aria-hidden="true">{MATERIAL_EMOJI[m]}</span>
                      <code className="font-mono">{m}</code>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Valores de <code className="font-mono text-base">status</code>
                </h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {VERIFICATION_STATUSES.map((s) => (
                    <li key={s} className="flex items-start gap-2.5">
                      <code className="mt-0.5 shrink-0 rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground/80">
                        {s}
                      </code>
                      <span className="text-sm text-foreground/65">
                        {STATUS_META[s].description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ===================== REFERENCIA INTERACTIVA ===================== */}
          <section id="referencia" className="mt-16 scroll-mt-28">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Referencia interactiva
              </h2>
              <Badge tone="brand" icon="⚡">
                OpenAPI 3.1
              </Badge>
            </div>
            <p className="mt-3 max-w-2xl text-foreground/70">
              Explora cada endpoint, sus parámetros y esquemas, y prueba
              peticiones en vivo. La referencia se genera desde{" "}
              <a
                href={SPEC_URL}
                className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
              >
                openapi.json
              </a>
              .
            </p>

            <div className="mt-6">
              <ScalarEmbed />
            </div>
          </section>
        </div>

        {/* ===================== FOOTER ===================== */}
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-sm">
                <p className="flex items-center gap-2 text-base font-bold text-foreground">
                  <span aria-hidden="true">🤝</span> Red de Acopio
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                  Datos de centros oficiales por{" "}
                  <a
                    href="https://acopiove.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    acopiove.org
                  </a>
                  , complementados con reportes de la comunidad. Proyecto abierto
                  bajo licencia MIT.
                </p>
              </div>

              <nav aria-label="Enlaces del pie" className="flex flex-col gap-2 text-sm">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/70 transition-colors hover:text-brand-700"
                >
                  Repositorio en GitHub ↗
                </a>
                <a
                  href={SPEC_URL}
                  className="font-medium text-foreground/70 transition-colors hover:text-brand-700"
                >
                  Especificación OpenAPI ↗
                </a>
                <a
                  href="/"
                  className="font-medium text-foreground/70 transition-colors hover:text-brand-700"
                >
                  Volver a la app
                </a>
              </nav>
            </div>

            <p className="mt-8 border-t border-border pt-6 text-xs text-foreground/45">
              Hecho con cuidado para la comunidad. Verifica siempre el estado de
              un centro antes de acudir.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
