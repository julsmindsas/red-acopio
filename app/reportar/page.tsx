import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import ReportForm from "@/components/ReportForm";

/*
 * Página /reportar — formulario ciudadano para recomendar un centro de acopio nuevo.
 * Incluye una nota de responsabilidad: solo deben recomendarse centros reales.
 */

export const metadata: Metadata = {
  title: "Recomendar un punto — Red de Acopio",
  description:
    "Recomienda un albergue, centro de acopio, brigada médica o punto de agua real y activo tras el sismo del 10 de agosto de 2026 en Colombia.",
};

export default function ReportarPage() {
  return (
    <>
      <Header variant="report" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {/* Encabezado de la página */}
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            <span aria-hidden="true">←</span>
            Volver al mapa
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Recomendar un punto de ayuda
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Un albergue, un centro de acopio, una brigada médica o un punto de
            agua. Tu recomendación quedará pendiente de revisión antes de
            publicarse.
          </p>
        </div>

        {/* Nota de responsabilidad (postura de datos) */}
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-900">
          <span aria-hidden="true" className="mt-px shrink-0 text-base">
            ⚠️
          </span>
          <p className="leading-relaxed">
            <strong className="font-semibold">
              Recomienda solo puntos reales que conozcas.
            </strong>{" "}
            Un dato errado puede mandar a una familia sin casa a un albergue que
            no existe. Si tienes dudas, confirma con el punto antes de
            recomendarlo.
          </p>
        </div>

        <ReportForm />
      </main>
    </>
  );
}
