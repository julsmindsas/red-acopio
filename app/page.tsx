import { getRepository } from "@/lib/db";
import Header from "@/components/Header";
import HomeView from "@/components/HomeView";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

/*
 * Página de inicio (Server Component).
 * Carga los centros en el servidor desde el repositorio de datos y los entrega
 * a <HomeView> (cliente) para la interacción (mapa, filtros, geolocalización).
 */

export default async function Home() {
  const centers = await getRepository().list();

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
                Reportar un centro
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
