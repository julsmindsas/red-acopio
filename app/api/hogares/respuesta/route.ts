/**
 * POST /api/hogares/respuesta — acciones del anfitrión vía enlace firmado.
 *
 * El anfitrión no tiene cuenta: su autorización ES el token HMAC que le llegó
 * al correo. Acciones:
 *   - "aceptar" / "rechazar" (token acc="responder"): responde a una solicitud
 *     concreta sobre su hogar. Aceptar ejecuta las MISMAS reglas de seguridad
 *     del emparejamiento del panel (compatibilidad, disponibilidad, máquina de
 *     estados) y genera el código mutuo; luego comparte el contacto entre las
 *     dos partes por correo — la primera y única vez que se comparte.
 *   - "pausar" / "reactivar" (token acc="pausar"): autogestión de la
 *     disponibilidad del hogar.
 *
 * Siempre POST: los enlaces del correo abren una página de confirmación
 * (/hogares/respuesta) y es esa página la que llama aquí. Un GET que mutara
 * estado sería aceptado "solo" por los escáneres de correo.
 */
import type { NextRequest } from "next/server";
import { NextResponse, after } from "next/server";
import { getHogaresRepository } from "@/lib/hogares/store";
import { razonesIncompatibilidad } from "@/lib/hogares/match";
import { generarCodigoVerificacion } from "@/lib/hogares/codigo";
import {
  verificarToken,
  enviarCorreo,
  correoAceptadaAnfitrion,
  correoAceptadaSolicitante,
  correoRechazadaSolicitante,
} from "@/lib/hogares/email";

export const dynamic = "force-dynamic";

const ACCIONES = ["aceptar", "rechazar", "pausar", "reactivar"] as const;
type Accion = (typeof ACCIONES)[number];

export async function POST(req: NextRequest) {
  let body: { token?: string; accion?: string };
  try {
    body = (await req.json()) as { token?: string; accion?: string };
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const accion = body.accion as Accion;
  if (!ACCIONES.includes(accion)) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const payload = verificarToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "El enlace no es válido o ya venció. Pide uno nuevo." },
      { status: 401 },
    );
  }

  // Cada token autoriza SOLO su familia de acciones.
  const esRespuesta = accion === "aceptar" || accion === "rechazar";
  if (esRespuesta && payload.acc !== "responder") {
    return NextResponse.json({ error: "El enlace no autoriza esto." }, { status: 403 });
  }
  if (!esRespuesta && payload.acc !== "pausar") {
    return NextResponse.json({ error: "El enlace no autoriza esto." }, { status: 403 });
  }

  const repo = getHogaresRepository();
  const hogar = await repo.getHogarById(payload.hid);
  if (!hogar) {
    return NextResponse.json(
      { error: "Este hogar ya no existe en la plataforma." },
      { status: 404 },
    );
  }

  // ---- Autogestión de disponibilidad -------------------------------------
  if (accion === "pausar" || accion === "reactivar") {
    const disponibilidad = accion === "pausar" ? "pausado" : "disponible";
    // Un hogar "ocupado" no se reactiva por enlace: hay una familia viviendo
    // allí y el cierre de ese hospedaje es quien libera la casa.
    if (accion === "reactivar" && hogar.disponibilidad === "ocupado") {
      return NextResponse.json(
        { error: "Tu hogar está hospedando a alguien; se libera al cerrar ese hospedaje." },
        { status: 409 },
      );
    }
    await repo.updateHogar(hogar.id, { disponibilidad });
    return NextResponse.json({ resultado: accion, disponibilidad });
  }

  // ---- Responder a una solicitud -----------------------------------------
  if (!payload.sid) {
    return NextResponse.json({ error: "Enlace incompleto." }, { status: 400 });
  }
  const solicitudes = await repo.listSolicitudes();
  const solicitud = solicitudes.find((s) => s.id === payload.sid);
  if (!solicitud) {
    return NextResponse.json(
      { error: "La solicitud ya no existe." },
      { status: 404 },
    );
  }
  // Solo se responde a solicitudes aún abiertas: si otra casa (o el panel) ya
  // la conectó, este enlace queda obsoleto y lo decimos con claridad.
  if (solicitud.estado !== "nueva" && solicitud.estado !== "en_proceso") {
    return NextResponse.json(
      {
        error:
          "Esta solicitud ya fue conectada con un hogar (o se cerró). No tienes que hacer nada más.",
      },
      { status: 409 },
    );
  }

  if (accion === "rechazar") {
    // Sin cambio de estado: la solicitud sigue abierta para otros hogares.
    // Al solicitante se le avisa sin revelar nada del hogar.
    if (solicitud.email) {
      const correo = correoRechazadaSolicitante(solicitud);
      const destinatario = solicitud.email;
      after(() => enviarCorreo({ to: destinatario, ...correo }));
    }
    return NextResponse.json({ resultado: "rechazada" });
  }

  // Aceptar: mismas reglas de seguridad que el emparejamiento del panel.
  const razones = razonesIncompatibilidad(hogar, solicitud);
  if (razones.length > 0) {
    return NextResponse.json(
      { error: "Tu hogar no puede recibir a este grupo.", razones },
      { status: 409 },
    );
  }

  const codigo = generarCodigoVerificacion();
  const updated = await repo.updateSolicitud(solicitud.id, {
    estado: "emparejada",
    hogarId: hogar.id,
    codigoVerificacion: codigo,
  });
  if (!updated) {
    return NextResponse.json({ error: "La solicitud ya no existe." }, { status: 404 });
  }
  await repo.updateHogar(hogar.id, { disponibilidad: "ocupado" });

  // Compartir contacto: primera y única vez, y solo entre las dos partes.
  // after(): los envíos corren garantizados tras responder (serverless).
  if (hogar.email) {
    const correo = correoAceptadaAnfitrion(hogar, solicitud, codigo);
    const destinatario = hogar.email;
    after(() => enviarCorreo({ to: destinatario, ...correo }));
  }
  if (solicitud.email) {
    const correo = correoAceptadaSolicitante(hogar, solicitud, codigo);
    const destinatario = solicitud.email;
    after(() => enviarCorreo({ to: destinatario, ...correo }));
  }

  // El anfitrión ve en pantalla el contacto y el código (el solicitante puede
  // no tener correo: entonces el anfitrión es quien llama).
  return NextResponse.json({
    resultado: "aceptada",
    codigo,
    contacto: { nombre: solicitud.nombre, telefono: solicitud.telefono },
    solicitanteNotificado: Boolean(solicitud.email),
  });
}
