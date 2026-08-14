/**
 * Especificación OpenAPI 3.1 de la API pública de Red de Acopio.
 *
 * Documenta los endpoints públicos /api/v1/centers, /api/v1/centers/{id} y
 * los de Hogares de Paso (/api/hogares y /api/hogares/solicitudes). De los
 * hogares SOLO se documenta la superficie pública: las rutas del panel del
 * equipo coordinador son internas y no se anuncian aquí.
 * Se expone en JSON a través de /api/openapi.json para que cualquier cliente
 * (Swagger UI, Redoc, Postman…) pueda importarla sin necesidad de auth.
 *
 * Atribución: los centros verificados provienen de acopiove.org
 * (terremotovenezuela.app), distribuidos bajo las condiciones de su propia
 * plataforma. Los aportes locales son de Red de Acopio (licencia MIT).
 */

/** Tipo mínimo de un esquema OpenAPI 3.1. */
type Schema = Record<string, unknown>;

/** Tipo de un objeto OpenAPI 3.1 completo. */
export interface OpenAPISpec {
  openapi: string;
  info: Record<string, unknown>;
  servers: Array<Record<string, unknown>>;
  paths: Record<string, unknown>;
  components: { schemas: Record<string, Schema> };
}

// ---------------------------------------------------------------------------
// Esquemas reutilizables
// ---------------------------------------------------------------------------

const materialCategoryEnum: Schema = {
  type: "string",
  enum: [
    "alimentos",
    "agua",
    "ropa",
    "medicamentos",
    "aseo",
    "bebes",
    "cobijas",
    "herramientas",
    "mascotas",
    "otros",
  ],
  description:
    "Categoría de material que acepta el centro de acopio. " +
    "alimentos=comida no perecedera, agua=agua potable/purificada, " +
    "ropa=prendas de vestir, medicamentos=medicamentos y suministros médicos, " +
    "aseo=productos de higiene personal, bebes=pañales/fórmula/ropa infantil, " +
    "cobijas=frazadas y ropa de cama, herramientas=herramientas de trabajo, " +
    "mascotas=alimento y cuidado de animales, " +
    "otros=cualquier otro insumo humanitario.",
};

const pointKindEnum: Schema = {
  type: "string",
  enum: ["acopio", "albergue", "brigada_medica", "punto_agua"],
  default: "acopio",
  description:
    "Tipo de punto de ayuda. " +
    "acopio=recibe donaciones, albergue=alojamiento temporal para damnificados, " +
    "brigada_medica=atención médica o primeros auxilios, " +
    "punto_agua=distribución de agua potable.",
};

const operationalStatusEnum: Schema = {
  type: "string",
  enum: ["recibiendo", "lleno", "cerrado", "desconocido"],
  default: "desconocido",
  description:
    "Estado operativo del punto en este momento (distinto de `status`, que habla " +
    "de la confianza en el dato). recibiendo=abierto y con capacidad, " +
    "lleno=abierto pero saturado (no llevar más por ahora), cerrado=no está " +
    "operando, desconocido=sin información reciente.",
};

const verificationStatusEnum: Schema = {
  type: "string",
  enum: ["verificado", "sin_verificar", "reportado"],
  description:
    "Estado de verificación del centro. " +
    "verificado=confirmado contra fuente oficial, " +
    "sin_verificar=origen no confirmado o disputado, " +
    "reportado=enviado por la ciudadanía, pendiente de revisión.",
};

