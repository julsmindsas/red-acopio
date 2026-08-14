/**
 * Tipos del dominio "Hogares de Paso".
 *
 * Personas que ofrecen su casa para hospedar temporalmente a damnificados
 * (y a sus mascotas), y personas que necesitan ese hospedaje. Es un dominio
 * aparte de los puntos del mapa: un hogar es la casa de alguien, no un sitio
 * público al que se puede llegar sin coordinación.
 *
 * Principio de seguridad que gobierna todo el modelo: los datos personales
 * jamás se exponen por la API pública. Teléfono, documento y dirección exacta
 * se comparten solo entre las dos partes al concretarse un hospedaje. La
 * plataforma es de INTERMEDIACIÓN: la verificación humana es opcional (el
 * campo `verificacion` etiqueta el estado real del dato, nunca se promete).
 */

/** A quiénes puede recibir un hogar (y de quiénes se compone una solicitud). */
export const HOGAR_ACEPTA = [
  "mujeres",
  "hombres",
  "familias",
  "ninos", // niños y niñas (siempre acompañados)
  "adultos_mayores",
  "perros",
  "gatos",
  "otras_mascotas",
] as const;

export type HogarAcepta = (typeof HOGAR_ACEPTA)[number];

/** Qué ofrece el hogar además del techo. */
export const HOGAR_OFRECE = [
  "alimentacion", // comparte comidas
  "cama", // cama o colchón (vs. solo espacio)
  "cocina", // acceso a cocina para preparar su comida
  "lavadora",
  "internet",
  "transporte", // puede recoger o ayudar con pasajes
] as const;

export type HogarOfrece = (typeof HOGAR_OFRECE)[number];

/** Por cuánto tiempo puede hospedar. */
export const HOGAR_DURACIONES = [
  "dias", // unos días
  "semanas", // hasta un mes
  "mes_o_mas", // un mes o más
] as const;

export type HogarDuracion = (typeof HOGAR_DURACIONES)[number];

/**
 * Quiénes viven en la casa.
 *
 * Es el corazón del control de seguridad: se declara al registrarse, el equipo
 * lo confirma en la llamada de verificación y se muestra públicamente como
 * categoría (nunca nombres). Permite que, por ejemplo, una mujer sola elija
 * hogares donde viven mujeres, y le da al equipo la base para vetar matches
 * que no cumplan las preferencias de quien llega.
 */
export const CONVIVENCIAS = [
  "mujer_sola",
  "hombre_solo",
  "pareja",
  "familia_con_ninos",
  "mujeres_adultas", // varias mujeres adultas
  "varias_personas", // grupo mixto de adultos
] as const;

export type Convivencia = (typeof CONVIVENCIAS)[number];

/**
 * Confianza en el dato del hogar. Los hogares se publican de inmediato con su
 * estado real (la tarjeta lo etiqueta); solo "rechazado" los saca de la lista.
 * Distinto de la disponibilidad.
 */
export const HOGAR_VERIFICACIONES = [
  "pendiente", // registrado, sin verificar (se publica etiquetado así)
  "verificado", // datos confirmados desde el panel de coordinación
  "rechazado", // retirado de la plataforma; nunca se publica
] as const;

export type HogarVerificacion = (typeof HOGAR_VERIFICACIONES)[number];

/** Si el hogar puede recibir gente *ahora*. */
export const HOGAR_DISPONIBILIDADES = [
  "disponible",
  "ocupado", // ya está hospedando
  "pausado", // el anfitrión pidió pausa
] as const;

export type HogarDisponibilidad = (typeof HOGAR_DISPONIBILIDADES)[number];

/** Ciclo de vida de una solicitud de hospedaje. */
export const SOLICITUD_ESTADOS = [
  "nueva",
  "en_proceso", // el equipo ya está buscando hogar
  "emparejada", // hogar asignado, código de verificación emitido
  "hospedada", // la persona llegó y ambas partes confirmaron
  "cerrada", // terminó el hospedaje o se canceló
] as const;

export type SolicitudEstado = (typeof SOLICITUD_ESTADOS)[number];

/**
 * Un hogar de paso tal como se almacena.
 *
 * OJO: contiene datos sensibles. Solo `toHogarPublico()` decide qué sale por
 * la API pública; cualquier endpoint nuevo debe pasar por ahí.
 */
export interface Hogar {
  id: string;

  // ----- Privado: solo equipo coordinador. NUNCA en la API pública. -----
  /** Nombre completo del anfitrión. */
  nombre: string;
  /** Teléfono del anfitrión; por aquí se hace la verificación. */
  telefono: string;
  /**
   * Correo del anfitrión: el canal por el que se entera de cada solicitud y
   * la acepta o rechaza (enlaces firmados, sin cuentas). Nulo solo en
   * registros anteriores a esta función.
   */
  email: string | null;
  /** Cédula u otro documento, para la verificación. */
  documento: string | null;
  /** Dirección exacta. Solo se comparte con la persona ya emparejada. */
  direccion: string | null;

