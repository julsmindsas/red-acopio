import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import OfrecerForm from "@/components/hogares/OfrecerForm";

/*
 * Página /hogares/ofrecer — formulario para ofrecer la casa como hogar de paso.
 * Server Component: solo monta el encabezado y el form (client component).
 */

export const metadata: Metadata = {
  title: "Ofrecer mi hogar — Red de Acopio",
  description:
    "Ofrece tu casa como hogar de paso para familias y mascotas damnificadas por el sismo del 10 de agosto de 2026 en Colombia. Tus datos nunca se publican.",
};

export default function OfrecerHogarPage() {
  return (
    <>
      <Header variant="report" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {/* Encabezado de la página */}
        <div className="mb-5">
          <Link
            href="/hogares"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            <span aria-hidden="true">←</span>
            Volver a hogares de paso
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Ofrecer mi hogar
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Abre las puertas de tu casa por unos días, semanas o más para una
            familia (o sus mascotas) que perdió la suya en el sismo. El equipo
            coordinador media todo el contacto.
          </p>
        </div>

        {/* Cómo funciona: la persona debe entenderlo ANTES de llenar nada */}
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-900">
          <span aria-hidden="true" className="mt-px shrink-0 text-base">
            🛡️
          </span>
          <p className="leading-relaxed">
            <strong className="font-semibold">
              Nadie llega a tu casa sin coordinación.
            </strong>{" "}
            Primero te llamamos para verificar tus datos; solo entonces tu hogar
            aparece en la lista, sin nombre ni dirección. Al emparejarte con
            alguien, ambos reciben el mismo código y lo comparan al llegar.
          </p>
        </div>

        <OfrecerForm />
      </main>
    </>
  );
}
