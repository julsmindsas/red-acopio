import {
  HELP_NOTICE,
  PURPOSE_META,
  channelsByPurpose,
  type HelpChannel,
} from "@/lib/emergency-help";

/*
 * Canales oficiales de ayuda.
 * -------------------------------------------------------------------------
 * Server Component: son datos estáticos y no necesita JavaScript en cliente,
 * lo que importa en zonas con red intermitente.
 *
 * POSTURA DE DATOS: cada canal indica si se confirmó en el sitio oficial de la
 * organización. Los que no, se muestran con advertencia visible en vez de
 * ocultarse: es información útil, pero quien la use debe saber su procedencia.
 */

/** ¿El enlace sale de la app? Entonces necesita target/rel seguros. */
function isExternal(href: string): boolean {
  return href.startsWith("http");
}

function ChannelRow({ channel }: { channel: HelpChannel }) {
  const external = isExternal(channel.href);

  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="text-sm font-bold text-foreground">{channel.label}</h3>
        <span className="text-xs font-medium text-foreground/55">
          {channel.org}
        </span>
      </div>

      <p className="mt-1 text-xs leading-relaxed text-foreground/70">
        {channel.description}
      </p>

      <a
        href={channel.href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : undefined)}
        className="mt-2.5 inline-flex min-h-11 items-center break-all rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-100"
      >
        {channel.value}
      </a>

      {channel.verified ? (
        <p className="mt-2 text-[11px] font-medium text-emerald-700">
          ✓ Confirmado en el sitio oficial de {channel.org}.
        </p>
      ) : (
        <p className="mt-2 text-[11px] font-medium leading-relaxed text-accent-900">
          ⚠️ Publicado por prensa citando a {channel.org}, sin confirmar en su
          sitio oficial. Verifícalo antes de depender de este canal.
        </p>
      )}

      <p className="mt-1">
        <a
          href={channel.source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-foreground/45 underline-offset-2 hover:text-brand-700 hover:underline"
        >
          Ver fuente
        </a>
      </p>
    </li>
  );
}

export default function HelpChannels({
  /** `true` en la home: recorta la introducción para no competir con el mapa. */
  compact = false,
}: {
  compact?: boolean;
}) {
  const groups = channelsByPurpose();

  return (
    <div className="flex flex-col gap-5">
      {/* La corrección más valiosa que puede dar esta app */}
      <div className="rounded-2xl border border-accent-300 bg-accent-50 p-4">
        <h2 className="flex items-start gap-2 text-sm font-bold text-accent-900">
          <span aria-hidden="true">💡</span>
          {HELP_NOTICE.title}
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-accent-900/90">
          {HELP_NOTICE.body}
        </p>
      </div>

      {groups.map(({ purpose, channels }) => {
        const meta = PURPOSE_META[purpose];
        return (
          <section key={purpose}>
            <h2 className="flex items-center gap-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-foreground/55">
              <span aria-hidden="true">{meta.emoji}</span>
              {meta.title}
            </h2>
            <ul
              className={`mt-2 grid gap-3 ${
                compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {channels.map((channel) => (
                <ChannelRow key={channel.id} channel={channel} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