const centerSchema: Schema = {
  type: "object",
  description:
    "Un punto de ayuda humanitaria: centro de acopio, albergue, brigada médica " +
    "o punto de agua (ver el campo `kind`).",
  required: [
    "id", "name", "address", "kind", "phone", "materials", "schedule",
    "lat", "lng", "notes", "source", "status", "operational",
    "createdAt", "updatedAt",
  ],
  properties: {
    id: {
      type: "string",
      description:
        "Identificador único del centro. Los centros de acopiove.org tienen el prefijo \"acopio-\".",
      example: "acopio-abc123",
    },
    name: {
      type: "string",
      description: "Nombre del centro de acopio.",
      example: "Centro Comunitario San Javier",
    },
    address: {
      type: "string",
      description: "Dirección física del punto.",
      example: "Coliseo Mayor, Carrera 24, Manizales",
    },
    kind: { $ref: "#/components/schemas/PointKind" },
    phone: {
      type: ["string", "null"],
      description: "Teléfono de contacto. null si no se conoce.",
      example: "+57 300 123 4567",
    },
    materials: {
      type: "array",
      items: { $ref: "#/components/schemas/MaterialCategory" },
      description:
        "Materiales que el punto acepta. Vacío en albergues, brigadas médicas y " +
        "puntos de agua, que no reciben donaciones.",
      example: ["alimentos", "ropa", "medicamentos"],
    },
    urgentNeeds: {
      type: "array",
      items: { $ref: "#/components/schemas/MaterialCategory" },
      description:
        "Lo que el punto más necesita ahora. Subconjunto de `materials`.",
      example: ["agua", "bebes"],
    },
    notReceiving: {
      type: "array",
      items: { $ref: "#/components/schemas/MaterialCategory" },
      description:
        "Lo que el punto pidió NO seguir recibiendo, normalmente por saturación.",
      example: ["ropa"],
    },
    operational: { $ref: "#/components/schemas/OperationalStatus" },
    schedule: {
      type: "string",
      description: "Horario de atención en texto libre.",
      example: "Lun–Vie 8:00am–5:00pm",
    },
    lat: {
      type: "number",
      format: "float",
      description: "Latitud geográfica (WGS-84).",
      example: 6.2442,
    },
    lng: {
      type: "number",
      format: "float",
      description: "Longitud geográfica (WGS-84).",
      example: -75.5812,
    },
    city: {
      type: ["string", "null"],
      description: "Ciudad o municipio. Puede ser null si no se conoce.",
      example: "Medellín",
    },
    country: {
      type: ["string", "null"],
      description: "País. Por defecto \"Colombia\" en los datos locales.",
      example: "Colombia",
    },
    notes: {
      type: ["string", "null"],
      description: "Notas o aclaraciones adicionales sobre el centro.",
      example: "Entrada por el costado sur del parque. Gestiona: Cruz Roja seccional Antioquia.",
    },
    source: {
      type: ["string", "null"],
      description:
        "Origen del dato: URL de la fuente, \"reporte-ciudadano\", \"acopiove.org\", \"api\", etc.",
      example: "acopiove.org",
    },
    status: { $ref: "#/components/schemas/VerificationStatus" },
    readOnly: {
      type: "boolean",
      description:
        "true si el centro proviene de una fuente externa de sólo lectura (acopiove.org).",
      example: true,
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Fecha de creación en formato ISO 8601.",
      example: "2025-06-15T14:30:00.000Z",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      description: "Fecha de última actualización en formato ISO 8601.",
      example: "2025-06-20T09:00:00.000Z",
    },
  },
};

const centerInputSchema: Schema = {
  type: "object",
  description: "Datos que envía un ciudadano al reportar un nuevo punto de ayuda.",
  required: ["name", "address", "schedule", "lat", "lng"],
  properties: {
    name: {
      type: "string",
      minLength: 3,
      maxLength: 120,
      description: "Nombre del punto.",
      example: "Albergue temporal Coliseo Menor",
    },
    address: {
      type: "string",
      minLength: 5,
      maxLength: 200,
      description: "Dirección física del punto.",
      example: "Avenida Lindsay, Manizales",
    },
    kind: { $ref: "#/components/schemas/PointKind" },
    phone: {
      type: ["string", "null"],
      description: "Teléfono de contacto (opcional). Acepta formatos colombianos.",
      example: "312 456 7890",
    },
    materials: {
      type: "array",
      items: { $ref: "#/components/schemas/MaterialCategory" },
      description:
        "Materiales que el punto acepta. Obligatorio (al menos uno) solo cuando " +
        "`kind` es `acopio`; se ignora en los demás tipos.",
      example: ["alimentos", "agua"],
    },
    schedule: {
      type: "string",
      minLength: 2,
      maxLength: 120,
      description: "Horario de atención.",
      example: "Sáb–Dom 9:00am–2:00pm",
    },
    lat: {
      type: "number",
      minimum: -90,
      maximum: 90,
      description: "Latitud geográfica del centro (WGS-84).",
      example: 6.2518,
    },
    lng: {
      type: "number",
      minimum: -180,
      maximum: 180,
      description: "Longitud geográfica del centro (WGS-84).",
      example: -75.5636,
    },
    notes: {
      type: ["string", "null"],
      maxLength: 500,
      description: "Notas o aclaraciones adicionales (opcional).",
      example: "Preguntar por la coordinadora en recepción.",
    },
  },
};

// ---------------------------------------------------------------------------
// Esquemas de Hogares de Paso (solo la superficie pública)
// ---------------------------------------------------------------------------
// Principio: el contacto entre anfitriones y damnificados es SIEMPRE mediado
// por el equipo coordinador. Por eso aquí solo se documenta la proyección
// pública (HogarPublico) y los cuerpos de registro; los datos personales
// (nombre, teléfono, documento, dirección) jamás salen por la API pública.

const hogarAceptaEnum: Schema = {
  type: "string",
  enum: [
    "mujeres",
    "hombres",
    "familias",
    "ninos",
    "adultos_mayores",
    "perros",
    "gatos",
    "otras_mascotas",
  ],
  description:
    "A quiénes puede recibir un hogar (y de quiénes se compone una solicitud). " +
    "ninos=niños y niñas (siempre acompañados de un adulto), " +
    "otras_mascotas=mascotas distintas de perros y gatos.",
};

