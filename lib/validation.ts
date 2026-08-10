/**
 * Esquemas de validación (zod) compartidos entre cliente y servidor.
 *
 * Validar con el mismo esquema en el formulario (cliente) y en la API (servidor)
 * evita duplicar reglas y garantiza coherencia. La API NUNCA debe confiar en la
 * validación del cliente: siempre re-valida con `centerInputSchema`.
 */
import { z } from "zod";
import { MATERIAL_CATEGORIES, POINT_KINDS } from "./types";

/**
 * Teléfono colombiano flexible: acepta fijos y celulares, con o sin indicativo,
 * espacios, guiones o paréntesis. Campo opcional.
 */
const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;

/**
 * Objeto base sin reglas condicionales.
 *
 * Se exporta porque `centerInputSchema` lleva un `superRefine` encima y los
 * `ZodEffects` no admiten `.partial()`/`.extend()`; el panel admin necesita esa
 * versión parcial para su PATCH.
 */
export const centerFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(120, "El nombre es demasiado largo."),
  address: z
    .string()
    .trim()
    .min(5, "Ingresa una dirección válida.")
    .max(200, "La dirección es demasiado larga."),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Ingresa un teléfono válido.")
    .optional()
    .or(z.literal(""))
    .nullable(),
  kind: z.enum(POINT_KINDS).default("acopio"),
  // La obligatoriedad depende del tipo de punto: un albergue no recibe
  // donaciones. La regla condicional vive en el superRefine de abajo.
  materials: z.array(z.enum(MATERIAL_CATEGORIES)).default([]),
  schedule: z
    .string()
    .trim()
    .min(2, "Indica el horario de atención.")
    .max(120, "El horario es demasiado largo."),
  lat: z
    .number({ message: "Ubica el centro en el mapa." })
    .min(-90)
    .max(90),
  lng: z
    .number({ message: "Ubica el centro en el mapa." })
    .min(-180)
    .max(180),
  notes: z
    .string()
    .trim()
    .max(500, "Las notas son demasiado largas.")
    .optional()
    .or(z.literal(""))
    .nullable(),
});

/**
 * Esquema público de entrada.
 *
 * Regla condicional: solo los centros de acopio deben declarar qué reciben.
 * Exigir materiales a un albergue impediría reportarlo, que es justo el dato
 * más urgente para alguien que se quedó sin casa.
 */
export const centerInputSchema = centerFieldsSchema.superRefine((value, ctx) => {
  if (value.kind === "acopio" && value.materials.length === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["materials"],
      message: "Selecciona al menos un material que el centro recibe.",
    });
  }
});

/** Tipo inferido del esquema; coincide con `CenterInput` de `types.ts`. */
export type ValidatedCenterInput = z.infer<typeof centerInputSchema>;

/**
 * Aplana los errores de zod a un mapa `campo -> mensajes`, listo para devolver
 * por la API o mostrar en el formulario.
 */
export function formatZodErrors(
  error: z.ZodError,
): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}
