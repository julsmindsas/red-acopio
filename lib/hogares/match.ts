/**
 * Compatibilidad entre solicitudes y hogares.
 *
 * Vive en `lib/` y no en el panel porque codifica reglas de seguridad, no
 * preferencias de UI: un hogar incompatible no debe ni siquiera aparecer como
 * opción para el equipo. La decisión final sigue siendo humana (el equipo
 * llama a ambas partes); esto solo garantiza que las opciones sobre la mesa
 * respetan lo que cada quien declaró.
 */
import type { Hogar, SolicitudHogar, Seguimiento } from "./types";

/** Compara ciudades sin sensibilidad a mayúsculas ni tildes. */
function mismaCiudad(a: string, b: string): boolean {
  const limpiar = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  return limpiar(a) === limpiar(b);
}

/**
 * Razones por las que un hogar NO puede recibir una solicitud.
 * Vacío = compatible. Se devuelven todas (no solo la primera) para que el
 * panel pueda explicar el porqué en lugar de esconder el hogar sin más.
 */
export function razonesIncompatibilidad(
  hogar: Hogar,
  solicitud: SolicitudHogar,
): string[] {
  const razones: string[] = [];

  if (hogar.verificacion !== "verificado") {
    razones.push("El hogar aún no está verificado.");
  }
  if (hogar.disponibilidad !== "disponible") {
    razones.push("El hogar no está disponible ahora.");
  }
  if (hogar.capacidad < solicitud.personas) {
    razones.push(
      `Capacidad insuficiente: caben ${hogar.capacidad} y son ${solicitud.personas}.`,
    );
  }

  // Cada tipo de integrante del grupo debe estar aceptado por el hogar.
  const noAceptados = solicitud.composicion.filter(
    (c) => !hogar.acepta.includes(c),
  );
  if (noAceptados.length > 0) {
    razones.push(`El hogar no recibe: ${noAceptados.join(", ")}.`);
  }

  // Las preferencias de convivencia de quien llega son un veto duro:
  // si declaró con qué hogares se sentiría segura, no se le ofrecen otros.
  if (
    solicitud.preferencias.length > 0 &&
    !solicitud.preferencias.includes(hogar.convivencia)
  ) {
    razones.push("La convivencia del hogar no coincide con sus preferencias.");
  }

  return razones;
}

/** `true` si el hogar puede recibir a la solicitud sin violar ninguna regla. */
export function esCompatible(hogar: Hogar, solicitud: SolicitudHogar): boolean {
  return razonesIncompatibilidad(hogar, solicitud).length === 0;
}

/**
 * Hogares compatibles ordenados: primero los de la misma ciudad (el arraigo
 * importa: colegio, trabajo, red de apoyo), luego el resto.
 */
export function hogaresCompatibles(
  hogares: Hogar[],
  solicitud: SolicitudHogar,
): Hogar[] {
  return hogares
    .filter((h) => esCompatible(h, solicitud))
    .sort((a, b) => {
      const aLocal = mismaCiudad(a.ciudad, solicitud.ciudad) ? 0 : 1;
      const bLocal = mismaCiudad(b.ciudad, solicitud.ciudad) ? 0 : 1;
      return aLocal - bLocal;
    });
}

/** Hito de seguimiento que toca hacer, o `null` si no hay ninguno pendiente. */
export function seguimientoPendiente(
  solicitud: SolicitudHogar,
  ahora: Date = new Date(),
): "48h" | "7d" | null {
  if (solicitud.estado !== "hospedada" || !solicitud.hospedadaAt) return null;

  const llegada = new Date(solicitud.hospedadaAt).getTime();
  const horas = (ahora.getTime() - llegada) / 36e5;
  const hechos = new Set(solicitud.seguimientos.map((s: Seguimiento) => s.hito));

  // El de 48h prima aunque también toque el de 7 días: se registran en orden.
  if (horas >= 48 && !hechos.has("48h")) return "48h";
  if (horas >= 24 * 7 && !hechos.has("7d")) return "7d";
  return null;
}
