import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import HelpChannels from "@/components/HelpChannels";
import SubsidioArriendo from "@/components/SubsidioArriendo";
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

        {/* Va antes que los canales: perder la casa es el problema que dura
            meses, y esta ayuda ya está aprobada pero casi nadie la conoce. */}
        <div className="mt-6">
          <SubsidioArriendo />
        </div>

        {/* Mismo público que el subsidio: quien perdió la casa. Los hogares de
            paso resuelven el "esta noche" mientras el subsidio resuelve los
            meses; por eso van juntos y sin repetir la explicación completa. */}
        <div className="mt-4 rounded-2xl border border-border bg-surface-muted p-5">
          <h2 className="text-sm font-bold text-foreground">
            <span aria-hidden="true">🏡</span> ¿Necesitas dónde quedarte ya?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
            Hay familias que abren su casa para hospedar temporalmente a
            damnificados, con mascotas incluidas. La plataforma protege tus
            datos: nadie ve tu teléfono ni tu dirección.
          </p>
          <Link
            href="/hogares"
            className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700"
          >
            <span aria-hidden="true">🏡</span>
            Ver hogares de paso
          </Link>
        </div>

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
