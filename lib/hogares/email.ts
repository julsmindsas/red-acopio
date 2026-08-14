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
// Envío (Resend REST)
// ---------------------------------------------------------------------------

/**
 * Remitente. Sin dominio propio se usa el de pruebas de Resend; cuando haya
 * dominio verificado basta con definir RESEND_FROM_EMAIL.
 */
function remitente(): string {
  return process.env.RESEND_FROM_EMAIL || "Red de Acopio <onboarding@resend.dev>";
}

/**
 * Envía un correo. Devuelve `true` si Resend lo aceptó. Nunca lanza: el flujo
 * principal (registrar un hogar, crear una solicitud) no debe fallar porque
 * el correo falle.
 */
export async function enviarCorreo(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[hogares/email] RESEND_API_KEY ausente: correo omitido →",
      opts.subject,
    );
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

// ---------------------------------------------------------------------------
// Plantillas (HTML sencillo, legible en cualquier cliente de correo)
// ---------------------------------------------------------------------------

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
  return `<a href="${url}" style="display:inline-block;background:#059669;color:#fff;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none">${texto}</a>`;
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
      <li><strong>Grupo:</strong> ${personas}</li>
      <li><strong>Quiénes son:</strong> ${quienes}</li>
      <li><strong>Ciudad:</strong> ${s.ciudad}</li>
      ${notas ? `<li><strong>Notas:</strong> ${notas}</li>` : ""}
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
      <p>Tu hogar en <strong>${hogar.ciudad}</strong> ya aparece en la lista pública,
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
): { subject: string; html: string } {
  return {
    subject: "Alguien solicita tu hogar de paso",
    html: plantilla(
      "Una familia quiere hospedarse contigo",
      `
      <p>Alguien solicitó tu hogar en <strong>${hogar.ciudad}</strong>. Este es el
      resumen del grupo (por seguridad, sin nombres ni teléfonos):</p>
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
        <li><strong>Nombre:</strong> ${solicitud.nombre}</li>
        <li><strong>Teléfono:</strong> ${solicitud.telefono}</li>
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
      <p>El hogar en <strong>${hogar.ciudad}${hogar.zona ? ` (${hogar.zona})` : ""}</strong>
      aceptó recibirlos. Este es el contacto para coordinar la llegada:</p>
      <ul style="line-height:1.7;padding-left:18px">
        <li><strong>Anfitrión:</strong> ${hogar.nombre}</li>
        <li><strong>Teléfono:</strong> ${hogar.telefono}</li>
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
