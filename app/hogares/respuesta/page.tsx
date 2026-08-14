import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import RespuestaAcciones from "@/components/hogares/RespuestaAcciones";
import { getHogaresRepository } from "@/lib/hogares/store";
import { verificarToken } from "@/lib/hogares/email";
import { ACEPTA_LABELS, retirarDatosDeContacto } from "@/lib/hogares/types";

/*
 * Página /hogares/respuesta — a donde llegan los enlaces firmados del correo
 * del anfitrión (responder a una solicitud, o pausar/reactivar su hogar).
 *
 * El GET SOLO muestra información y botones; la acción real es un POST a
 * /api/hogares/respuesta. Esto es deliberado: los escáneres de los clientes de
 * correo pre-visitan los enlaces, y un GET que mutara aceptaría solicitudes
 * sin que el anfitrión lo supiera.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Responder — Hogares de paso | Red de Acopio",
  robots: { index: false },
};

function Invalido({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-6 text-center">
      <span aria-hidden="true" className="text-3xl">⏳</span>
      <h1 className="mt-2 text-lg font-bold text-foreground">{mensaje}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/70">
        Los enlaces del correo vencen por seguridad. Si crees que esto es un
        error, revisa el correo más reciente que te enviamos.
      </p>
      <Link
        href="/hogares"
        className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Ir a hogares de paso
      </Link>
    </div>
  );
}

export default async function RespuestaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await searchParams;
  const tokenStr = (Array.isArray(token) ? token[0] : token) ?? "";
  const payload = verificarToken(tokenStr);

  let contenido: React.ReactNode;

  if (!payload) {
    contenido = <Invalido mensaje="Este enlace no es válido o ya venció" />;
  } else {
    const repo = getHogaresRepository();
    const hogar = await repo.getHogarById(payload.hid);

    if (!hogar) {
      contenido = <Invalido mensaje="Este hogar ya no existe" />;
    } else if (payload.acc === "pausar") {
      // ---- Autogestión del hogar ----
      contenido = (
        <>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tu hogar en {hogar.ciudad}
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Estado actual:{" "}
            <strong className="text-foreground">
              {hogar.disponibilidad === "pausado"
                ? "en pausa (no aparece en la lista)"
                : hogar.disponibilidad === "ocupado"
                  ? "hospedando a alguien"
                  : "disponible y publicado"}
            </strong>
            . Puedes pausarlo o reactivarlo cuando quieras; nadie más tiene este
            enlace.
          </p>
          <div className="mt-5">
            <RespuestaAcciones
              token={tokenStr}
              modo="hogar"
              disponibilidadInicial={hogar.disponibilidad}
            />
          </div>
        </>
      );
    } else {
      // ---- Responder a una solicitud ----
      const solicitudes = await repo.listSolicitudes();
      const solicitud = solicitudes.find((s) => s.id === payload.sid);

      if (!solicitud) {
        contenido = <Invalido mensaje="La solicitud ya no existe" />;
      } else if (
        solicitud.estado !== "nueva" &&
        solicitud.estado !== "en_proceso"
      ) {
        contenido = (
          <div className="rounded-2xl border border-border bg-surface-muted p-6 text-center">
            <span aria-hidden="true" className="text-3xl">✅</span>
            <h1 className="mt-2 text-lg font-bold text-foreground">
              Esta solicitud ya fue atendida
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/70">
              Otro hogar (o el equipo) ya la conectó, o se cerró. No tienes que
              hacer nada más — gracias por estar pendiente.
            </p>
          </div>
        );
      } else {
        const notas = retirarDatosDeContacto(solicitud.notas);
        contenido = (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Una familia quiere hospedarse contigo
            </h1>
            <p className="mt-2 text-sm text-foreground/70">
              Este es el resumen del grupo. Por seguridad de ambas partes, sus
              datos personales solo se comparten si aceptas.
            </p>

            <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
              <ul className="flex flex-col gap-2 text-sm text-foreground/85">
                <li>
                  <strong className="text-foreground">Grupo:</strong>{" "}
                  {solicitud.personas === 0
                    ? "Solo animales rescatados (ninguna persona)"
                    : `${solicitud.personas} ${solicitud.personas === 1 ? "persona" : "personas"}`}
                </li>
                <li>
                  <strong className="text-foreground">Quiénes son:</strong>{" "}
                  {solicitud.composicion
                    .map((c) => ACEPTA_LABELS[c].toLowerCase())
                    .join(", ")}
                </li>
                <li>
                  <strong className="text-foreground">Ciudad:</strong>{" "}
                  {solicitud.ciudad}
                </li>
                {notas && (
                  <li>
                    <strong className="text-foreground">Notas:</strong> {notas}
                  </li>
                )}
              </ul>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/70">
              Si aceptas: tú y esa persona reciben el contacto del otro y un
              código de confirmación para compararlo al llegar. Si no puedes:
              la solicitud sigue abierta para otros hogares y nadie sabrá de ti.
            </p>

            <div className="mt-5">
              <RespuestaAcciones token={tokenStr} modo="responder" />
            </div>
          </>
        );
      }
    }
  }

  return (
    <>
      <Header variant="report" />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">{contenido}</main>
    </>
  );
}