  // ----- Público (vía `toHogarPublico`) -----
  ciudad: string;
  /** Barrio o zona aproximada; da contexto sin revelar la dirección. */
  zona: string | null;
  /** Cuántas personas puede hospedar. */
  capacidad: number;
  acepta: HogarAcepta[];
  ofrece: HogarOfrece[];
  duracion: HogarDuracion;
  convivencia: Convivencia;
  /** Aclaraciones del anfitrión (el equipo las revisa antes de publicar). */
  notas: string | null;
  disponibilidad: HogarDisponibilidad;
  verificacion: HogarVerificacion;

  /** Fechas ISO 8601. */
  createdAt: string;
  updatedAt: string;
}

/**
 * Proyección pública de un hogar: lo único que ve quien navega la lista.
 * Sin nombre, teléfono, documento ni dirección.
 */
export interface HogarPublico {
  id: string;
  ciudad: string;
  zona: string | null;
  capacidad: number;
  acepta: HogarAcepta[];
  ofrece: HogarOfrece[];
  duracion: HogarDuracion;
  convivencia: Convivencia;
  notas: string | null;
  disponibilidad: HogarDisponibilidad;
  verificacion: HogarVerificacion;
  updatedAt: string;
}

/**
 * Retira teléfonos y direcciones del texto libre que escribió el anfitrión.
 *
 * El equipo revisa las notas antes de publicar, pero la revisión humana falla
 * bajo presión: si el anfitrión escribió "llámame al 300 123 4567" o
 * "Cra 23 #45-12", el contacto directo saltaría la mediación que sostiene
 * toda la seguridad del programa. Esta barrera técnica corre SIEMPRE, en la
 * frontera pública, sin depender de que alguien recuerde limpiar el campo.
 */