const hogarOfreceEnum: Schema = {
  type: "string",
  enum: ["alimentacion", "cama", "cocina", "lavadora", "internet", "transporte"],
  description:
    "Qué ofrece el hogar además del techo. " +
    "alimentacion=comparte comidas, cama=cama o colchón, " +
    "cocina=acceso a cocina para preparar su comida, " +
    "transporte=puede recoger o ayudar con pasajes.",
};

const hogarDuracionEnum: Schema = {
  type: "string",
  enum: ["dias", "semanas", "mes_o_mas"],
  description:
    "Por cuánto tiempo puede hospedar el hogar. " +
    "dias=unos días, semanas=hasta un mes, mes_o_mas=un mes o más.",
};

const convivenciaEnum: Schema = {
  type: "string",
  enum: [
    "mujer_sola",
    "hombre_solo",
    "pareja",
    "familia_con_ninos",
    "mujeres_adultas",
    "varias_personas",
  ],
  description:
    "Quiénes viven en la casa, como categoría (nunca nombres). Es el corazón " +
    "del control de seguridad: permite, por ejemplo, que una mujer sola elija " +
    "hogares donde viven mujeres. " +
    "mujeres_adultas=varias mujeres adultas, varias_personas=grupo mixto de adultos.",
};

const hogarDisponibilidadEnum: Schema = {
  type: "string",
  enum: ["disponible", "ocupado", "pausado"],
  description:
    "Si el hogar puede recibir gente ahora. " +
    "ocupado=ya está hospedando, pausado=el anfitrión pidió pausa " +
    "(los hogares pausados no aparecen en la lista pública).",
};

const hogarVerificacionEnum: Schema = {
  type: "string",
  enum: ["pendiente", "verificado", "rechazado"],
  description:
    "Confianza en el hogar. Un hogar NO aparece en la lista pública hasta que " +
    "el equipo coordinador lo verifica (llamada + documento). " +
    "pendiente=recién registrado, verificado=llamada hecha y documento validado, " +
    "rechazado=no pasó la verificación (nunca se publica).",
};

const hogarPublicoSchema: Schema = {
  type: "object",
  description:
    "Proyección PÚBLICA de un hogar de paso: lo único que ve quien navega la " +
    "lista. NUNCA incluye nombre, teléfono, documento ni dirección del " +
    "anfitrión — el contacto se hace siempre a través del equipo coordinador. " +
    "Los campos de texto libre (zona, notas) pasan además por un filtro " +
    "automático que retira teléfonos y direcciones.",
  required: [
    "id", "ciudad", "zona", "capacidad", "acepta", "ofrece", "duracion",
    "convivencia", "notas", "disponibilidad", "verificacion", "updatedAt",
  ],
  properties: {
    id: {
      type: "string",
      description: "Identificador único del hogar.",
      example: "hogar-abc123",
    },
    ciudad: {
      type: "string",
      description: "Ciudad o municipio donde está el hogar.",
      example: "Manizales",
    },
    zona: {
      type: ["string", "null"],
      description:
        "Barrio o zona aproximada; da contexto sin revelar la dirección exacta.",
      example: "Cerca al centro",
    },
    capacidad: {
      type: "integer",
      minimum: 1,
      maximum: 20,
      description: "Cuántas personas puede hospedar.",
      example: 3,
    },
    acepta: {
      type: "array",
      items: { $ref: "#/components/schemas/HogarAcepta" },
      description: "A quiénes puede recibir el hogar.",
      example: ["mujeres", "ninos", "gatos"],
    },
    ofrece: {
      type: "array",
      items: { $ref: "#/components/schemas/HogarOfrece" },
      description: "Qué ofrece el hogar además del techo.",
      example: ["alimentacion", "cama", "internet"],
    },
    duracion: { $ref: "#/components/schemas/HogarDuracion" },
    convivencia: { $ref: "#/components/schemas/Convivencia" },
    notas: {
      type: ["string", "null"],
      description:
        "Aclaraciones del anfitrión, revisadas por el equipo y filtradas " +
        "automáticamente para retirar datos de contacto.",
      example: "Tenemos un patio grande, las mascotas son bienvenidas.",
    },
    disponibilidad: { $ref: "#/components/schemas/HogarDisponibilidad" },
    verificacion: { $ref: "#/components/schemas/HogarVerificacion" },
    updatedAt: {
      type: "string",
      format: "date-time",
      description: "Fecha de última actualización en formato ISO 8601.",
      example: "2026-08-12T09:00:00.000Z",
    },
  },
};

