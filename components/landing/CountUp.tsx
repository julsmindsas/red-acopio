"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Contador animado para las métricas en vivo.
 * - Cuenta desde 0 hasta `value` cuando la cifra entra en el viewport
 *   (IntersectionObserver), con un easing de cierre suave.
 * - Respeta `prefers-reduced-motion`: muestra el valor final sin animar.
 * - El número se computa en el servidor (Stats) y llega como prop serializable;
 *   este componente solo añade el detalle de microinteracción en el cliente.
 */

export default function CountUp({
  value,
  durationMs = 1400,
  className = "",
}: {
  value: number;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced || value === 0) {
      setDisplay(value);
      return;
    }

    const el = ref.current;
    if (!el) {
      setDisplay(value);
      return;
    }

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / durationMs);
        // easeOutExpo: arranca rápido y desacelera al final.
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setDisplay(Math.round(eased * value));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString("es-CO")}
    </span>
  );
}
