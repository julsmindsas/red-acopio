/**
 * Fuente REAL: El Tiempo — "Este es el mapa completo de los centros de acopio
 * habilitados en Colombia" (consultado 2026-08-11).
 *
 * URL: https://www.eltiempo.com/datos/este-es-el-mapa-completo-de-los-centros-de-acopio-habilitados-en-colombia-para-ayudar-a-los-damnificados-del-terremoto-de-magnitud-7-3577654
 *
 * Es la recopilación más completa publicada hasta ahora. Aquí se registran solo
 * los puntos que NO aparecen ya en los otros adaptadores, para no duplicar.
 *
 * DISCREPANCIA DOCUMENTADA (Pereira): esta fuente lista los centros de acopio
 * como Consota, Perla del Otún, El Remanso, Kennedy, Ormazá, San Nicolás y
 * Comuna del Café, mientras que El Diario listaba Parque Industrial, 2.500
 * Lotes, Tokio, Consota, Kennedy, Ormazá y San Nicolás. Coinciden en cuatro.
 * En vez de elegir una versión y descartar la otra, se publican los puntos de
 * ambas citando su fuente: un punto de más se confirma con una llamada, uno de
 * menos deja a alguien sin saber dónde ir.
 */

import * as cheerio from "cheerio";
import type { RawCenter, Source } from "./types";

const URL =
  "https://www.eltiempo.com/datos/este-es-el-mapa-completo-de-los-centros-de-acopio-habilitados-en-colombia-para-ayudar-a-los-damnificados-del-terremoto-de-magnitud-7-3577654";

const BASICOS = [
  "agua embotellada",
  "alimentos no perecederos",
  "cobijas",
  "mantas",
  "colchonetas",
  "toldillos",
];