const hogarInputSchema: Schema = {
  type: "object",
  description:
    "Datos que envía quien ofrece su casa como hogar de paso. Los datos " +
    "personales (nombre, teléfono, documento, dirección) se usan SOLO para la " +
    "verificación del equipo coordinador y jamás se publican.",
  required: [
    "nombre", "telefono", "ciudad", "capacidad", "acepta", "duracion", "convivencia",
  ],
  properties: {
    nombre: {
      type: "string",
      minLength: 3,
      maxLength: 120,
      description:
        "Nombre completo del anfitrión. Privado: solo lo ve el equipo coordinador.",
      example: "María Fernanda López",
    },
    telefono: {
      type: "string",
      pattern: "^[+]?[\\d\\s()-]{7,20}$",
      description:
        "Teléfono del anfitrión; por aquí se hace la llamada de verificación. " +
        "Privado: nunca se publica.",
      example: "310 555 1234",
    },
    documento: {
      type: ["string", "null"],
      minLength: 5,
      maxLength: 20,
      description:
        "Cédula u otro documento, para la verificación (opcional al registrarse). Privado.",
      example: "1053812345",
    },
    direccion: {
      type: ["string", "null"],
      maxLength: 200,
      description:
        "Dirección exacta (opcional). Privada: solo se comparte con la persona " +
        "ya emparejada, a través del equipo.",
      example: "Se comparte solo con quien llega, nunca en la API pública.",
    },
    ciudad: {
      type: "string",
      minLength: 2,
      maxLength: 80,
      description: "Ciudad o municipio donde está el hogar.",
      example: "Manizales",
    },
    zona: {
      type: ["string", "null"],
      maxLength: 80,
      description: "Barrio o zona aproximada (opcional); esto sí se publica.",
      example: "Cerca al centro",
    },
    capacidad: {
      type: "integer",
      minimum: 1,
      maximum: 20,
      description: "Cuántas personas puede hospedar.",
      example: 3,
    },
    acepta: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/components/schemas/HogarAcepta" },
      description:
        "A quiénes puede recibir. Regla de seguridad: si incluye `ninos`, debe " +
        "incluir también `familias` o algún adulto — un menor nunca llega solo " +
        "a casa de un extraño.",
      example: ["mujeres", "ninos"],
    },
    ofrece: {
      type: "array",
      items: { $ref: "#/components/schemas/HogarOfrece" },
      description: "Qué ofrece además del techo (opcional).",
      example: ["alimentacion", "cama"],
    },
    duracion: { $ref: "#/components/schemas/HogarDuracion" },
    convivencia: { $ref: "#/components/schemas/Convivencia" },
    notas: {
      type: ["string", "null"],
      maxLength: 500,
      description:
        "Aclaraciones adicionales (opcional). No escribas aquí tu teléfono ni " +
        "tu dirección: se retiran automáticamente antes de publicar.",
      example: "Tenemos un patio grande.",
    },
  },
};

const solicitudInputSchema: Schema = {
  type: "object",
  description:
    "Datos que envía quien necesita hospedaje. La solicitud es enteramente " +
    "PRIVADA: solo la ve el equipo coordinador, que llama para buscar un hogar " +
    "compatible.",
  required: ["nombre", "telefono", "ciudad", "personas", "composicion"],
  properties: {
    nombre: {
      type: "string",
      minLength: 3,
      maxLength: 120,
      description: "Nombre completo de quien solicita. Privado.",
      example: "Carlos Andrés Gómez",
    },
    telefono: {
      type: "string",
      pattern: "^[+]?[\\d\\s()-]{7,20}$",
      description: "Teléfono de contacto; por aquí llama el equipo. Privado.",
      example: "+57 301 222 3344",
    },
    ciudad: {
      type: "string",
      minLength: 2,
      maxLength: 80,
      description: "Ciudad donde necesita el hospedaje.",
      example: "Manizales",
    },
    personas: {
      type: "integer",
      minimum: 1,
      maximum: 20,
      description: "Cuántas personas son.",
      example: 4,
    },
    composicion: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/components/schemas/HogarAcepta" },
      description: "Quiénes componen el grupo (mujeres, niños, mascotas...).",
      example: ["mujeres", "ninos", "perros"],
    },
    preferencias: {
      type: "array",
      items: { $ref: "#/components/schemas/Convivencia" },
      description:
        "Con qué tipo de hogar se sentiría segura la persona (opcional). El " +
        "equipo NO propone emparejamientos que violen estas preferencias.",
      example: ["mujer_sola", "mujeres_adultas"],
    },
    notas: {
      type: ["string", "null"],
      maxLength: 500,
      description: "Contexto adicional para el equipo (opcional).",
      example: "Perdimos la casa en el sismo; el perro es pequeño y tranquilo.",
    },
  },
};

const solicitudCreadaSchema: Schema = {
  type: "object",
  description:
    "Respuesta mínima al crear una solicitud: apenas el número de radicado. " +
    "No hay eco de los datos personales, así la respuesta es inofensiva en " +
    "logs y devtools.",
  required: ["id", "estado", "createdAt"],
  properties: {
    id: {
      type: "string",
      description: "Identificador de la solicitud (número de radicado).",
      example: "solicitud-xyz789",
    },
    estado: {
      type: "string",
      enum: ["nueva", "en_proceso", "emparejada", "hospedada", "cerrada"],
      description:
        "Estado de la solicitud. Al crearla siempre es `nueva`; el equipo la " +
        "gestiona desde ahí.",
      example: "nueva",
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Fecha de creación en formato ISO 8601.",
      example: "2026-08-14T10:00:00.000Z",
    },
  },
};

