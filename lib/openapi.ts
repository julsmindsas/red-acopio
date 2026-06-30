/**
 * Especificación OpenAPI 3.1 de la API pública de Red de Acopio.
 *
 * Documenta los endpoints públicos /api/v1/centers y /api/v1/centers/{id}.
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
    "otros",
  ],
  description:
    "Categoría de material que acepta el centro de acopio. " +
    "alimentos=comida no perecedera, agua=agua potable/purificada, " +
    "ropa=prendas de vestir, medicamentos=medicamentos y suministros médicos, " +
    "aseo=productos de higiene personal, bebes=pañales/fórmula/ropa infantil, " +
    "cobijas=frazadas y ropa de cama, herramientas=herramientas de trabajo, " +
    "otros=cualquier otro insumo humanitario.",
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
  description: "Un centro de acopio de ayuda humanitaria.",
  required: [
    "id", "name", "address", "phone", "materials", "schedule",
    "lat", "lng", "notes", "source", "status", "createdAt", "updatedAt",
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
      description: "Dirección física del centro.",
      example: "Carrera 76 # 43A-10, Medellín",
    },
    phone: {
      type: ["string", "null"],
      description: "Teléfono de contacto. null si no se conoce.",
      example: "+57 300 123 4567",
    },
    materials: {
      type: "array",
      items: { $ref: "#/components/schemas/MaterialCategory" },
      description: "Lista de tipos de materiales que el centro acepta.",
      example: ["alimentos", "ropa", "medicamentos"],
    },
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
  description: "Datos que envía un ciudadano al reportar un nuevo centro de acopio.",
  required: ["name", "address", "materials", "schedule", "lat", "lng"],
  properties: {
    name: {
      type: "string",
      minLength: 3,
      maxLength: 120,
      description: "Nombre del centro de acopio.",
      example: "Bodega Comunitaria Laureles",
    },
    address: {
      type: "string",
      minLength: 5,
      maxLength: 200,
      description: "Dirección física del centro.",
      example: "Calle 33 # 74-22, Medellín",
    },
    phone: {
      type: ["string", "null"],
      description: "Teléfono de contacto (opcional). Acepta formatos colombianos.",
      example: "312 456 7890",
    },
    materials: {
      type: "array",
      items: { $ref: "#/components/schemas/MaterialCategory" },
      minItems: 1,
      description: "Tipos de materiales que el centro acepta. Al menos uno.",
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
    example: "Medellín",
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
  },
  components: {
    schemas: {
      MaterialCategory: materialCategoryEnum,
      VerificationStatus: verificationStatusEnum,
      Center: centerSchema,
      CenterInput: centerInputSchema,
      ApiError: apiErrorSchema,
    },
  },
};
