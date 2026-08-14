/**
 * Validación (zod) del dominio Hogares de Paso.
 *
 * Igual que con los centros: el mismo esquema valida en el formulario y en la
 * API. La API re-valida siempre; nunca confía en el cliente.
 */
import { z } from "zod";
import {
  CONVIVENCIAS,
  HOGAR_ACEPTA,
  HOGAR_DISPONIBILIDADES,
  HOGAR_DURACIONES,
  HOGAR_OFRECE,
  HOGAR_VERIFICACIONES,
  SEGUIMIENTO_HITOS,
  SOLICITUD_ESTADOS,
} from "./types";

/** Mismo criterio flexible que en `lib/validation.ts`, pero aquí obligatorio:
 * sin teléfono no hay verificación y sin verificación no hay hogar. */
const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;

const nombreSchema = z
  .string()
  .trim()
  .min(3, "Escribe tu nombre completo.")
  .max(120, "El nombre es demasiado largo.");

const telefonoSchema = z
  .string()
  .trim()
  .regex(phoneRegex, "Ingresa un teléfono válido; por ahí te contactamos.");

const emailSchema = z
  .string()
  .trim()
  .email("Ingresa un correo válido.")
  .max(160, "El correo es demasiado largo.");

const ciudadSchema = z
  .string()
  .trim()
  .min(2, "Indica la ciudad o municipio.")
  .max(80, "El nombre de la ciudad es demasiado largo.");

const notasSchema = z
  .string()
  .trim()
  .max(500, "Las notas son demasiado largas.")
  .optional()
  .or(z.literal(""))
  .nullable();

/**
 * Base sin reglas condicionales, exportada por la misma razón que
 * `centerFieldsSchema`: el PATCH del panel necesita `.partial()` y los
 * `ZodEffects` de un `superRefine` no lo permiten.
 */
export const hogarFieldsSchema = z.object({
  nombre: nombreSchema,
  telefono: telefonoSchema,
  // Obligatorio: es el canal por el que el anfitrión recibe cada solicitud y
  // la acepta o rechaza. Sin correo, el hogar sería una publicación muda.
  email: emailSchema,
  documento: z
    .string()
    .trim()
    .min(5, "Ingresa un número de documento válido.")
    .max(20, "El documento es demasiado largo.")
    .optional()
    .or(z.literal(""))
    .nullable(),
  direccion: z
    .string()
    .trim()
    .max(200, "La dirección es demasiado larga.")
    .optional()
    .or(z.literal(""))
    .nullable(),
  ciudad: ciudadSchema,
  zona: z
    .string()
    .trim()
    .max(80, "El nombre de la zona es demasiado largo.")
    .optional()
    .or(z.literal(""))
    .nullable(),
  capacidad: z
    .number({ message: "Indica cuántas personas puedes hospedar." })
    .int("Debe ser un número entero.")
    .min(1, "La capacidad mínima es 1 persona.")
    .max(20, "Para grupos tan grandes, contacta a la línea de coordinación."),
  acepta: z
    .array(z.enum(HOGAR_ACEPTA))
    .min(1, "Selecciona al menos a quiénes puedes recibir."),
  ofrece: z.array(z.enum(HOGAR_OFRECE)).default([]),
  duracion: z.enum(HOGAR_DURACIONES, {
    message: "Indica por cuánto tiempo puedes hospedar.",
  }),
  convivencia: z.enum(CONVIVENCIAS, {
    message:
      "Cuéntanos quiénes viven en tu casa; es clave para la seguridad de todos.",
  }),
  notas: notasSchema,
});

/**
 * Esquema público de registro de hogar.
 *
 * Regla condicional de seguridad: si el hogar acepta niños, debe aceptar
 * también familias o mujeres — un menor nunca llega solo a casa de un extraño.
 */