const apiErrorSchema: Schema = {
  type: "object",
  description: "Respuesta estándar de error de la API.",
  required: ["error"],
  properties: {
    error: {
      type: "string",
      description: "Mensaje de error legible por humanos.",
      example: "Datos inválidos",
    },
    fields: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: { type: "string" },
      },
      description:
        "Errores de validación por campo (sólo presente en respuestas 400). " +
        "Las claves son los nombres de campo y los valores son listas de mensajes de error.",
      example: { name: ["El nombre debe tener al menos 3 caracteres."] },
    },
  },
};

// ---------------------------------------------------------------------------
// Parámetros de consulta reutilizables
// ---------------------------------------------------------------------------

const centerListQueryParams = [
  {
    name: "source",
    in: "query",
    required: false,
    schema: {
      type: "string",
      enum: ["all", "official", "local"],
      default: "all",
    },
    description:
      "Filtra por origen del dato. " +
      "all=todos los centros, " +
      "official=sólo centros de acopiove.org (verificados, readOnly), " +
      "local=sólo aportes propios de Red de Acopio.",
    example: "official",
  },
  {
    name: "city",
    in: "query",
    required: false,
    schema: { type: "string" },
    description:
      "Filtra por ciudad o municipio (coincidencia parcial, insensible a mayúsculas). " +
      "Busca en el campo city y en la dirección.",
    example: "Manizales",
  },
  {
    name: "kind",
    in: "query",
    required: false,
    schema: { $ref: "#/components/schemas/PointKind" },
    description:
      "Filtra por tipo de punto. Útil para pedir solo albergues o solo acopios.",
    example: "albergue",
  },
  {
    name: "operational",
    in: "query",
    required: false,
    schema: { $ref: "#/components/schemas/OperationalStatus" },
    description:
      "Filtra por estado operativo. Por ejemplo, `recibiendo` excluye los puntos saturados o cerrados.",
    example: "recibiendo",
  },
  {
    name: "material",
    in: "query",
    required: false,
    schema: { $ref: "#/components/schemas/MaterialCategory" },
    description: "Filtra centros que acepten esta categoría de material.",
    example: "alimentos",
  },
  {
    name: "status",
    in: "query",
    required: false,
    schema: { $ref: "#/components/schemas/VerificationStatus" },
    description: "Filtra por estado de verificación del centro.",
    example: "verificado",
  },
  {
    name: "q",
    in: "query",
    required: false,
    schema: { type: "string" },
    description:
      "Búsqueda de texto libre en el nombre y la dirección del centro (insensible a mayúsculas).",
    example: "San Javier",
  },
];

// ---------------------------------------------------------------------------
// Especificación completa
// ---------------------------------------------------------------------------

