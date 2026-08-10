import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
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
  title: "Red de Acopio — Albergues y centros de acopio, sismo Colombia 2026",
  description:
    "Mapa de albergues, centros de acopio, brigadas médicas y puntos de agua tras el sismo del 10 de agosto de 2026 en Colombia. Información comunitaria: verifica cada punto antes de acudir.",
  applicationName: "Red de Acopio",
  authors: [{ name: "Red de Acopio" }],
  // PWA: permite instalarla y que abra sin red donde la señal es intermitente.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Red de Acopio",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  keywords: [
    "sismo Colombia 2026",
    "terremoto Chocó",
    "albergues",
    "centros de acopio",
    "Manizales",
    "Pereira",
    "Quibdó",
    "ayuda humanitaria",
    "donaciones",
  ],
  openGraph: {
    title: "Red de Acopio — Albergues y centros de acopio, sismo Colombia 2026",
    description:
      "Dónde refugiarse, dónde donar y a quién llamar tras el sismo del 10 de agosto de 2026 en Colombia.",
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
        {/* Guarda los puntos para que la app funcione sin red y avisa si no la hay */}
        <ServiceWorkerRegistrar />
        {children}
        {/* Analítica de uso (Vercel Web Analytics): sin cookies, respeta la privacidad. */}
        <Analytics />
      </body>
    </html>
  );
}
