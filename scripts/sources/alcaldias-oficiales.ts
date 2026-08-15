/**
 * Fuentes OFICIALES: publicaciones de las propias entidades responsables.
 *
 * A diferencia del resto de adaptadores —que recogen prensa citando a una
 * autoridad—, estos puntos los publicó la entidad misma en su portal. Por eso
 * llevan `official: true` y el orquestador los marca como **verificado**.
 *
 * Fuentes:
 *   - Alcaldía de Santiago de Cali (cali.gov.co), 2026-08-11 y 2026-08-14
 *   - Gobernación del Quindío (quindio.gov.co), 2026-08-11
 *   - Alcaldía de Armenia (armenia.gov.co), 2026-08-14
 *
 * Todas las detectó el monitor `portales-oficiales.ts` y se curaron a mano.
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

const CALI_URL =
  "https://www.cali.gov.co/publicaciones/193608/solidaridad-calena-se-toma-el-centro-de-acopio-de-la-plazoleta-jairo-varela/";

const QUINDIO_URL =
  "https://quindio.gov.co/un-llamado-a-la-solidaridad-el-centro-de-convenciones-se-transforma-en-el-centro-de-acopio-para-ayudas-a-afectados-por-el-sismo-2";

/** Albergue de Cali en las Canchas Panamericanas (publicado el 2026-08-14). */
const CALI_ALBERGUE_URL =
  "https://www.cali.gov.co/publicaciones/193678/refugio-y-solidaridad-asi-se-vive-en-el-albergue-temporal-ubicado-en-las-canchas-panamericanas/";

/** Albergue de Armenia en el Coliseo del Sur (publicado el 2026-08-14). */
const ARMENIA_ALBERGUE_URL =
  "https://www.armenia.gov.co/varias-familias-pasaron-la-primera-noche-en-el-albergue-habilitado-por-la-alcaldia-de-armenia-tras-el-terremoto";

/**
 * Centro de operaciones de emergencia de Risaralda (CROE), publicado por la
 * Gobernación el 2026-08-13. El portal bloquea al scraper con HTTP 403 y la
 * información va en afiches dentro de un carrusel, así que se leyó con el
 * navegador y se curó a mano.
 */
const RISARALDA_CROE_URL =
  "https://www.risaralda.gov.co/publicaciones/164029/informacion-importante-terremoto/";