export const openapiSpec: OpenAPISpec = {
  openapi: "3.1.0",
  info: {
    title: "Red de Acopio API",
    version: "1.0.0",
    description:
      "API pública de Red de Acopio: directorio abierto de centros de acopio de ayuda humanitaria en Colombia.\n\n" +
      "**Atribución:** Los centros verificados provienen de [acopiove.org](https://acopiove.org) " +
      "(terremotovenezuela.app) y se reproducen con fines humanitarios. " +
      "Los aportes locales son recolectados directamente por Red de Acopio.\n\n" +
      "**Licencia:** [MIT](https://opensource.org/licenses/MIT)\n\n" +
      "**Repositorio:** [github.com/julsmindsas/red-acopio](https://github.com/julsmindsas/red-acopio)\n\n" +
      "Todos los endpoints de la API v1 permiten CORS abierto (`Access-Control-Allow-Origin: *`) " +
      "para que cualquier aplicación de terceros pueda consumirlos sin restricciones de origen.",
    contact: {
      name: "Red de Acopio — JulsMind",
      url: "https://github.com/julsmindsas/red-acopio",
      email: "adminapps@julsmind.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "https://red-acopio-two.vercel.app",
      description: "Producción (Vercel)",
    },
    {
      url: "/",
      description: "Instancia local o relativa al dominio actual",
    },
  ],
  paths: {
    "/api/v1/centers": {
      get: {
        operationId: "listCenters",
        summary: "Listar centros de acopio",
        description:
          "Devuelve la lista combinada de centros de acopio (oficiales + locales deduplicados). " +
          "Admite varios filtros opcionales para acotar los resultados.",
        tags: ["Centros"],
        parameters: centerListQueryParams,
        responses: {
          "200": {
            description: "Lista de centros obtenida correctamente.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["attribution", "total", "items"],
                  properties: {
                    attribution: {
                      type: "string",
                      description: "Nota de atribución a la fuente de datos.",
                      example:
                        "Centros verificados de acopiove.org (terremotovenezuela.app) combinados con aportes locales de Red de Acopio.",
                    },
                    total: {
                      type: "integer",
                      description: "Número total de centros en la respuesta (tras filtros).",
                      example: 42,
                    },
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Center" },
                      description: "Lista de centros de acopio.",
                    },
                  },
                },
                example: {
                  attribution:
                    "Centros verificados de acopiove.org (terremotovenezuela.app) combinados con aportes locales de Red de Acopio.",
                  total: 2,
                  items: [
                    {
                      id: "acopio-xyz001",
                      name: "Mall Itagüí — Sociedad Civil",
                      address: "Calle 55 # 52-45, Itagüí",
                      phone: "+57 4 444 2200",
                      materials: ["alimentos", "ropa", "aseo"],
                      schedule: "Lun–Vie 8:00am–6:00pm",
                      lat: 6.1749,
                      lng: -75.5979,
                      city: "Itagüí",
                      country: "Colombia",
                      notes: "Gestiona: Sociedad Civil Itagüí. Fuente: acopiove.org",
                      source: "acopiove.org",
                      status: "verificado",
                      readOnly: true,
                      createdAt: "2025-06-10T12:00:00.000Z",
                      updatedAt: "2025-06-10T12:00:00.000Z",
                    },
                    {
                      id: "local-abc456",
                      name: "Bodega Comunitaria San Javier",
                      address: "Carrera 76 # 43A-10, Medellín",
                      phone: null,
                      materials: ["alimentos", "agua"],
                      schedule: "Sáb–Dom 9:00am–2:00pm",
                      lat: 6.2442,
                      lng: -75.5955,
                      city: "Medellín",
                      country: "Colombia",
                      notes: null,
                      source: "reporte-ciudadano",
                      status: "sin_verificar",
                      readOnly: false,
                      createdAt: "2025-06-18T10:30:00.000Z",
                      updatedAt: "2025-06-18T10:30:00.000Z",
                    },
                  ],
                },
              },
            },
          },
          "400": {
            description: "Parámetro de consulta inválido.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: {
                  error:
                    "Parámetro \"source\" inválido. Valores aceptados: all, official, local.",
                },
              },
            },
          },
          "500": {
            description: "Error interno del servidor.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { error: "Error interno al obtener los centros." },
              },
            },
          },
        },
      },
      post: {
        operationId: "createCenter",
        summary: "Reportar un nuevo centro de acopio",
        description:
          "Registra una recomendación ciudadana de un nuevo centro. " +
          "El centro se crea con estado `reportado` y queda pendiente de verificación. " +
          "Requiere que el despliegue tenga una base de datos Postgres configurada.",
        tags: ["Centros"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CenterInput" },
              example: {
                name: "Parroquia San Pablo — Bodega de Ayuda",
                address: "Carrera 48 # 30-10, Medellín",
                phone: "312 456 7890",
                materials: ["alimentos", "ropa", "medicamentos"],
                schedule: "Mar–Dom 7:00am–12:00pm",
                lat: 6.2388,
                lng: -75.5751,
                notes: "Ingresar por la entrada lateral del templo.",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Centro creado correctamente.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Center" },
                example: {
                  id: "cuid-generated-id",
                  name: "Parroquia San Pablo — Bodega de Ayuda",
                  address: "Carrera 48 # 30-10, Medellín",
                  phone: "312 456 7890",
                  materials: ["alimentos", "ropa", "medicamentos"],
                  schedule: "Mar–Dom 7:00am–12:00pm",
                  lat: 6.2388,
                  lng: -75.5751,
                  city: null,
                  country: null,
                  notes: "Ingresar por la entrada lateral del templo.",
                  source: "api",
                  status: "reportado",
                  readOnly: false,
                  createdAt: "2025-06-20T15:00:00.000Z",
                  updatedAt: "2025-06-20T15:00:00.000Z",
                },
              },
            },
          },
          "400": {
            description: "Datos inválidos. Revisa los mensajes de error por campo.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: {
                  error: "Datos inválidos",
                  fields: {
                    name: ["El nombre debe tener al menos 3 caracteres."],
                    materials: ["Selecciona al menos un material que el centro recibe."],
                  },
                },
              },
            },
          },
          "503": {
            description:
              "Servicio no disponible: este despliegue no tiene base de datos configurada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: {
                  error:
                    "El registro de centros no está disponible: este despliegue no tiene base de datos configurada. " +
                    "Configura una base Postgres (DATABASE_URL) para habilitar los reportes.",
                },
              },
            },
          },
          "500": {
            description: "Error interno del servidor.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { error: "Error interno al crear el centro." },
              },
            },
          },
        },
      },
    },
    "/api/v1/centers/{id}": {
      get: {
        operationId: "getCenterById",
        summary: "Obtener un centro de acopio por id",
        description:
          "Busca un centro por su identificador único en la fuente híbrida " +
          "(centros oficiales de acopiove.org + aportes locales). " +
          "Los ids de centros oficiales tienen el prefijo \"acopio-\".",
        tags: ["Centros"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description:
              "Identificador único del centro. " +
              "Los centros de acopiove.org usan el formato \"acopio-{id_original}\".",
            example: "acopio-xyz001",
          },
        ],
        responses: {
          "200": {
            description: "Centro encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Center" },
                example: {
                  id: "acopio-xyz001",
                  name: "Mall Itagüí — Sociedad Civil",
                  address: "Calle 55 # 52-45, Itagüí",
                  phone: "+57 4 444 2200",
                  materials: ["alimentos", "ropa", "aseo"],
                  schedule: "Lun–Vie 8:00am–6:00pm",
                  lat: 6.1749,
                  lng: -75.5979,
                  city: "Itagüí",
                  country: "Colombia",
                  notes: "Gestiona: Sociedad Civil Itagüí. Fuente: acopiove.org",
                  source: "acopiove.org",
                  status: "verificado",
                  readOnly: true,
                  createdAt: "2025-06-10T12:00:00.000Z",
                  updatedAt: "2025-06-10T12:00:00.000Z",
                },
              },
            },
          },
          "404": {
            description: "Centro no encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { error: "No se encontró un centro con id \"acopio-xyz001\"." },
              },
            },
          },
          "500": {
            description: "Error interno del servidor.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { error: "Error interno al buscar el centro." },
              },
            },
          },
        },
      },
    },
    "/api/hogares": {
      get: {
        operationId: "listHogares",
        summary: "Listar hogares de paso verificados",
        description:
          "Devuelve la lista pública de hogares de paso: SOLO los que el equipo " +
          "coordinador ya verificó (llamada + documento) y que no están en pausa. " +
          "Cada hogar viene proyectado como `HogarPublico`: NUNCA incluye nombre, " +
          "teléfono, documento ni dirección del anfitrión. El contacto entre las " +
          "partes es siempre mediado por el equipo coordinador; no hay forma de " +
          "contactar a un anfitrión a través de esta API.",
        tags: ["Hogares de Paso"],
        responses: {
          "200": {
            description: "Lista pública de hogares obtenida correctamente.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/HogarPublico" },
                  description: "Hogares verificados y activos, sanitizados.",
                },
                example: [
                  {
                    id: "hogar-abc123",
                    ciudad: "Manizales",
                    zona: "Cerca al centro",
                    capacidad: 3,
                    acepta: ["mujeres", "ninos", "gatos"],
                    ofrece: ["alimentacion", "cama", "internet"],
                    duracion: "semanas",
                    convivencia: "familia_con_ninos",
                    notas: "Tenemos un patio grande, las mascotas son bienvenidas.",
                    disponibilidad: "disponible",
                    verificacion: "verificado",
                    updatedAt: "2026-08-12T09:00:00.000Z",
                  },
                ],
              },
            },
          },
          "500": {
            description: "Error interno del servidor.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { error: "Error interno al obtener los hogares." },
              },
            },
          },
        },
      },
      post: {
        operationId: "createHogar",
        summary: "Ofrecer una casa como hogar de paso",
        description:
          "Registra un hogar de paso. Los datos personales del anfitrión " +
          "(nombre, teléfono, documento, dirección) se usan únicamente para la " +
          "verificación y jamás se publican.\n\n" +
          "Flujo de verificación: el hogar entra con `verificacion: pendiente` y " +
          "NO aparece en la lista pública. El equipo coordinador llama al " +
          "teléfono registrado, valida el documento y solo entonces lo marca " +
          "como `verificado` y lo publica.\n\n" +
          "La respuesta viene sanitizada: devuelve la proyección `HogarPublico`, " +
          "sin datos sensibles — ni siquiera quien registró el hogar recibe de " +
          "vuelta su teléfono o dirección, para que la respuesta sea inofensiva " +
          "en logs y devtools.",
        tags: ["Hogares de Paso"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HogarInput" },
              example: {
                nombre: "María Fernanda López",
                telefono: "310 555 1234",
                documento: "1053812345",
                direccion: "Solo la ve el equipo coordinador",
                ciudad: "Manizales",
                zona: "Cerca al centro",
                capacidad: 3,
                acepta: ["mujeres", "ninos", "gatos"],
                ofrece: ["alimentacion", "cama", "internet"],
                duracion: "semanas",
                convivencia: "familia_con_ninos",
                notas: "Tenemos un patio grande.",
              },
            },
          },
        },
        responses: {
          "201": {
            description:
              "Hogar registrado, pendiente de verificación. La respuesta está " +
              "sanitizada: solo la proyección pública más un mensaje que " +
              "explica los siguientes pasos.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["hogar", "mensaje"],
                  properties: {
                    hogar: { $ref: "#/components/schemas/HogarPublico" },
                    mensaje: {
                      type: "string",
                      description:
                        "Mensaje para el anfitrión sobre la llamada de verificación.",
                    },
                  },
                },
                example: {
                  hogar: {
                    id: "hogar-abc123",
                    ciudad: "Manizales",
                    zona: "Cerca al centro",
                    capacidad: 3,
                    acepta: ["mujeres", "ninos", "gatos"],
                    ofrece: ["alimentacion", "cama", "internet"],
                    duracion: "semanas",
                    convivencia: "familia_con_ninos",
                    notas: "Tenemos un patio grande.",
                    disponibilidad: "disponible",
                    verificacion: "pendiente",
                    updatedAt: "2026-08-14T10:00:00.000Z",
                  },
                  mensaje:
                    "¡Gracias por abrir tu casa! El equipo coordinador te llamará al número que dejaste para verificar los datos. Tu hogar se publica solo después de esa llamada, y tu dirección y teléfono nunca se muestran públicamente.",
                },
              },
            },
          },
          "400": {
            description: "Datos inválidos. Revisa los mensajes de error por campo.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: {
                  error: "Datos inválidos",
                  fields: {
                    telefono: ["Ingresa un teléfono válido; por ahí te contactamos."],
                    acepta: [
                      "Los niños siempre llegan acompañados: selecciona también familias o adultos.",
                    ],
                  },
                },
              },
            },
          },
          "503": {
            description:
              "Servicio no disponible: este despliegue no tiene base de datos configurada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: {
                  error:
                    "El registro de hogares no está disponible: este despliegue no tiene base de datos configurada. " +
                    "Configura una base Postgres (DATABASE_URL) para habilitar Hogares de Paso.",
                },
              },
            },
          },
          "500": {
            description: "Error interno del servidor.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { error: "Error interno al registrar el hogar." },
              },
            },
          },
        },
      },
    },
    "/api/hogares/solicitudes": {
      post: {
        operationId: "createSolicitudHogar",
        summary: "Solicitar hospedaje en un hogar de paso",
        description:
          "Crea una solicitud de hospedaje. La solicitud es enteramente " +
          "PRIVADA: quien necesita techo nunca aparece en ninguna lista " +
          "pública, y solo el equipo coordinador la ve. El equipo llama al " +
          "teléfono registrado, busca un hogar compatible respetando las " +
          "`preferencias` de convivencia, y media todo el contacto.\n\n" +
          "Por eso la respuesta es mínima: `{ id, estado, createdAt }` — " +
          "suficiente para guardar el número de radicado, sin eco de los " +
          "datos personales.",
        tags: ["Hogares de Paso"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SolicitudInput" },
              example: {
                nombre: "Carlos Andrés Gómez",
                telefono: "+57 301 222 3344",
                ciudad: "Manizales",
                personas: 4,
                composicion: ["mujeres", "ninos", "perros"],
                preferencias: ["familia_con_ninos", "mujeres_adultas"],
                notas: "Perdimos la casa en el sismo; el perro es pequeño y tranquilo.",
              },
            },
          },
        },
        responses: {
          "201": {
            description:
              "Solicitud registrada. Respuesta mínima con el número de radicado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SolicitudCreada" },
                example: {
                  id: "solicitud-xyz789",
                  estado: "nueva",
                  createdAt: "2026-08-14T10:00:00.000Z",
                },
              },
            },
          },
          "400": {
            description: "Datos inválidos. Revisa los mensajes de error por campo.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: {
                  error: "Datos inválidos",
                  fields: {
                    composicion: [
                      "Cuéntanos quiénes son; así buscamos el hogar adecuado.",
                    ],
                  },
                },
              },
            },
          },
          "503": {
            description:
              "Servicio no disponible: este despliegue no tiene base de datos configurada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: {
                  error:
                    "El registro de solicitudes no está disponible: este despliegue no tiene base de datos configurada. " +
                    "Configura una base Postgres (DATABASE_URL) para habilitar Hogares de Paso.",
                },
              },
            },
          },
          "500": {
            description: "Error interno del servidor.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
                example: { error: "Error interno al registrar la solicitud." },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      MaterialCategory: materialCategoryEnum,
      VerificationStatus: verificationStatusEnum,
      PointKind: pointKindEnum,
      OperationalStatus: operationalStatusEnum,
      Center: centerSchema,
      CenterInput: centerInputSchema,
      HogarAcepta: hogarAceptaEnum,
      HogarOfrece: hogarOfreceEnum,
      HogarDuracion: hogarDuracionEnum,
      Convivencia: convivenciaEnum,
      HogarDisponibilidad: hogarDisponibilidadEnum,
      HogarVerificacion: hogarVerificacionEnum,
      HogarPublico: hogarPublicoSchema,
      HogarInput: hogarInputSchema,
      SolicitudInput: solicitudInputSchema,
      SolicitudCreada: solicitudCreadaSchema,
      ApiError: apiErrorSchema,
    },
  },
};
