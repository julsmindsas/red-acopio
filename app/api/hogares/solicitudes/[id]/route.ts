/**
 * PATCH /api/hogares/solicitudes/[id] — gestión de una solicitud (panel del equipo).
 *
 * Protegida con la misma cookie de sesión HMAC que las rutas admin de centros.
 * En Next.js 16 los params de ruta dinámica son asíncronos.
 *
 * Reglas de negocio del ciclo de vida (el servidor las aplica SIEMPRE; la UI
 * es solo una de las formas de invocar esta ruta y no se confía en ella):
 *
 * - Máquina de estados: solo se aceptan las transiciones del ciclo real.
 *   Una solicitud "cerrada" no revive y nadie queda "hospedada" sin haber
 *   pasado por un emparejamiento.
 * - Emparejar: exige un hogar verificado, disponible y COMPATIBLE (las mismas
 *   reglas de lib/hogares/match.ts que ve el panel: capacidad, composición y
 *   preferencias de convivencia — el veto de seguridad de quien llega no es
 *   negociable ni por el propio equipo vía API). El servidor genera el código
 *   mutuo que ambas partes comparan al llegar; el cliente no puede fijarlo.
 * - Hospedar: al pasar a "hospedada", el servidor sella hospedadaAt con SU
 *   reloj (nunca el del cliente): de esa fecha se calculan los seguimientos
 *   de 48h y 7 días. El store garantiza que el sello no se sobreescribe.
 * - Cerrar / deshacer emparejamiento: el hogar asignado vuelve a "disponible"
 *   solo si estaba "ocupado" (no pisa una pausa pedida por el anfitrión) y
 *   ninguna otra solicitud activa lo tiene asignado.
 * - Seguimientos: el historial solo crece. Un patch que elimine llamadas ya
 *   registradas (incluidas las de alerta) se rechaza: es rastro de seguridad.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { verifySessionToken, ADMIN_COOKIE } from "@/lib/auth";
import { solicitudPatchSchema } from "@/lib/hogares/validation";
import {
  getHogaresRepository,
  type SolicitudPatchServidor,
} from "@/lib/hogares/store";
import { razonesIncompatibilidad } from "@/lib/hogares/match";
import type { Seguimiento, SolicitudEstado } from "@/lib/hogares/types";
import { formatZodErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L, 8/B...): el código se
 * dicta por teléfono y se compara a ojo en la puerta de una casa, muchas veces
 * escrito a mano. Cada carácter debe ser inconfundible.
 */
const CODIGO_ALFABETO = "ACDEFHJKMNPRTUVWXY34679";

/** Genera un código de verificación de 6 caracteres (aleatoriedad de crypto). */
function generarCodigoVerificacion(): string {
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += CODIGO_ALFABETO[randomInt(CODIGO_ALFABETO.length)];
  }
  return codigo;
}

/** Comprueba si el error proviene del store de solo lectura. */
function isReadOnlyError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("READ_ONLY_STORE");
}

/**
 * Transiciones de estado permitidas. Todo lo que no esté aquí se rechaza:
 * los estados codifican compromisos con personas reales (un hogar ocupado,
 * un seguimiento activo) y un salto arbitrario los rompe en silencio.
 */
const TRANSICIONES: Record<SolicitudEstado, SolicitudEstado[]> = {
  nueva: ["en_proceso", "emparejada", "cerrada"],
  en_proceso: ["nueva", "emparejada", "cerrada"],
  // "emparejada" → "en_proceso" deshace el match (el hogar se libera).
  // "emparejada" → "emparejada" re-empareja con otro hogar (se re-valida todo).
  emparejada: ["en_proceso", "emparejada", "hospedada", "cerrada"],
  hospedada: ["cerrada"],
  cerrada: [],
};

/**
 * `true` si cada seguimiento ya registrado sigue presente en la lista nueva.
 * El historial es un rastro de seguridad (incluye alertas con `bien: false`):
 * solo se permite añadir, nunca reescribir ni borrar.
 */
function conservaHistorial(
  existentes: Seguimiento[],
  nuevos: Seguimiento[],
): boolean {
  const huellas = new Set(nuevos.map((s) => JSON.stringify(s)));
  return existentes.every((s) => huellas.has(JSON.stringify(s)));
}

/**
 * Libera un hogar que deja de estar asignado a `solicitudId`, con dos
 * salvaguardas: no pisa una pausa del anfitrión (solo "ocupado" → "disponible")
 * y no libera si otra solicitud activa sigue apuntando al mismo hogar (dos
 * emparejamientos históricos al mismo techo no deben dejar a una familia
 * "invisible" viviendo en una casa marcada como libre).
 */
