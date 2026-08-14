import type { Metadata } from "next";
import { listAllCenters } from "@/lib/centers-source";
import Header from "@/components/Header";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import Steps from "@/components/landing/Steps";
import Features from "@/components/landing/Features";
import MascotasSection from "@/components/landing/MascotasSection";
import HogaresSection from "@/components/landing/HogaresSection";
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
  title: "Red de Acopio — Dónde refugiarse y dónde donar, sismo Colombia 2026",
  description:
    "Mapa abierto de albergues, centros de acopio, brigadas médicas y puntos de agua tras el sismo de magnitud 7.4 del 10 de agosto de 2026 en Colombia. Encuentra el punto más cercano y confírmalo antes de ir.",
  openGraph: {
    title: "Red de Acopio — Dónde refugiarse y dónde donar, sismo Colombia 2026",
    description:
      "Albergues, acopios, brigadas médicas y puntos de agua en Manizales, Pereira, Armenia, Cali y Quibdó tras el sismo del 10 de agosto de 2026.",
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
        {/* Hogares de paso va antes que mascotas: dormir bajo techo es más
            urgente que donar insumos, y ambos paneles cuentan la misma
            historia de cuidado (personas primero, sus animales después). */}
        <HogaresSection />
        <MascotasSection />
        <ApiTeaser />
        <OpenSource />
      </main>

      <Footer />
    </>
  );
}
