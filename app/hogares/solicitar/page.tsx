import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import SolicitarForm from "@/components/hogares/SolicitarForm";

/*
 * Página /hogares/solicitar — formulario para pedir un hogar de paso.
 *
 * Server Component. Lee `?hogar=ID` de la URL (searchParams es una Promise en
 * esta versión de Next: hay que hacerle await) y se lo pasa al form para que
 * la solicitud llegue al equipo con el hogar que le interesó a la persona.
 */

export const metadata: Metadata = {
  title: "Solicitar un hogar de paso — Red de Acopio",
  description:
    "Pide hospedaje temporal en un hogar verificado para ti, tu familia y tus mascotas tras el sismo del 10 de agosto de 2026 en Colombia. Tu solicitud es privada.",
};

export default async function SolicitarHogarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Si vienen varios ?hogar=, nos quedamos con el primero: a la persona le
  // interesó una tarjeta concreta, no una lista.
  const { hogar } = await searchParams;
  const hogarCrudo = (Array.isArray(hogar) ? hogar[0] : hogar)?.trim() || null;
  // Solo aceptamos ids con el formato real del dominio: este valor termina en
  // las notas que lee el equipo coordinador, y un enlace manipulado no debe
  // poder inyectarles texto arbitrario.
  const hogarInteres =
    hogarCrudo && /^hogar-[0-9a-f]{8}$/.test(hogarCrudo) ? hogarCrudo : null;

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
            Solicitar un hogar de paso
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Si tú o tu familia se quedaron sin dónde dormir, cuéntanos quiénes
            son y dónde están para conectarte con un hogar que respete tus
            preferencias; las mascotas también cuentan.
          </p>
        </div>

        {/* Cómo funciona: reglas de seguridad antes de llenar nada */}
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-900">
          <span aria-hidden="true" className="mt-px shrink-0 text-base">
            🛡️
          </span>
          <p className="leading-relaxed">
            <strong className="font-semibold">
              Tu solicitud es privada y tus datos no se publican.
            </strong>{" "}
            Al concretarse un hospedaje, tú y la familia anfitriona tendrán el
            mismo código para compararlo al llegar. Ten en cuenta: la
            plataforma no verifica a las personas — confirma los datos por tu
            cuenta antes de llegar a una casa.
          </p>
        </div>

        <SolicitarForm hogarInteres={hogarInteres} />
      </main>
    </>
  );
}
