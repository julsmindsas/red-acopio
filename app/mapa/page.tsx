import type { Metadata } from "next";
import Link from "next/link";
import { listAllCenters } from "@/lib/centers-source";
import Header from "@/components/Header";
import HomeView from "@/components/HomeView";
import EmptyState from "@/components/EmptyState";

/*
 * Página /mapa (Server Component).
 * Carga los centros en el servidor desde la FUENTE HÍBRIDA (centros oficiales
 * de acopiove.org + nuestros centros locales, ya deduplicados) y los entrega
 * a <HomeView> (cliente) para la interacción (mapa, filtros, geolocalización).
 *
 * Antes vivía en app/page.tsx; ahora la portada es la landing y el mapa tiene
 * su propia ruta.
 */

export const metadata: Metadata = {
  title: "Mapa de centros de acopio — Red de Acopio",
  description:
    "Explora el mapa de centros de acopio en Medellín y Colombia para donar ayuda humanitaria a Venezuela. Ordena por cercanía y filtra por material.",
};

export default async function MapaPage() {
  const centers = await listAllCenters();

  return (
    <>
      <Header variant="home" />

      {centers.length === 0 ? (
        // Estado amable cuando todavía no hay centros cargados.
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16">
          <EmptyState
            icon="🗺️"
            title="Aún no hay centros publicados"
            message="Todavía no tenemos centros de acopio registrados. Si conoces uno real y activo, ayúdanos a mapearlo para que más personas puedan donar."
            action={
              <Link
                href="/reportar"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700"
              >
                <span aria-hidden="true">＋</span>
                Recomendar un centro de acopio
              </Link>
            }
          />
        </main>
      ) : (
        <main className="flex flex-1 flex-col">
          <HomeView centers={centers} />
        </main>
      )}
    </>
  );
}
