/**
 * Correo y enlaces firmados de Hogares de Paso.
 *
 * El anfitrión no tiene cuenta ni contraseña: su "sesión" es un enlace firmado
 * (HMAC) que llega a su correo. Ese enlace abre una página de confirmación con
 * botones — nunca ejecuta la acción con el GET, porque los escáneres de correo
 * pre-visitan los enlaces y aceptarían solicitudes solos.
 *
 * Envío: Resend vía su API REST (integración del marketplace de Vercel; la
 * variable RESEND_API_KEY la provee la integración). Sin API key, los envíos
 * se omiten con un aviso en logs y la app sigue funcionando: el correo es una
 * mejora, no una dependencia dura.
 */
import { createHmac, timingSafeEqual } from "crypto";
import type { Hogar, SolicitudHogar } from "./types";
import {
  ACEPTA_LABELS,
  CONVIVENCIA_LABELS,
  retirarDatosDeContacto,
} from "./types";

// ---------------------------------------------------------------------------
// Enlaces firmados
// ---------------------------------------------------------------------------

/** Acciones que un enlace firmado puede autorizar. */
export type AccionEnlace = "responder" | "pausar" | "reactivar";

interface TokenPayload {
  /** Acción autorizada. */
  acc: AccionEnlace;
  /** Hogar sobre el que actúa. */
  hid: string;
  /** Solicitud (solo para "responder"). */
  sid?: string;
  /** Expiración en epoch-segundos. */
  exp: number;
}

/**
 * Secreto de firma. Reutiliza el de sesión admin (o deriva de la contraseña)
 * para no exigir otra variable de entorno en plena emergencia.
 */
function linkSecret(): string {
  return (
    process.env.HOGARES_LINK_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    ""
  );
}

/** `true` si el servidor puede firmar enlaces (hay algún secreto). */
export function enlacesHabilitados(): boolean {
  return linkSecret().length > 0;
}

function firmar(data: string): string {
  return createHmac("sha256", linkSecret()).update(data).digest("base64url");
}

/** Crea un token firmado con expiración (días). */
export function crearToken(
  payload: Omit<TokenPayload, "exp">,
  diasValidez: number,
): string {
  const full: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + diasValidez * 24 * 60 * 60,
  };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${body}.${firmar(body)}`;
}

/** Verifica y decodifica un token. `null` si es inválido o venció. */
export function verificarToken(token: string): TokenPayload | null {
  if (!enlacesHabilitados()) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = firmar(body);
  // Comparación en tiempo constante; longitudes distintas = inválido.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf-8"),
    ) as TokenPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    if (!payload.acc || !payload.hid) return null;
    return payload;
  } catch {
    return null;
  }
}

/** URL base del sitio, para armar los enlaces de los correos. */
export function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

// ---------------------------------------------------------------------------
// Envío: SMTP del buzón propio (preferido) o Resend
// ---------------------------------------------------------------------------

/*
 * Por qué SMTP primero: mandar por el buzón que la organización ya tiene
 * (cualquier proveedor: Google, Outlook, el hosting propio…) no exige registrar
 * ni verificar ningún dominio — la autenticación SPF/DKIM ya la resuelve ese
 * proveedor, así que el correo llega a cualquier destinatario desde el primer
 * día. Resend queda como alternativa para cuando haya un dominio verificado.
 */

/** Remitente: el buzón SMTP configurado, o el de pruebas de Resend. */
function remitente(): string {
  if (process.env.SMTP_FROM_EMAIL) {
    return `Red de Acopio <${process.env.SMTP_FROM_EMAIL}>`;
  }
  if (process.env.SMTP_USER) {
    return `Red de Acopio <${process.env.SMTP_USER}>`;
  }
  return process.env.RESEND_FROM_EMAIL || "Red de Acopio <onboarding@resend.dev>";
}

/** `true` si hay un buzón SMTP configurado. */
function smtpConfigurado(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD,
  );
}

/** Envía por el buzón propio vía SMTP. */
async function enviarPorSmtp(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const nodemailer = (await import("nodemailer")).default;
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 es SMTPS (TLS directo); 587 negocia STARTTLS.
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await transport.sendMail({
      from: remitente(),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error("[hogares/email] SMTP falló", err);
    return false;
  }
}

/** Envía por la API de Resend (requiere dominio verificado para terceros). */
async function enviarPorResend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remitente(),
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      console.error(
        "[hogares/email] Resend respondió",
        res.status,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[hogares/email] fallo de red al enviar", err);
    return false;
  }
}

/**
 * Envía un correo por el canal disponible. Nunca lanza: el flujo principal
 * (registrar un hogar, crear una solicitud) no debe fallar porque el correo
 * falle — una familia no se queda sin techo por un problema de SMTP.
 */
export async function enviarCorreo(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (smtpConfigurado()) return enviarPorSmtp(opts);
  if (process.env.RESEND_API_KEY) return enviarPorResend(opts);
  console.warn(
    "[hogares/email] sin SMTP ni RESEND_API_KEY: correo omitido →",
    opts.subject,
  );
  return false;
}

// ---------------------------------------------------------------------------
// Plantillas (HTML sencillo, legible en cualquier cliente de correo)
// ---------------------------------------------------------------------------

/**
 * Escapa TODO valor escrito por usuarios antes de interpolarlo en el HTML.
 * Sin esto, un solicitante malicioso podría poner `<a href=...>` en su nombre
 * o sus notas y el anfitrión recibiría un enlace de phishing con nuestro
 * diseño y nuestra confianza.
 */
function esc(valor: string | null | undefined): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Envoltorio común: marca arriba, contenido, y el porqué del correo abajo. */
function plantilla(titulo: string, cuerpo: string): string {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f1c17">
    <p style="font-weight:700;color:#047857;margin:0 0 4px">🏡 Red de Acopio · Hogares de paso</p>
    <h1 style="font-size:20px;margin:0 0 16px">${titulo}</h1>
    ${cuerpo}
    <p style="font-size:12px;color:#667;margin-top:28px;border-top:1px solid #dbe4e0;padding-top:12px">
      Red de Acopio es una plataforma de intermediación tras el sismo de Colombia 2026.
      Nunca publicamos tus datos personales. Este correo se envió porque registraste
      un hogar o una solicitud en red-acopio.
    </p>
  </div>`;
}

