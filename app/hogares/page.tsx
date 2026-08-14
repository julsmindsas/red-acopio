import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import ComoFunciona from "@/components/hogares/ComoFunciona";
import HogarCard from "@/components/hogares/HogarCard";
import { getHogaresRepository } from "@/lib/hogares/store";
import { toHogarPublico } from "@/lib/hogares/types";

/*
 * Página /hogares (Server Component): "Abre tu casa" — hogares de paso.
 *
 * Personas que ofrecen su casa para hospedar temporalmente a familias
 * damnificadas (y a sus mascotas). Red de Acopio es una plataforma de
 * INTERMEDIACIÓN: no verifica personas ni hace llamadas — protege los datos.
 * Aquí no hay teléfonos, nombres ni direcciones; solo `toHogarPublico`, y el
 * copy nunca promete acciones humanas que nadie va a ejecutar.
 *
 * La lista debe reflejar el estado real en cada visita (un hogar se pausa o se
 * ocupa en minutos durante una emergencia), así que se fuerza el renderizado
 * dinámico — mismo mecanismo que usan las rutas /api de este repo.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hogares de paso — Abre tu casa | Red de Acopio",
  description:
    "Familias que abren su casa a personas damnificadas por el sismo del 10 de agosto de 2026 en Colombia — y a sus mascotas. Nunca publicamos teléfonos, nombres ni direcciones.",
  openGraph: {
    title: "Hogares de paso — Abre tu casa | Red de Acopio",
    description:
      "Ofrece tu casa o encuentra un hogar temporal tras el sismo de Colombia 2026. Plataforma de intermediación: nunca publicamos datos personales.",
    type: "website",
    locale: "es_CO",
  },
};

/**
 * Los compromisos y advertencias de seguridad, visibles antes de la lista.
 * Honestidad primero: la plataforma protege los DATOS, pero no verifica a las
 * PERSONAS — decirlo claro es la mejor protección que podemos dar.
 */
const SEGURIDAD = [
  {
    emoji: "🔒",
    titulo: "Tus datos no se publican",
    detalle:
      "Nunca mostramos teléfonos, nombres, documentos ni direcciones. El contacto se comparte solo entre las dos partes cuando se concreta un hospedaje.",
  },
  {
    emoji: "👥",
    titulo: "Cada hogar declara quiénes viven allí",
    detalle:
      "Se muestra en cada tarjeta tal como lo declaró el anfitrión. Así una mujer sola puede elegir un hogar donde viven mujeres.",
  },
  {
    emoji: "🔑",
    titulo: "Código de confirmación mutuo",
    detalle:
      "Cuando se concreta un hospedaje, ambas partes tienen el mismo código corto y lo comparan al llegar. Si no coincide, nadie entra.",
  },
  {
    emoji: "⚠️",
    titulo: "Verifica por tu cuenta",
    detalle:
      "Somos una plataforma de intermediación: no verificamos a las personas. Antes de recibir o llegar a una casa, hablen por teléfono, pidan documentos y, si pueden, encuéntrense primero en un lugar público.",
  },
];