const CENTERS: RawCenter[] = [
  {
    name: "Centro de acopio — Plazoleta Jairo Varela",
    address: "Plazoleta Jairo Varela, Cali, Valle del Cauca",
    materials: [
      "agua",
      "alimentos no perecederos",
      "colchonetas",
      "cobijas",
      "elementos de primeros auxilios",
      "guantes de construcción",
      "cascos",
      "linternas",
      "ropa",
    ],
    sourceUrl: CALI_URL,
    official: true,
    municipality: "Cali",
    geoQuery: "Plazoleta Jairo Varela, Cali, Valle del Cauca, Colombia",
    verifyToken: "Jairo Varela",
    notes:
      "Centro de acopio principal de la Alcaldía de Cali. También recibe herramientas de rescate (picas, palas, barras) y baños móviles. Se pide a quienes van a ayudar como voluntarios llegar después de las 3:00 p. m. para organizar y despachar los kits.",
  },
  {
    name: "Centro de acopio — Escuela Nacional del Deporte",
    address: "Escuela Nacional del Deporte, Cali, Valle del Cauca",
    materials: [
      "agua",
      "alimentos no perecederos",
      "colchonetas",
      "cobijas",
      "elementos de primeros auxilios",
    ],
    sourceUrl: CALI_URL,
    official: true,
    municipality: "Cali",
    geoQuery: "Escuela Nacional del Deporte, Cali, Valle del Cauca, Colombia",
    verifyToken: "Escuela Nacional del Deporte",
    notes:
      "Punto de acopio alternativo mencionado por la Alcaldía de Cali junto a la Plazoleta Jairo Varela.",
  },
  {
    name: "Centro de acopio — Centro de Convenciones de Armenia",
    address: "Centro de Convenciones, Armenia, Quindío",
    materials: [
      "agua",
      "alimentos no perecederos",
      "elementos de aseo",
      "colchonetas",
      "cobijas",
    ],
    sourceUrl: QUINDIO_URL,
    official: true,
    municipality: "Armenia",
    geoQuery: "Centro de Convenciones, Armenia, Quindío, Colombia",
    verifyToken: "Centro de Convenciones",
    notes:
      "La Gobernación del Quindío habilitó el Centro de Convenciones como centro de acopio para los afectados por el sismo.",
  },
  // --- Albergues: hasta ahora Cali y Armenia solo tenían acopios en el mapa,
  // así que quien buscaba dónde dormir en esas ciudades no encontraba nada. ---
  {
    name: "Albergue temporal — Canchas Panamericanas",
    kind: "albergue",
    address:
      "Unidad Deportiva Jaime Aparicio (Canchas Panamericanas), coliseos de Hockey Miguel Calero y de Karate-Do, Cali",
    sourceUrl: CALI_ALBERGUE_URL,
    official: true,
    municipality: "Cali",
    geoQuery:
      "Unidad Deportiva Jaime Aparicio, Cali, Valle del Cauca, Colombia",
    verifyToken: "Panamericanas",
    notes:
      "Albergue de la Alcaldía de Cali. Al 14 de agosto alojaba a 129 personas. Ofrece censo de pérdidas, kits de aseo y vestuario, valoración médica, control de enfermedades crónicas, entrega de medicamentos, vacunación, apoyo psicológico y acompañamiento prioritario a menores. IMPORTANTE: recibe familias, no ingresos individuales.",
  },
  {
    name: "Albergue temporal — Coliseo del Sur",
    kind: "albergue",
    address: "Coliseo del Sur, Armenia, Quindío",
    sourceUrl: ARMENIA_ALBERGUE_URL,
    official: true,
    municipality: "Armenia",
    geoQuery: "Coliseo del Sur, Armenia, Quindío, Colombia",
    verifyToken: "Coliseo del Sur",
    notes:
      "Albergue de la Alcaldía de Armenia con capacidad para unas 25 familias. Tiene espacios delimitados con colchonetas y cobijas, kits de aseo, duchas y baterías sanitarias, alimentación por ollas comunitarias, atención médica y jornadas de vacunación, con acompañamiento de la Personería Municipal. Conviene registrarse en el formulario de afectaciones de la Alcaldía, pero también se atiende a quien llegue sin registro previo.",
  },
  {
    // Es el punto al que la Gobernación pide llevar la ayuda del departamento
    // entero, y no estaba en el mapa. Recibe además insumos para animales, que
    // hasta ahora ningún punto del eje cafetero declaraba.
    name: "CROE — Centro Regional de Operaciones de Emergencias",
    kind: "acopio",
    address:
      "Avenida de las Américas con calle 95, lote 1 (enseguida de la Policía de Carreteras), Pereira, Risaralda",
    materials: [
      "agua",
      "alimentos no perecederos",
      "cobijas",
      "ropa",
      "elementos de aseo",
      "medicamentos",
      "alimento para mascotas",
      "insumos veterinarios",
    ],
    sourceUrl: RISARALDA_CROE_URL,
    official: true,
    municipality: "Pereira",
    geoQuery: "Avenida de las Américas, Pereira, Risaralda, Colombia",
    verifyToken: "Terremoto",
    notes:
      "Punto central de la Gobernación de Risaralda para recibir la ayuda humanitaria del departamento. Los vehículos que transportan ayuda NO tienen restricción de movilidad para llegar aquí. También es el acopio para animales afectados: piden comida de perros y gatos (cachorros y adultos), insumos veterinarios (clorhexidina, bacsidil, desinfectantes de heridas, cremas antibióticas), naproxeno y meloxicam, cobijas, camas, collares isabelinos, arneses con correa, cocas de concentrado y agua para animales.",
  },
];

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "red-acopio-scraper/1.0 (proyecto humanitario; contacto: adminapps@julsmind.com)",
      "Accept-Language": "es-CO,es;q=0.9",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  return res.text();
}

export const alcaldiasOficiales: Source = {
  id: "alcaldias-oficiales",
  label: "Alcaldías y gobernaciones — publicaciones oficiales",
  url: CALI_URL,

  async run(): Promise<RawCenter[]> {
    // Verifica cada URL una sola vez, aunque varios puntos la compartan.
    const urls = [...new Set(CENTERS.map((c) => c.sourceUrl))];
    const texts = new Map<string, string>();

    for (const url of urls) {
      try {
        texts.set(url, cheerio.load(await fetchHtml(url)).text());
      } catch (err) {
        console.warn(
          `    [frescura] no se pudo verificar ${url} (${(err as Error).message}).`,
        );
      }
    }

    for (const c of CENTERS) {
      const text = texts.get(c.sourceUrl);
      if (text && c.verifyToken && !text.includes(c.verifyToken)) {
        console.warn(
          `    [frescura] "${c.verifyToken}" ya no aparece en su fuente oficial. Revisar a mano.`,
        );
      }
    }

    return CENTERS;
  },
};
