/**
 * Fuente REAL: Infobae — "Centros de acopio habilitados en Colombia tras el
 * terremoto: guía por ciudad para donar y ayudar a las víctimas"
 * (consultado 2026-08-11).
 *
 * URL: https://www.infobae.com/colombia/2026/08/10/centros-de-acopio-habilitados-en-colombia-tras-el-terremoto-guia-por-ciudad-para-donar-y-ayudar-a-las-victimas/
 *
 * PATRÓN (B): guía en prosa, agrupada por ciudad. A diferencia de otras
 * fuentes, esta **sí publica direcciones exactas**, así que la geocodificación
 * puede ser precisa.
 *
 * Cubre las ciudades desde las que se envía ayuda (Bogotá, Medellín,
 * Barranquilla) y dos ciudades afectadas (Cali y Manizales).
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

const URL =
  "https://www.infobae.com/colombia/2026/08/10/centros-de-acopio-habilitados-en-colombia-tras-el-terremoto-guia-por-ciudad-para-donar-y-ayudar-a-las-victimas/";

/** Lo que la guía indica que reciben los puntos de Bogotá. */
const MATERIALES_BOGOTA = [
  "agua potable embotellada",
  "alimentos no perecederos",
  "cobijas",
  "mantas",
  "almohadas",
  "colchonetas",
  "toldillos",
  "primeros auxilios",
  "higiene personal",
];

const CENTERS: RawCenter[] = [
  // --- Bogotá (6) ----------------------------------------------------------
  {
    name: "Centro de acopio — Samu Sur",
    address: "Avenida Carrera 68 #31-41 sur, Bogotá",
    materials: MATERIALES_BOGOTA,
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Avenida Carrera 68 #31-41 sur, Bogota, Colombia",
    verifyToken: "Samu Sur",
  },
  {
    name: "Centro de acopio — Samu Norte",
    address: "Carrera 7B Bis #132-31, Bogotá",
    materials: MATERIALES_BOGOTA,
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Carrera 7B Bis #132-31, Bogota, Colombia",
    verifyToken: "Samu Norte",
  },
  {
    name: "Centro de acopio — Centro de Salvamento Acuático",
    address: "Avenida La Esmeralda #63-81, Bogotá",
    materials: MATERIALES_BOGOTA,
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Avenida La Esmeralda #63-81, Bogota, Colombia",
    verifyToken: "Salvamento Acuático",
  },
  {
    name: "Centro de acopio — Cruz Roja, sede administrativa",
    address: "Carrera 24 #73-38, Bogotá",
    materials: MATERIALES_BOGOTA,
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Carrera 24 #73-38, Bogota, Colombia",
    verifyToken: "Carrera 24",
  },
  {
    name: "Centro de acopio — Bodega Cruz Roja",
    address: "Diagonal 79B #62-53, Bogotá",
    materials: MATERIALES_BOGOTA,
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Diagonal 79B #62-53, Bogota, Colombia",
    verifyToken: "Diagonal 79B",
  },
  {
    name: "Centro de acopio — Palacio de los Deportes",
    address: "Calle 63 #59A-06, Bogotá",
    materials: MATERIALES_BOGOTA,
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Palacio de los Deportes, Bogota, Colombia",
    verifyToken: "Palacio de los Deportes",
  },

  // --- Cali (1; la Plazoleta Jairo Varela va en la fuente oficial) ---------
  {
    name: "Centro de acopio — Banco de Alimentos de Cali",
    address: "Calle 24 #6-103, Cali",
    materials: [
      "agua",
      "alimentos no perecederos",
      "colchonetas",
      "primeros auxilios",
      "cascos",
      "guantes de construcción",
    ],
    sourceUrl: URL,
    municipality: "Cali",
    geoQuery: "Calle 24 #6-103, Cali, Valle del Cauca, Colombia",
    verifyToken: "Banco de Alimentos",
  },

  // --- Medellín (2) --------------------------------------------------------
  {
    name: "Centro de acopio — Fundación Banco Arquidiocesano de Alimentos",
    address: "Carrera 52 #30A-97, Medellín",
    materials: [
      "alimentos no perecederos",
      "implementos de aseo personal",
      "colchonetas",
      "ropa",
      "mantas",
    ],
    sourceUrl: URL,
    municipality: "Medellín",
    geoQuery: "Carrera 52 #30A-97, Medellin, Antioquia, Colombia",
    verifyToken: "Arquidiocesano",
    notes: "También recibe aportes económicos.",
  },
  {
    name: "Centro de acopio — Fundación Saciar",
    address: "Carrera 50 #25-261, Medellín",
    materials: [
      "alimentos no perecederos",
      "implementos de aseo personal",
      "colchonetas",
      "ropa",
      "mantas",
    ],
    sourceUrl: URL,
    municipality: "Medellín",
    geoQuery: "Carrera 50 #25-261, Medellin, Antioquia, Colombia",
    verifyToken: "Saciar",
    notes: "También recibe aportes económicos.",
  },

  // --- Barranquilla (1) ----------------------------------------------------
  {
    name: "Centro de acopio — Barranquillita",
    address: "Carrera 43 #6-120, sector Barranquillita, Barranquilla",
    materials: [
      "alimentos no perecederos",
      "agua potable",
      "insumos médicos",
      "productos de aseo",
      "artículos para bebés",
      "ropa en buen estado",
      "colchonetas",
    ],
    schedule: "Abierto 24 horas",
    sourceUrl: URL,
    municipality: "Barranquilla",
    geoQuery: "Carrera 43 #6-120, Barranquilla, Atlántico, Colombia",
    verifyToken: "Barranquillita",
  },

  // --- Manizales: donación de sangre (2) -----------------------------------
  // No son centros de acopio: son puntos de atención en salud. Se registran
  // como brigada médica para que no aparezcan en la lista de "dónde donar
  // cosas" de quien lleva mercado.
  {
    name: "Donación de sangre — Canchas auxiliares, Bomberos Palogrande",
    kind: "brigada_medica",
    address: "Canchas auxiliares junto a la estación de Bomberos Palogrande, Manizales",
    schedule: "Recepción desde las 12:30 p. m.",
    sourceUrl: URL,
    municipality: "Manizales",
    geoQuery: "Palogrande, Manizales, Caldas, Colombia",
    verifyToken: "Palogrande",
    notes:
      "Punto de DONACIÓN DE SANGRE, no de mercados. Prioridad para los grupos O positivo y O negativo.",
  },
  {
    name: "Donación de sangre — Hemocentro del Café",
    kind: "brigada_medica",
    address: "Hemocentro del Café, Manizales, Caldas",
    sourceUrl: URL,
    municipality: "Manizales",
    geoQuery: "Hemocentro del Cafe, Manizales, Caldas, Colombia",
    verifyToken: "Hemocentro",
    notes:
      "Punto de DONACIÓN DE SANGRE, no de mercados. Prioridad para los grupos O positivo y O negativo.",
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

export const infobaeAcopiosNacionales: Source = {
  id: "infobae-acopios-nacionales",
  label: "Infobae — guía nacional de centros de acopio",
  url: URL,

  async run(): Promise<RawCenter[]> {
    try {
      const text = cheerio.load(await fetchHtml(URL)).text();
      for (const c of CENTERS) {
        if (c.verifyToken && !text.includes(c.verifyToken)) {
          console.warn(
            `    [frescura] "${c.verifyToken}" ya no aparece en la guía. Revisar a mano.`,
          );
        }
      }
    } catch (err) {
      console.warn(
        `    [frescura] no se pudo verificar la fuente (${(err as Error).message}).`,
      );
    }

    return CENTERS;
  },
};