export const hogarInputSchema = hogarFieldsSchema.superRefine((value, ctx) => {
  const soloNinos =
    value.acepta.includes("ninos") &&
    !value.acepta.includes("familias") &&
    !value.acepta.includes("mujeres") &&
    !value.acepta.includes("hombres");
  if (soloNinos) {
    ctx.addIssue({
      code: "custom",
      path: ["acepta"],
      message:
        "Los niños siempre llegan acompañados: selecciona también familias o adultos.",
    });
  }
});

export type ValidatedHogarInput = z.infer<typeof hogarInputSchema>;

/** Los valores de composición que son animales (no personas). */
const COMPOSICION_ANIMALES = new Set(["perros", "gatos", "otras_mascotas"]);

/**
 * Esquema de solicitud de hospedaje.
 *
 * `personas` admite 0: un rescatista puede pedir hogar SOLO para un animal.
 * La regla condicional del superRefine garantiza la coherencia: 0 personas
 * exige que la composición traiga únicamente mascotas.
 */
export const solicitudInputSchema = z
  .object({
    nombre: nombreSchema,
    telefono: telefonoSchema,
    email: emailSchema.optional().or(z.literal("")).nullable(),
    ciudad: ciudadSchema,
    personas: z
      .number({ message: "Indica cuántas personas son." })
      .int("Debe ser un número entero.")
      .min(0, "No puede ser negativo.")
      .max(20, "Para grupos tan grandes, contacta a la línea de coordinación."),
    composicion: z
      .array(z.enum(HOGAR_ACEPTA))
      .min(1, "Cuéntanos quiénes son; así buscamos el hogar adecuado."),
    preferencias: z.array(z.enum(CONVIVENCIAS)).default([]),
    // Formato estricto del id: este valor dispara un correo a un anfitrión
    // real, así que un enlace manipulado no debe poder inyectar nada.
    hogarInteresId: z
      .string()
      .regex(/^hogar-[0-9a-f]{8}$/, "Hogar inválido.")
      .optional()
      .nullable(),
    notas: notasSchema,
  })
  .superRefine((value, ctx) => {
    const soloAnimales = value.composicion.every((c) =>
      COMPOSICION_ANIMALES.has(c),
    );
    if (value.personas === 0 && !soloAnimales) {
      ctx.addIssue({
        code: "custom",
        path: ["personas"],
        message:
          "Si viaja al menos una persona, indícalo. El 0 es solo para animales rescatados.",
      });
    }
    if (value.personas > 0 && soloAnimales) {
      ctx.addIssue({
        code: "custom",
        path: ["composicion"],
        message:
          "Indica también quiénes son las personas del grupo (mujeres, hombres, niños...).",
      });
    }
  });

export type ValidatedSolicitudInput = z.infer<typeof solicitudInputSchema>;

/** PATCH del panel coordinador sobre un hogar. */
export const hogarPatchSchema = hogarFieldsSchema
  .partial()
  .extend({
    disponibilidad: z.enum(HOGAR_DISPONIBILIDADES).optional(),
    verificacion: z.enum(HOGAR_VERIFICACIONES).optional(),
  })
  .strict();

/** Una llamada de seguimiento registrada desde el panel. */
export const seguimientoSchema = z.object({
  fecha: z.string().datetime({ offset: true, message: "Fecha inválida." }),
  hito: z.enum(SEGUIMIENTO_HITOS),
  bien: z.boolean(),
  nota: z
    .string()
    .trim()
    .max(500, "La nota es demasiado larga.")
    .default(""),
});

/**
 * PATCH del panel coordinador sobre una solicitud.
 *
 * `codigoVerificacion` NO está aquí a propósito: es el ancla anti-suplantación
 * y solo el servidor puede generarlo (al emparejar) o limpiarlo (al deshacer).
 * Un cliente que pudiera fijarlo podría poner un código predecible o
 * desincronizar lo que cada parte anotó. El `.strict()` rechaza el intento.
 */
export const solicitudPatchSchema = z
  .object({
    estado: z.enum(SOLICITUD_ESTADOS).optional(),
    hogarId: z.string().nullable().optional(),
    notas: notasSchema,
    seguimientos: z.array(seguimientoSchema).max(50).optional(),
  })
  .strict();
