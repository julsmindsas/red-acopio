/**
 * Metadatos visuales y primitivas compartidas del panel de Hogares de Paso.
 * --------------------------------------------------------------------------
 * Centraliza aquí (y no en cada tarjeta) las etiquetas y colores de los
 * estados del dominio para que las cinco secciones del panel hablen el mismo
 * idioma visual. Las etiquetas de dominio "puras" (acepta/ofrece/convivencia)
 * viven en `lib/hogares/types.ts`; esto es solo la capa de presentación admin.
 */
import type {
  HogarDisponibilidad,
  HogarVerificacion,
  SeguimientoHito,
  SolicitudEstado,
} from "@/lib/hogares/types";

/* -------------------------------------------------------------------------- */
/* Estados con color                                                          */
/* -------------------------------------------------------------------------- */

export const VERIFICACION_META: Record<
  HogarVerificacion,
  { label: string; badge: string }
> = {
  pendiente: {
    label: "Por verificar",
    badge: "border-accent-200 bg-accent-50 text-accent-900",
  },
  verificado: {
    label: "Verificado",
    badge: "border-brand-300 bg-brand-50 text-brand-900",
  },
  rechazado: {
    label: "Rechazado",
    badge: "border-red-300 bg-red-50 text-red-800",
  },
};

export const DISPONIBILIDAD_META: Record<
  HogarDisponibilidad,
  { label: string; badge: string }
> = {
  disponible: {
    label: "Disponible",
    badge: "border-brand-300 bg-brand-50 text-brand-900",
  },
  ocupado: {
    label: "Ocupado",
    badge: "border-sky-300 bg-sky-50 text-sky-900",
  },
  pausado: {
    label: "En pausa",
    badge: "border-border bg-surface-muted text-foreground/70",
  },
};

export const ESTADO_META: Record<
  SolicitudEstado,
  { label: string; badge: string }
> = {
  nueva: {
    label: "Nueva",
    badge: "border-sky-300 bg-sky-50 text-sky-900",
  },
  en_proceso: {
    label: "En proceso",
    badge: "border-accent-200 bg-accent-50 text-accent-900",
  },
  emparejada: {
    label: "Emparejada",
    badge: "border-brand-300 bg-brand-50 text-brand-900",
  },
  hospedada: {
    label: "Hospedada",
    badge: "border-brand-300 bg-brand-50 text-brand-900",
  },
  cerrada: {
    label: "Cerrada",
    badge: "border-border bg-surface-muted text-foreground/60",
  },
};

/** Orden operativo de las solicitudes: primero lo que exige acción. */
export const ESTADO_ORDEN: SolicitudEstado[] = [
  "nueva",
  "en_proceso",
  "emparejada",
  "hospedada",
  "cerrada",
];

export const HITO_LABELS: Record<SeguimientoHito, string> = {
  "48h": "Llamada de 48 horas",
  "7d": "Control de 7 días",
  otro: "Llamada adicional",
};

/* -------------------------------------------------------------------------- */
/* Piezas pequeñas de UI                                                      */
/* -------------------------------------------------------------------------- */

/** Insignia genérica de estado (verificación, disponibilidad o solicitud). */
export function EstadoBadge({ label, badge }: { label: string; badge: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge}`}
    >
      {label}
    </span>
  );
}

/** Par término/valor para los bloques de datos (mismo look que PendingCard). */
export function Dato({
  term,
  children,
  wide = false,
}: {
  term: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
        {term}
      </dt>
      <dd className="text-sm text-foreground/85">{children}</dd>
    </div>
  );
}

/** Valor de texto que muestra “—” cuando falta. */
export function ValorOpcional({ value }: { value: string | null | undefined }) {
  return value && value.trim() !== "" ? (
    <>{value}</>
  ) : (
    <span className="text-foreground/40">—</span>
  );
}

/**
 * Teléfono como enlace `tel:`: el equipo opera desde el celular en terreno,
 * un toque debe bastar para llamar.
 */
export function TelefonoLink({ telefono }: { telefono: string }) {
  return (
    <a
      href={`tel:${telefono.replace(/[\s()-]/g, "")}`}
      className="font-semibold text-brand-700 underline underline-offset-2"
    >
      {telefono}
    </a>
  );
}

/** Fecha ISO → formato corto legible en es-CO ("14 ago, 3:20 p. m."). */
export function fmtFecha(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