export function retirarDatosDeContacto(texto: string | null): string | null {
  if (!texto) return texto;
  return (
    texto
      // Secuencias de 7+ dígitos (admitiendo espacios/guiones/paréntesis): teléfonos.
      .replace(/[+]?(?:\d[\s().-]?){7,}\d?/g, "[dato retirado]")
      // Nomenclatura urbana colombiana: "Cra 23 # 45-12", "Calle 10 No. 5-31"...
      .replace(
        /\b(?:calle|cll?e?|carrera|cra|kra|av(?:enida)?|diag(?:onal)?|dg|transversal|tv|circular|cq)\.?\s*\d+[a-z]?\s*(?:#|n[°o]\.?\s?)\s*[\d\s-]+[a-z]?/gi,
        "[dato retirado]",
      )
  );
}

/** Única puerta de salida de un hogar hacia el público. */
export function toHogarPublico(h: Hogar): HogarPublico {
  return {
    id: h.id,
    ciudad: h.ciudad,
    zona: retirarDatosDeContacto(h.zona),
    capacidad: h.capacidad,
    acepta: h.acepta,
    ofrece: h.ofrece,
    duracion: h.duracion,
    convivencia: h.convivencia,
    notas: retirarDatosDeContacto(h.notas),
    disponibilidad: h.disponibilidad,
    verificacion: h.verificacion,
    updatedAt: h.updatedAt,
  };
}

/** Lo que envía quien ofrece su casa. El servidor asigna el resto. */
export interface HogarInput {
  nombre: string;
  telefono: string;
  email: string;
  documento?: string | null;
  direccion?: string | null;
  ciudad: string;
  zona?: string | null;
  capacidad: number;
  acepta: HogarAcepta[];
  ofrece: HogarOfrece[];
  duracion: HogarDuracion;
  convivencia: Convivencia;
  notas?: string | null;
}

/**
 * Hitos del seguimiento post-hospedaje.
 *
 * El emparejamiento no termina el trabajo: el equipo llama a las 48 horas y a
 * los 7 días para confirmar que AMBAS partes están bien. Es la red de
 * seguridad que distingue este programa de "publicar teléfonos y suerte".
 */
export const SEGUIMIENTO_HITOS = [
  "48h", // primer contacto, a los dos días de la llegada
  "7d", // control a la semana
  "otro", // llamadas adicionales fuera de los hitos fijos
] as const;

export type SeguimientoHito = (typeof SEGUIMIENTO_HITOS)[number];

/** Registro de una llamada de seguimiento del equipo coordinador. */
export interface Seguimiento {
  /** Fecha ISO de la llamada. */
  fecha: string;
  hito: SeguimientoHito;
  /** `true` si ambas partes reportaron estar bien. `false` exige atención. */
  bien: boolean;
  /** Qué se encontró en la llamada. */
  nota: string;
}

/**
 * Una solicitud de hospedaje. Enteramente privada: las personas en necesidad
 * nunca se listan públicamente; solo el equipo coordinador las ve.
 */
export interface SolicitudHogar {
  id: string;
  nombre: string;
  telefono: string;
  /** Correo del solicitante (opcional): por aquí se le avisa del resultado. */
  email: string | null;
  /** Ciudad donde necesita el hospedaje. */
  ciudad: string;
  /**
   * Cuántas personas son. Puede ser 0: un rescatista puede pedir hogar solo
   * para un animal (la composición entonces trae únicamente mascotas).
   */
  personas: number;
  /**
   * Hogar concreto que le interesó (botón "Solicitar este hogar"). Dispara la
   * notificación por correo a ese anfitrión para que acepte o rechace.
   */
  hogarInteresId: string | null;
  /** Quiénes componen el grupo (mujeres, niños, mascotas...). */
  composicion: HogarAcepta[];
  /**
   * Con qué tipo de hogar se sentiría segura la persona. El equipo NO propone
   * matches que violen estas preferencias.
   */
  preferencias: Convivencia[];
  notas: string | null;
  estado: SolicitudEstado;
  /** Hogar asignado al emparejar. */
  hogarId: string | null;
  /**
   * Código corto que reciben ambas partes al emparejarse. Al llegar, la
   * persona y el anfitrión comparan códigos: si no coinciden, nadie entra.
   * Evita suplantaciones sin necesidad de apps ni cuentas.
   */
  codigoVerificacion: string | null;
  /**
   * Fecha ISO en que la persona llegó al hogar (estado pasó a "hospedada").
   * De aquí se calculan los seguimientos que tocan: 48h y 7 días después.
   */
  hospedadaAt: string | null;
  /** Llamadas de seguimiento ya hechas, en orden cronológico. */
  seguimientos: Seguimiento[];
  createdAt: string;
  updatedAt: string;
}

/** Lo que envía quien necesita hospedaje. */
export interface SolicitudInput {
  nombre: string;
  telefono: string;
  email?: string | null;
  ciudad: string;
  personas: number;
  composicion: HogarAcepta[];
  preferencias?: Convivencia[];
  hogarInteresId?: string | null;
  notas?: string | null;
}

/** Campos editables de un hogar desde el panel del equipo coordinador. */
export interface HogarPatch {
  zona?: string | null;
  capacidad?: number;
  acepta?: HogarAcepta[];
  ofrece?: HogarOfrece[];
  duracion?: HogarDuracion;
  convivencia?: Convivencia;
  notas?: string | null;
  disponibilidad?: HogarDisponibilidad;
  verificacion?: HogarVerificacion;
}

/** Campos editables de una solicitud desde el panel del equipo coordinador. */
export interface SolicitudPatch {
  estado?: SolicitudEstado;
  hogarId?: string | null;
  codigoVerificacion?: string | null;
  notas?: string | null;
  /**
   * Lista completa de seguimientos (el panel añade el nuevo y manda todo).
   * Reemplazo total: con un solo equipo operando no hay ediciones concurrentes
   * que justifiquen un endpoint de "append".
   */
  seguimientos?: Seguimiento[];
}

// ---------------------------------------------------------------------------
// Etiquetas para la UI (fuente única; formularios y tarjetas las comparten)
// ---------------------------------------------------------------------------

export const ACEPTA_LABELS: Record<HogarAcepta, string> = {
  mujeres: "Mujeres",
  hombres: "Hombres",
  familias: "Familias",
  ninos: "Niños y niñas",
  adultos_mayores: "Adultos mayores",
  perros: "Perros",
  gatos: "Gatos",
  otras_mascotas: "Otras mascotas",
};

export const OFRECE_LABELS: Record<HogarOfrece, string> = {
  alimentacion: "Alimentación",
  cama: "Cama o colchón",
  cocina: "Acceso a cocina",
  lavadora: "Lavadora",
  internet: "Internet",
  transporte: "Ayuda con transporte",
};

export const DURACION_LABELS: Record<HogarDuracion, string> = {
  dias: "Unos días",
  semanas: "Hasta un mes",
  mes_o_mas: "Un mes o más",
};

export const CONVIVENCIA_LABELS: Record<Convivencia, string> = {
  mujer_sola: "Vive una mujer sola",
  hombre_solo: "Vive un hombre solo",
  pareja: "Vive una pareja",
  familia_con_ninos: "Familia con niños",
  mujeres_adultas: "Viven mujeres adultas",
  varias_personas: "Viven varias personas adultas",
};