const CENTERS: RawCenter[] = [
  // --- Bogotá: puntos de la Alcaldía --------------------------------------
  {
    name: "Centro de acopio — Universidad Jorge Tadeo Lozano",
    address: "Carrera 4 #22-61, Bogotá",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Universidad Jorge Tadeo Lozano, Bogota, Colombia",
    verifyToken: "Tadeo Lozano",
  },
  {
    name: "Centro de acopio — Punto Usaquén",
    address: "Calle 161A #7F-55, Bogotá",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Calle 161A #7F-55, Bogota, Colombia",
    verifyToken: "161A",
  },
  {
    name: "Centro de acopio — Centro Comercial Unicentro",
    address: "Carrera 15 #124-30, Bogotá",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Unicentro, Bogota, Colombia",
    verifyToken: "Unicentro",
  },
  {
    name: "Centro de acopio — Estadio Nemesio Camacho El Campín",
    address: "Estadio El Campín, Bogotá",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Estadio Nemesio Camacho El Campin, Bogota, Colombia",
    verifyToken: "Campín",
  },
  {
    name: "Centro de acopio — Empresa de Licores de Cundinamarca",
    address: "Autopista Medellín km 3,8, Cundinamarca",
    materials: ["alimento para mascotas", "elementos para mascotas"],
    sourceUrl: URL,
    municipality: "Bogotá",
    geoQuery: "Empresa de Licores de Cundinamarca, Cota, Cundinamarca, Colombia",
    verifyToken: "Licores de Cundinamarca",
    notes: "Punto enfocado en elementos para MASCOTAS.",
  },

  // --- Valle del Cauca ----------------------------------------------------
  {
    name: "Donación de sangre — Hospital Universitario del Valle",
    kind: "brigada_medica",
    address: "Hospital Universitario del Valle, Cali",
    sourceUrl: URL,
    municipality: "Cali",
    geoQuery: "Hospital Universitario del Valle, Cali, Colombia",
    verifyToken: "Hospital Universitario del Valle",
    notes: "Punto de DONACIÓN DE SANGRE, no de mercados.",
  },
  {
    name: "Centro de acopio — Banco de Alimentos de Buenaventura",
    address: "Avenida Simón Bolívar #47C-70, interior Colegio Seminario, Buenaventura",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Buenaventura",
    geoQuery: "Avenida Simon Bolivar #47C-70, Buenaventura, Valle del Cauca, Colombia",
    verifyToken: "Buenaventura",
  },

  // --- Eje Cafetero -------------------------------------------------------
  {
    name: "Centro de acopio — CAFE Perla del Otún",
    address: "Centro de atención Perla del Otún, Pereira",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Perla del Otun, Pereira, Risaralda, Colombia",
    verifyToken: "Perla del Otún",
  },
  {
    name: "Centro de acopio — CAFE El Remanso",
    address: "Centro de atención El Remanso, Pereira",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "El Remanso, Pereira, Risaralda, Colombia",
    verifyToken: "El Remanso",
  },
  {
    name: "Centro de acopio — CAFE Comuna del Café",
    address: "Carrera 3 con calle 59A, Pereira",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Pereira",
    geoQuery: "Comuna del Cafe, Pereira, Risaralda, Colombia",
    verifyToken: "Comuna del Café",
  },
  {
    name: "Centro de acopio — Banco de Alimentos de Dosquebradas",
    address: "Transversal 5 #6-30, La Badea, Dosquebradas",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Dosquebradas",
    geoQuery: "La Badea, Dosquebradas, Risaralda, Colombia",
    verifyToken: "La Badea",
  },
  {
    name: "Centro de acopio — Banco de Alimentos de Manizales",
    address: "Calle 49 #27A-85, Manizales",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Manizales",
    geoQuery: "Calle 49 #27A-85, Manizales, Caldas, Colombia",
    verifyToken: "Calle 49",
  },
  {
    name: "Centro de acopio — Banco de Alimentos Monseñor Roberto López Londoño",
    address: "Banco de Alimentos, Armenia, Quindío",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Armenia",
    geoQuery: "Banco de Alimentos, Armenia, Quindío, Colombia",
    verifyToken: "Roberto López",
  },

  // --- Antioquia ----------------------------------------------------------
  {
    name: "Centro de acopio — Parque Principal de Itagüí",
    address: "Parque Principal, Itagüí, Antioquia",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Itagüí",
    geoQuery: "Parque Principal, Itagui, Antioquia, Colombia",
    verifyToken: "Itagüí",
  },

  // --- Caribe y otras regiones --------------------------------------------
  {
    name: "Centro de acopio — Galería Plaza de la Paz, Barranquilla",
    address: "Galería Plaza de la Paz, Barranquilla",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Barranquilla",
    geoQuery: "Plaza de la Paz, Barranquilla, Atlántico, Colombia",
    verifyToken: "Plaza de la Paz",
  },
  {
    name: "Centro de acopio — Coliseo Bernardo Caraballo, Cartagena",
    address: "Coliseo Bernardo Caraballo, Cartagena",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Cartagena",
    geoQuery: "Coliseo Bernardo Caraballo, Cartagena, Bolívar, Colombia",
    verifyToken: "Bernardo Caraballo",
  },
  {
    name: "Centro de acopio — Oficina de Gestión de Riesgo, Santa Marta",
    address: "Calle 16 #14A-08, Santa Marta",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Santa Marta",
    geoQuery: "Calle 16 #14A-08, Santa Marta, Magdalena, Colombia",
    verifyToken: "Santa Marta",
  },
  {
    name: "Centro de acopio — Coliseo Miguel Happy Lora, Montería",
    address: "Coliseo Miguel Happy Lora, Montería",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Montería",
    geoQuery: "Coliseo Miguel Happy Lora, Monteria, Cordoba, Colombia",
    verifyToken: "Happy Lora",
  },
  {
    name: "Centro de acopio — Centroabastos, Bucaramanga",
    address: "Centroabastos, Bucaramanga",
    materials: BASICOS,
    sourceUrl: URL,
    municipality: "Bucaramanga",
    geoQuery: "Centroabastos, Bucaramanga, Santander, Colombia",
    verifyToken: "Centroabastos",
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

export const elTiempoMapaNacional: Source = {
  id: "eltiempo-mapa-nacional",
  label: "El Tiempo — mapa nacional de centros de acopio",
  url: URL,

  async run(): Promise<RawCenter[]> {
    try {
      const text = cheerio.load(await fetchHtml(URL)).text();
      for (const c of CENTERS) {
        if (c.verifyToken && !text.includes(c.verifyToken)) {
          console.warn(
            `    [frescura] "${c.verifyToken}" ya no aparece en el mapa. Revisar a mano.`,
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