function botonHtml(url: string, texto: string): string {
  // Las URLs se construyen siempre en el servidor, pero se escapan igual:
  // defensa en profundidad para el atributo href.
  return `<a href="${esc(url)}" style="display:inline-block;background:#059669;color:#fff;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none">${texto}</a>`;
}

/** Describe al grupo solicitante SIN datos personales. */
function resumenGrupo(s: SolicitudHogar): string {
  const partes = s.composicion.map((c) => ACEPTA_LABELS[c].toLowerCase());
  const quienes = partes.join(", ") || "sin detalle";
  const personas =
    s.personas === 0
      ? "Solo animales rescatados (ninguna persona)"
      : `${s.personas} ${s.personas === 1 ? "persona" : "personas"}`;
  const notas = retirarDatosDeContacto(s.notas);
  return `
    <ul style="line-height:1.7;padding-left:18px">
      <li><strong>Grupo:</strong> ${esc(personas)}</li>
      <li><strong>Quiénes son:</strong> ${esc(quienes)}</li>
      <li><strong>Ciudad:</strong> ${esc(s.ciudad)}</li>
      ${notas ? `<li><strong>Notas:</strong> ${esc(notas)}</li>` : ""}
    </ul>`;
}

export function correoBienvenidaAnfitrion(
  hogar: Hogar,
  pausarUrl: string,
): { subject: string; html: string } {
  return {
    subject: "Tu hogar de paso ya está publicado",
    html: plantilla(
      "¡Gracias por abrir tu casa!",
      `
      <p>Tu hogar en <strong>${esc(hogar.ciudad)}</strong> ya aparece en la lista pública,
      solo con la información general: capacidad, a quiénes recibes y quiénes viven
      contigo. Tu nombre, teléfono, correo y dirección <strong>nunca se publican</strong>.</p>
      <p>Cuando alguien solicite tu hogar te llegará un correo como este con los
      datos del grupo (sin información personal) y dos botones: aceptar o rechazar.
      <strong>Nada se concreta sin tu sí.</strong></p>
      <p>¿Ya no puedes hospedar, o necesitas un descanso? Pausa tu hogar cuando
      quieras — un solo clic, sin cuentas ni contraseñas:</p>
      <p>${botonHtml(pausarUrl, "Pausar mi hogar")}</p>`,
    ),
  };
}