export default async function HogaresPage() {
  // El repositorio decide el almacenamiento; la página solo pide la lista y
  // aplica el filtro de publicación: todo hogar no rechazado y disponible se
  // publica de inmediato (plataforma de intermediación: nadie llama a
  // verificar; la tarjeta etiqueta el estado real del dato). Los "ocupado" no
  // se muestran: señalar qué casa está hospedando gente AHORA es información
  // que protege más callada que contada.
  const repo = getHogaresRepository();
  const hogares = (await repo.listHogares())
    .filter(
      (h) => h.verificacion !== "rechazado" && h.disponibilidad === "disponible",
    )
    .map(toHogarPublico);

  return (
    <>
      <Header variant="home" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* ---- Hero: qué es esto y las dos puertas de entrada ---- */}
        <section aria-labelledby="hogares-titulo">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
            Hogares de paso
          </p>
          <h1
            id="hogares-titulo"
            className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Abre tu casa
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70 sm:text-base">
            Miles de familias perdieron su techo con el sismo. Un albergue
            resuelve la primera noche; una casa que se abre resuelve las
            semanas siguientes. Aquí conectamos a quien ofrece un espacio en su
            hogar con quien lo necesita —{" "}
            <strong className="font-semibold text-foreground">
              personas y también sus mascotas
            </strong>{" "}
            — sin publicar jamás los datos personales de nadie. Somos el
            puente, no un verificador: revisa los consejos de seguridad antes
            de coordinar.
          </p>

          {/* Dos CTAs grandes, del mismo peso: ninguna de las dos puertas es
              secundaria. En móvil van apiladas y a ancho completo. */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/hogares/ofrecer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700"
            >
              <span aria-hidden="true">🔑</span>
              Ofrecer mi casa
            </Link>
            <Link
              href="/hogares/solicitar"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-brand-600 bg-surface px-6 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
            >
              <span aria-hidden="true">🧳</span>
              Necesito un hogar
            </Link>
          </div>
        </section>

        {/* ---- Cómo funciona (3 pasos por lado) ---- */}
        <div className="mt-10">
          <ComoFunciona />
        </div>

        {/* ---- Seguridad: visible ANTES de la lista. Es lo que hace posible
             que alguien acepte dormir en casa de un desconocido. ---- */}
        {/* Tinte del brand a baja opacidad, no pastel fijo: brand-50/60 sobre
            la superficie oscura dejaba una banda clara con texto claro encima
            (ilegible en tema oscuro). */}
        <section
          aria-labelledby="seguridad-titulo"
          className="mt-10 rounded-2xl border-2 border-brand-500/40 bg-brand-500/10 p-5 sm:p-6"
        >
          <h2
            id="seguridad-titulo"
            className="text-xl font-bold tracking-tight text-foreground"
          >
            Tu seguridad es la regla, no la excepción
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {SEGURIDAD.map((item) => (
              <li key={item.titulo} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-lg shadow-sm"
                >
                  {item.emoji}
                </span>
                <span>
                  <span className="block text-sm font-bold text-foreground">
                    {item.titulo}
                  </span>
                  <span className="block text-sm leading-relaxed text-foreground/70">
                    {item.detalle}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Lista de hogares disponibles ---- */}
        <section aria-labelledby="lista-titulo" className="mt-10">
          <h2
            id="lista-titulo"
            className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            Hogares disponibles
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
            Cada tarjeta muestra lo que el anfitrión declaró — sin nombres ni
            direcciones; eso se comparte solo entre las dos partes al concretar
            el hospedaje. La etiqueta te dice si el dato está verificado o no.
          </p>

          {hogares.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hogares.map((hogar) => (
                <HogarCard key={hogar.id} hogar={hogar} />
              ))}
            </div>
          ) : (
            /* Estado vacío digno: al inicio de la emergencia SIEMPRE se verá
               esto. No es un error ni una lista rota: es una invitación. */
            <div className="mt-4 rounded-3xl border border-dashed border-brand-300 bg-surface-muted/50 px-6 py-12 text-center">
              <span aria-hidden="true" className="text-4xl">
                🏠
              </span>
              <h3 className="mt-3 text-lg font-bold text-foreground">
                Sé la primera casa abierta de tu ciudad
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/70">
                Todavía no hay hogares publicados en la lista. El tuyo puede
                ser el primero — y el que le devuelva el techo a una familia
                esta misma semana.
              </p>
              <Link
                href="/hogares/ofrecer"
                className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700"
              >
                <span aria-hidden="true">🔑</span>
                Ofrecer mi casa
              </Link>
            </div>
          )}
        </section>

        {/* ---- Cierre: quien necesita hogar no depende de la lista ---- */}
        <div className="mt-8 rounded-2xl border border-border bg-surface-muted p-5">
          <h2 className="text-sm font-bold text-foreground">
            ¿Necesitas hospedaje aunque no veas un hogar que te sirva?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
            Registra tu solicitud igual: queda guardada de forma privada y se
            usa para conectarte con un hogar compatible con tus preferencias
            en cuanto exista uno.
          </p>
          <Link
            href="/hogares/solicitar"
            className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700"
          >
            <span aria-hidden="true">🧳</span>
            Registrar mi solicitud
          </Link>
        </div>
      </main>
    </>
  );
}
