import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/*
 * Layout raíz de la aplicación.
 * - `lang="es"` para lectores de pantalla y SEO en español.
 * - Conservamos las fuentes Geist (variables CSS) que ya estaban configuradas.
 * - `metadata` y `viewport` son exports separados en Next.js 16 (App Router).
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Red de Acopio — Centros de acopio cercanos",
  description:
    "Encuentra centros de acopio cercanos en Medellín para donar ayuda humanitaria. Información comunitaria: verifica el estado de cada centro antes de acudir.",
  applicationName: "Red de Acopio",
  authors: [{ name: "Red de Acopio" }],
  keywords: [
    "acopio",
    "donaciones",
    "Medellín",
    "ayuda humanitaria",
    "Venezuela",
    "centros de acopio",
  ],
  openGraph: {
    title: "Red de Acopio — Centros de acopio cercanos",
    description:
      "Mapa de centros de acopio en Medellín para coordinar donaciones de ayuda humanitaria.",
    type: "website",
    locale: "es_CO",
  },
};

// El viewport se exporta por separado en Next.js 16 (antes vivía dentro de metadata).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Color de la barra del navegador en móvil acorde a la marca.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f0d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
