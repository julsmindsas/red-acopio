import type { ReactNode } from "react";

/*
 * Fila/tarjeta de un endpoint de la API.
 * -------------------------------------------------------------------------
 * Mobile-first: en lugar de una tabla rígida (que se desborda en móvil), cada
 * endpoint es una tarjeta con su método, ruta y, opcionalmente, una lista de
 * parámetros. En escritorio la cuadrícula alinea método y ruta en una fila.
 */

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Color de la insignia según el verbo HTTP. */
const METHOD_STYLES: Record<Method, string> = {
  GET: "bg-emerald-100 text-emerald-800 ring-emerald-600/25",
  POST: "bg-amber-100 text-amber-800 ring-amber-600/25",
  PUT: "bg-sky-100 text-sky-800 ring-sky-600/25",
  PATCH: "bg-violet-100 text-violet-800 ring-violet-600/25",
  DELETE: "bg-red-100 text-red-800 ring-red-600/25",
};

export interface EndpointParam {
  name: string;
  type: string;
  description: ReactNode;
  /** `true` si es obligatorio (se marca con una etiqueta "requerido"). */
  required?: boolean;
}

export default function EndpointRow({
  method,
  path,
  description,
  params,
}: {
  method: Method;
  path: string;
  description: ReactNode;
  params?: EndpointParam[];
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-300 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex min-w-[3.5rem] justify-center rounded-md px-2 py-1 font-mono text-xs font-bold ring-1 ring-inset ${METHOD_STYLES[method]}`}
        >
          {method}
        </span>
        <code className="break-all font-mono text-sm font-semibold text-foreground">
          {path}
        </code>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-foreground/70">
        {description}
      </p>

      {params && params.length > 0 && (
        <dl className="mt-4 grid gap-2.5 border-t border-border pt-4">
          {params.map((p) => (
            <div
              key={p.name}
              className="grid gap-1 sm:grid-cols-[minmax(7rem,auto)_1fr] sm:gap-4"
            >
              <dt className="flex flex-wrap items-center gap-1.5">
                <code className="font-mono text-[13px] font-semibold text-brand-700">
                  {p.name}
                </code>
                <span className="font-mono text-[11px] text-foreground/45">
                  {p.type}
                </span>
                {p.required && (
                  <span className="rounded bg-accent-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-800">
                    requerido
                  </span>
                )}
              </dt>
              <dd className="text-sm text-foreground/65">{p.description}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}
