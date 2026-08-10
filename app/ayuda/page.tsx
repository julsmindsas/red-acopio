import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import HelpChannels from "@/components/HelpChannels";
import { EMERGENCY } from "@/lib/constants";

/*
 * Página /ayuda (Server Component).
 *
 * Responde las preguntas que el mapa no puede responder: a quién llamar en una
 * emergencia, cómo buscar a un familiar y dónde donar dinero. Es contenido
 * estático y sin JavaScript de cliente, para que cargue en una conexión mala.
 */

export const metadata: Metadata = {
  title: "Cómo ayudar — Red de Acopio",
  description:
    "Canales oficiales tras el sismo del 10 de agosto de 2026 en Colombia: línea de emergencias, búsqueda de familiares y donaciones verificadas.",
};

export default function AyudaPage() {
  const fecha = new Date(EMERGENCY.occurredAt).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });

  return (
    <>
      <Header variant="home" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Cómo ayudar ahora
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
          Sismo de magnitud {EMERGENCY.magnitude} con epicentro en{" "}
          {EMERGENCY.epicenter}, el {fecha}. Estos son los canales oficiales
          para atender la emergencia, buscar a un familiar y donar.
        </p>

        <div className="mt-6">
          <HelpChannels />
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-surface-muted p-5">
          <h2 className="text-sm font-bold text-foreground">
            ¿Vas a donar en especie?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
            Consulta el mapa antes de salir: muestra qué recibe cada punto, qué
            pidió <strong>no</strong> seguir recibiendo y cuáles están
            saturados.
          </p>
          <Link
            href="/mapa"
            className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700"
          >
            <span aria-hidden="true">🗺️</span>
            Ver el mapa de puntos
          </Link>
        </div>
      </main>
    </>
  );
}
