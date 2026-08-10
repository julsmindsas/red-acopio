import type { Metadata } from "next";
import Link from "next/link";
import { listAllCenters } from "@/lib/centers-source";
import { MATERIAL_CATEGORIES } from "@/lib/constants";
import type { MaterialCategory } from "@/lib/types";
import Header from "@/components/Header";
import HomeView from "@/components/HomeView";
import EmptyState from "@/components/EmptyState";
import { findIntent } from "@/lib/intents";

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
  title: "Mapa de albergues y centros de acopio — Red de Acopio",
  description:
    "Mapa de albergues, centros de acopio, brigadas médicas y puntos de agua tras el sismo del 10 de agosto de 2026 en Colombia. Ordena por cercanía y filtra por tipo de punto.",
};

export default async function MapaPage({
  searchParams,
}: {
  // En Next 16 `searchParams` es asíncrono: hay que await-earlo antes de leerlo.
  searchParams: Promise<{
    material?: string | string[];
    necesito?: string | string[];
  }>;
}) {
  const centers = await listAllCenters();

  // Deep-link de material (p. ej. /mapa?material=mascotas). Tomamos el primer
  // valor si vinieran varios y solo lo aceptamos si es una categoría válida.
  const sp = await searchParams;
  const rawMaterial = Array.isArray(sp.material) ? sp.material[0] : sp.material;
  const initialMaterial = MATERIAL_CATEGORIES.includes(
    rawMaterial as MaterialCategory,
  )
    ? (rawMaterial as MaterialCategory)
    : undefined;

  // Deep-link de intención (p. ej. /mapa?necesito=refugio): permite llegar a la
  // vista ya filtrada desde la portada, sin tocar un solo control.
  const rawIntent = Array.isArray(sp.necesito) ? sp.necesito[0] : sp.necesito;
  const initialKinds = findIntent(rawIntent)?.kinds;

  return (
    <>
      <Header variant="home" />

      {centers.length === 0 ? (
        // Estado amable cuando todavía no hay centros cargados.
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16">
          <EmptyState
            icon="🗺️"
            title="Aún no hay puntos publicados"
            message="Todavía no tenemos albergues ni centros de acopio registrados para esta emergencia. Si conoces uno real y activo, ayúdanos a mapearlo."
            action={
              <Link
                href="/reportar"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700"
              >
                <span aria-hidden="true">＋</span>
                Recomendar un punto
              </Link>
            }
          />
        </main>
      ) : (
        <main className="flex flex-1 flex-col">
          <HomeView
            centers={centers}
            initialMaterial={initialMaterial}
            initialKinds={initialKinds}
          />
        </main>
      )}
    </>
  );
}
