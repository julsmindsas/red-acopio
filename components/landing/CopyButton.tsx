"use client";

import { useState } from "react";

/*
 * Botón para copiar texto (p. ej. el comando curl de la API) al portapapeles.
 * Da feedback inmediato ("Copiado") y vuelve al estado original tras un momento.
 * Falla en silencio si el navegador no expone la API de portapapeles.
 */

export default function CopyButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Portapapeles no disponible (contexto no seguro o permiso denegado): ignoramos.
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className={className}
      aria-label="Copiar comando al portapapeles"
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}
