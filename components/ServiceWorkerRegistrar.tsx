"use client";

import { useEffect, useState } from "react";

/*
 * Registra el service worker y avisa cuando el dispositivo se queda sin red.
 * -------------------------------------------------------------------------
 * El aviso importa tanto como el cacheo: si la app sigue mostrando puntos sin
 * conexión, la persona tiene que saber que está viendo datos guardados y que
 * pueden haber cambiado — sobre todo si un albergue se llenó entretanto.
 */
export default function ServiceWorkerRegistrar() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Se registra tras la carga para no competir con el render inicial.
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("[sw] no se pudo registrar:", err);
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 bg-slate-900 px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm"
    >
      <span aria-hidden="true">📴</span> Sin conexión. Estás viendo los últimos
      puntos guardados: pueden haber cambiado.
    </div>
  );
}
