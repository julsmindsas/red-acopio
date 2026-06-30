import type { Metadata } from "next";
import { listAllCenters } from "@/lib/centers-source";
import Header from "@/components/Header";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import Steps from "@/components/landing/Steps";
import Features from "@/components/landing/Features";
import ApiTeaser from "@/components/landing/ApiTeaser";
import OpenSource from "@/components/landing/OpenSource";
import Footer from "@/components/landing/Footer";

/*
 * Portada de la app (Server Component): la LANDING.
 * Carga los centros en el servidor solo para alimentar las métricas en vivo
 * (Stats). El resto de secciones son estáticas. El mapa interactivo vive ahora
 * en /mapa.
 */

// ISR: regenera la página cada 5 minutos para que las métricas "en vivo"
// reflejen los datos actuales (oficiales + locales) sin sacrificar velocidad.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Red de Acopio — Dónde donar para Venezuela, desde Colombia",
  description:
    "Mapa abierto y verificado de centros de acopio en Medellín y Colombia para ayudar a los afectados por los terremotos en Venezuela. Encuentra el centro más cercano, confírmalo y dona.",
  openGraph: {
    title: "Red de Acopio — Dónde donar para Venezuela, desde Colombia",
    description:
      "Mapa abierto y verificado de centros de acopio en Colombia para coordinar donaciones de ayuda humanitaria a Venezuela.",
    type: "website",
    locale: "es_CO",
  },
};

export default async function Home() {
  // Solo se usa para las métricas en vivo de la sección Stats.
  const centers = await listAllCenters();

  return (
    <>
      <Header variant="home" />

      <main className="flex flex-1 flex-col">
        <Hero />
        <Stats centers={centers} />
        <Steps />
        <Features />
        <ApiTeaser />
        <OpenSource />
      </main>

      <Footer />
    </>
  );
}
