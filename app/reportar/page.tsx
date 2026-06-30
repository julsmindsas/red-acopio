import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import ReportForm from "@/components/ReportForm";

/*
 * Página /reportar — formulario ciudadano para mapear un centro de acopio nuevo.
 * Incluye una nota de responsabilidad: solo deben reportarse centros reales.
 */

export const metadata: Metadata = {
  title: "Reportar un centro — Red de Acopio",
  description:
    "Reporta un centro de acopio real y activo en Medellín para que más personas puedan donar ayuda humanitaria.",
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
            Reportar un centro de acopio
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Ayuda a que la comunidad encuentre dónde donar. Tu reporte quedará
            pendiente de revisión antes de publicarse.
          </p>
        </div>

        {/* Nota de responsabilidad (postura de datos) */}
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-900">
          <span aria-hidden="true" className="mt-px shrink-0 text-base">
            ⚠️
          </span>
          <p className="leading-relaxed">
            <strong className="font-semibold">
              Reporta solo centros reales que conozcas.
            </strong>{" "}
            La información errónea desperdicia el esfuerzo de quienes donan y de
            quienes coordinan la ayuda. Si tienes dudas, confirma con el centro
            antes de reportarlo.
          </p>
        </div>

        <ReportForm />
      </main>
    </>
  );
}