export function correoNuevaSolicitud(
  hogar: Hogar,
  solicitud: SolicitudHogar,
  responderUrl: string,
  opts: { varios?: boolean } = {},
): { subject: string; html: string } {
  // Cuando la invitación va a varios hogares a la vez hay que decirlo: es
  // honesto y además explica por qué conviene responder pronto.
  const entrada = opts.varios
    ? `<p>Una familia necesita hogar en <strong>${esc(solicitud.ciudad)}</strong> y tu casa
       encaja con lo que declaraste. Le escribimos a varios hogares compatibles:
       <strong>el primero que acepte se queda con el hospedaje</strong>.</p>`
    : `<p>Alguien solicitó tu hogar en <strong>${esc(hogar.ciudad)}</strong>. Este es el
       resumen del grupo (por seguridad, sin nombres ni teléfonos):</p>`;

  return {
    subject: opts.varios
      ? "Una familia necesita hogar y tu casa encaja"
      : "Alguien solicita tu hogar de paso",
    html: plantilla(
      opts.varios
        ? "Hay una familia que podrías recibir"
        : "Una familia quiere hospedarse contigo",
      `
      ${entrada}
      ${resumenGrupo(solicitud)}
      <p>Tú decides. Si aceptas, ambas partes recibirán el contacto del otro y un
      código de confirmación para compararlo al llegar. Si no puedes, la solicitud
      sigue abierta para otros hogares y nadie sabrá de ti.</p>
      <p>${botonHtml(responderUrl, "Responder a esta solicitud")}</p>
      <p style="font-size:13px;color:#667">El enlace es personal y vence en 14 días.</p>`,
    ),
  };
}

export function correoAceptadaAnfitrion(
  hogar: Hogar,
  solicitud: SolicitudHogar,
  codigo: string,
): { subject: string; html: string } {
  return {
    subject: `Hospedaje confirmado — código ${codigo}`,
    html: plantilla(
      "Aceptaste recibir a este grupo",
      `
      <p>Este es el contacto de la persona que llegará a tu casa:</p>
      <ul style="line-height:1.7;padding-left:18px">
        <li><strong>Nombre:</strong> ${esc(solicitud.nombre)}</li>
        <li><strong>Teléfono:</strong> ${esc(solicitud.telefono)}</li>
      </ul>
      <p>Su <strong>código de confirmación</strong> es:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:6px;text-align:center;background:#ecfdf5;border-radius:12px;padding:14px">${codigo}</p>
      <p>Cuando llegue, pídele su código y compárenlo. <strong>Si no coincide, no
      abras la puerta.</strong> Llámense antes para acordar la llegada — la
      plataforma no verifica a las personas: habla con ella, pide su documento y
      confía en tu criterio.</p>`,
    ),
  };
}

export function correoAceptadaSolicitante(
  hogar: Hogar,
  solicitud: SolicitudHogar,
  codigo: string,
): { subject: string; html: string } {
  return {
    subject: `¡Un hogar te aceptó! — código ${codigo}`,
    html: plantilla(
      "Hay una casa esperándote",
      `
      <p>El hogar en <strong>${esc(hogar.ciudad)}${hogar.zona ? ` (${esc(hogar.zona)})` : ""}</strong>
      aceptó recibirlos. Este es el contacto para coordinar la llegada:</p>
      <ul style="line-height:1.7;padding-left:18px">
        <li><strong>Anfitrión:</strong> ${esc(hogar.nombre)}</li>
        <li><strong>Teléfono:</strong> ${esc(hogar.telefono)}</li>
        <li><strong>En esa casa:</strong> ${CONVIVENCIA_LABELS[hogar.convivencia].toLowerCase()}</li>
      </ul>
      <p>Tu <strong>código de confirmación</strong> es:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:6px;text-align:center;background:#ecfdf5;border-radius:12px;padding:14px">${codigo}</p>
      <p>Al llegar, compara tu código con el del anfitrión. <strong>Si no coincide,
      no entres.</strong> Recuerda: la plataforma no verifica a las personas —
      llama antes, pide su documento y, si puedes, llega acompañada.</p>`,
    ),
  };
}

export function correoRechazadaSolicitante(
  solicitud: SolicitudHogar,
): { subject: string; html: string } {
  return {
    subject: "Ese hogar no puede recibirlos por ahora",
    html: plantilla(
      "Tu solicitud sigue activa",
      `
      <p>El hogar que solicitaste no puede recibir a nadie en este momento.
      No es un no definitivo de la red: tu solicitud <strong>sigue abierta</strong>
      y puede conectarse con cualquier otro hogar disponible.</p>
      <p>${botonHtml(`${baseUrl()}/hogares`, "Ver otros hogares disponibles")}</p>`,
    ),
  };
}
