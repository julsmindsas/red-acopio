/**
 * "Subasta silenciosa": el mecanismo que hace autónoma la plataforma.
 *
 * Cuando alguien registra una necesidad de hospedaje sin elegir una casa
 * concreta, no hay nadie que la tome y la empareje a mano — asumirlo sería
 * mentirle a una familia que se quedó sin techo. Así que el servidor le
 * escribe a TODOS los hogares compatibles y el primero que acepta se queda
 * con el match; a los demás, si abren su enlace después, la ruta de respuesta
 * les dice que la solicitud ya fue atendida.
 *
 * Reglas que sostienen el diseño:
 *   - Solo se invita a hogares que pasan `hogaresCompatibles` (capacidad,
 *     composición y preferencias de convivencia son veto duro).
 *   - Nunca se le escribe dos veces al mismo anfitrión por la misma solicitud:
 *     `solicitud.invitados` acumula a quién ya se le preguntó.
 *   - Hay un tope por ronda: una emergencia no justifica inundar buzones, y un
 *     anfitrión que recibe diez avisos deja de leerlos.
 */
import type { Hogar, SolicitudHogar } from "./types";
import { hogaresCompatibles } from "./match";
import type { HogaresRepository } from "./store";
import {
  baseUrl,
  correoNuevaSolicitud,
  crearToken,
  enlacesHabilitados,
  enviarCorreo,
} from "./email";

/**
 * Cuántos hogares se invitan por ronda. Cinco es suficiente para que alguien
 * responda pronto sin convertir el programa en spam; si ninguno acepta, el
 * panel puede lanzar otra ronda y entrarán los siguientes.
 */
const TOPE_POR_RONDA = 5;

export interface ResultadoSubasta {
  /** Hogares a los que se les envió la invitación en esta ronda. */
  invitados: string[];
  /** Compatibles que quedaron fuera por el tope (entran en la próxima ronda). */
  pendientes: number;
}

/**
 * Invita a los hogares compatibles que aún no han sido invitados.
 *
 * `hogarId` fuerza la invitación a un hogar concreto (lo usa el botón
 * "Solicitar este hogar" y el panel cuando el equipo quiere preguntarle a una
 * casa puntual); en ese caso se salta el tope pero NO las reglas de
 * compatibilidad, porque esas protegen a quien llega.
 */
export async function invitarHogares(
  repo: HogaresRepository,
  solicitud: SolicitudHogar,
  opts: { hogarId?: string | null } = {},
): Promise<ResultadoSubasta> {
  // Sin secreto de firma no hay enlaces de aprobación que enviar.
  if (!enlacesHabilitados()) return { invitados: [], pendientes: 0 };
  // Una solicitud ya emparejada, hospedada o cerrada no admite más invitaciones.
  if (solicitud.estado !== "nueva" && solicitud.estado !== "en_proceso") {
    return { invitados: [], pendientes: 0 };
  }

  const todos = await repo.listHogares();
  const yaInvitados = new Set(solicitud.invitados);

  let candidatos: Hogar[];
  if (opts.hogarId) {
    const elegido = todos.find((h) => h.id === opts.hogarId);
    // Se pasa por el mismo filtro de compatibilidad: una casa elegida a dedo
    // tampoco puede violar las preferencias de quien llega.
    candidatos = elegido ? hogaresCompatibles([elegido], solicitud) : [];
  } else {
    candidatos = hogaresCompatibles(todos, solicitud);
  }

  // Solo hogares con correo (sin canal no hay a quién preguntarle) y a los que
  // no se les haya escrito ya por esta solicitud.
  const nuevos = candidatos.filter(
    (h) => h.email && !yaInvitados.has(h.id),
  );
  const ronda = opts.hogarId ? nuevos : nuevos.slice(0, TOPE_POR_RONDA);
  if (ronda.length === 0) {
    return { invitados: [], pendientes: 0 };
  }

  const enviados: string[] = [];
  for (const hogar of ronda) {
    const token = crearToken(
      { acc: "responder", hid: hogar.id, sid: solicitud.id },
      14,
    );
    const url = `${baseUrl()}/hogares/respuesta?token=${encodeURIComponent(token)}`;
    // `varios` cambia el copy: si compite con otros hogares hay que decírselo,
    // tanto por honestidad como porque anima a responder pronto.
    const correo = correoNuevaSolicitud(hogar, solicitud, url, {
      varios: !opts.hogarId && ronda.length > 1,
    });
    const ok = await enviarCorreo({ to: hogar.email!, ...correo });
    if (ok) enviados.push(hogar.id);
  }

  if (enviados.length > 0) {
    await repo.updateSolicitud(solicitud.id, {
      invitados: [...solicitud.invitados, ...enviados],
    });
  }

  return {
    invitados: enviados,
    pendientes: Math.max(0, nuevos.length - ronda.length),
  };
}
