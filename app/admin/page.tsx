import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";

/*
 * Página /admin — panel administrativo de centros de acopio locales.
 * ------------------------------------------------------------------------
 * Esta página es un Server Component delgado: define el `metadata` (que solo
 * pueden exportar los Server Components) y delega toda la interactividad en
 * <AdminPanel/>, un componente cliente que maneja sesión, login y gestión.
 *
 * `robots: noindex` evita que el panel se indexe en buscadores.
 */

export const metadata: Metadata = {
  title: "Panel administrativo — Red de Acopio",
  description:
    "Gestión de centros de acopio locales: revisión de recomendaciones ciudadanas, edición y verificación.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