async function liberarHogarSiCorresponde(
  repo: ReturnType<typeof getHogaresRepository>,
  hogarId: string,
  solicitudId: string,
): Promise<void> {
  const hogar = await repo.getHogarById(hogarId);
  if (!hogar || hogar.disponibilidad !== "ocupado") return;

  const solicitudes = await repo.listSolicitudes();
  const otraActiva = solicitudes.some(
    (s) =>
      s.id !== solicitudId &&
      s.hogarId === hogarId &&
      (s.estado === "emparejada" || s.estado === "hospedada"),
  );
  if (!otraActiva) {
    await repo.updateHogar(hogarId, { disponibilidad: "disponible" });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  // 1. Autenticación antes de cualquier operación.
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Params asincrónicos (Next.js 16).
  const { id } = await ctx.params;

  // 3. Parsear y validar cuerpo.
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido o vacío" },
      { status: 400 },
    );
  }

  const result = solicitudPatchSchema.safeParse(rawBody);
  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos", fields: formatZodErrors(result.error) },
      { status: 400 },
    );
  }

  // El tipo del servidor admite hospedadaAt y codigoVerificacion; el zod
  // `.strict()` de arriba ya garantizó que el cliente NO pudo enviarlos.
  // Los seguimientos, en cambio, sí vienen del panel (lista completa validada).
  const patch: SolicitudPatchServidor = { ...result.data };
  const repo = getHogaresRepository();

  try {
    // 4. La solicitud actual gobierna qué transiciones e historial son válidos.
    // (El repositorio no expone getSolicitudById: la lista completa es pequeña
    // —un equipo humano la gestiona a mano— y esta ruta ya es del panel.)
    const solicitudes = await repo.listSolicitudes();
    const actual = solicitudes.find((s) => s.id === id);
    if (!actual) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 },
      );
    }

    // 5. Máquina de estados: se rechaza todo salto fuera del ciclo real.
    if (patch.estado !== undefined && patch.estado !== actual.estado) {
      if (!TRANSICIONES[actual.estado].includes(patch.estado)) {
        return NextResponse.json(
          {
            error: `Una solicitud "${actual.estado}" no puede pasar a "${patch.estado}".`,
          },
          { status: 409 },
        );
      }
    }

    // 6. El hogar solo se asigna emparejando; un hogarId suelto en otro estado
    // crearía una asignación sin código ni ocupación (incoherente).
    if (patch.hogarId != null && patch.estado !== "emparejada") {
      return NextResponse.json(
        { error: "El hogar se asigna únicamente al emparejar." },
        { status: 400 },
      );
    }

    // 7. Historial de seguimientos: solo crece (es rastro de seguridad).
    if (
      patch.seguimientos !== undefined &&
      !conservaHistorial(actual.seguimientos, patch.seguimientos)
    ) {
      return NextResponse.json(
        {
          error:
            "El historial de seguimientos no se puede borrar ni editar; solo añadir llamadas nuevas.",
        },
        { status: 409 },
      );
    }

    // 8. Emparejar (o re-emparejar con OTRO hogar): el servidor re-valida las
    // reglas de seguridad aunque el panel ya las haya mostrado — la UI es solo
    // uno de los clientes posibles de esta API.
    const emparejando =
      patch.estado === "emparejada" &&
      (actual.estado !== "emparejada" ||
        (patch.hogarId != null && patch.hogarId !== actual.hogarId));

    if (emparejando) {
      if (!patch.hogarId) {
        return NextResponse.json(
          { error: "Para emparejar indica el hogar." },
          { status: 400 },
        );
      }
      const hogar = await repo.getHogarById(patch.hogarId);
      if (!hogar) {
        return NextResponse.json(
          { error: "El hogar indicado no existe" },
          { status: 400 },
        );
      }
      // Verificación, disponibilidad, capacidad, composición y preferencias
      // de convivencia: exactamente las mismas reglas que ve el equipo.
      const razones = razonesIncompatibilidad(hogar, actual);
      if (razones.length > 0) {
        return NextResponse.json(
          { error: "El hogar no puede recibir esta solicitud.", razones },
          { status: 409 },
        );
      }
      // Código nuevo SIEMPRE que se (re)empareja: si cambió el hogar, el
      // código anterior ya se dictó a otra casa y no puede seguir valiendo.
      patch.codigoVerificacion = generarCodigoVerificacion();
    }

    // 9. Deshacer un emparejamiento (volver a "en_proceso"): el hogar y el
    // código quedan limpios; un código huérfano abriría la puerta equivocada.
    const deshaciendo =
      actual.estado === "emparejada" && patch.estado === "en_proceso";
    if (deshaciendo) {
      patch.hogarId = null;
      patch.codigoVerificacion = null;
    }

    // 10. Llegada: sello con el reloj del servidor. De esta fecha dependen los
    // hitos de 48h/7d; una fecha del cliente los correría. El store no re-sella.
    if (patch.estado === "hospedada" && actual.estado !== "hospedada") {
      patch.hospedadaAt = new Date().toISOString();
    }

    const updated = await repo.updateSolicitud(id, patch);
    if (updated === null) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 },
      );
    }

    // 11. Consecuencias sobre los hogares, DESPUÉS del hecho principal:
    //     - el hogar recién emparejado queda "ocupado";
    //     - el hogar anterior (re-match o deshacer) se libera con salvaguardas;
    //     - al cerrar, el hogar asignado se libera con las mismas salvaguardas.
    if (emparejando) {
      await repo.updateHogar(patch.hogarId!, { disponibilidad: "ocupado" });
    }
    if ((emparejando || deshaciendo) && actual.hogarId && actual.hogarId !== patch.hogarId) {
      await liberarHogarSiCorresponde(repo, actual.hogarId, id);
    }
    if (
      patch.estado === "cerrada" &&
      actual.estado !== "cerrada" &&
      updated.hogarId
    ) {
      await liberarHogarSiCorresponde(repo, updated.hogarId, id);
    }

    // Ruta autenticada del equipo: devuelve la solicitud completa (incluido
    // el código, que el equipo comunica por teléfono a ambas partes).
    return NextResponse.json(updated);
  } catch (err) {
    if (isReadOnlyError(err)) {
      return NextResponse.json(
        { error: "Almacenamiento de solo lectura; configura Postgres." },
        { status: 503 },
      );
    }
    throw err;
  }
}
