"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import MapView from "@/components/map/MapView";
import { DEFAULT_ZOOM, MEDELLIN_CENTER } from "@/lib/constants";
import { withDistance } from "@/lib/geo";
import type {
  Center,
  LatLng,
  MapMarker,
  MapProviderName,
  MaterialCategory,
  VerificationStatus,
} from "@/lib/types";
import CenterList from "./CenterList";
import FilterBar from "./FilterBar";

/*
 * Vista principal (cliente). Orquesta:
 *   - Geolocalización opcional del usuario (con manejo de permisos/errores).
 *   - Ordenamiento por cercanía (withDistance) y filtros componibles.
 *   - Sincronización de selección entre lista y mapa.
 *   - Layout mobile-first: mapa arriba (alto fijo) + lista desplazable debajo;
 *     en pantallas grandes, dos columnas con el mapa fijo (sticky).
 */

type GeoState =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "error"
  | "unsupported";

/** Alterna la pertenencia de un valor en un Set sin mutar el original. */
function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function HomeView({
  centers,
  initialMaterial,
}: {
  centers: Center[];
  /**
   * Material con el que precargar el filtro (deep-link, p. ej.
   * /mapa?material=mascotas). Si se omite, el filtro arranca vacío.
   */
  initialMaterial?: MaterialCategory;
}) {
  // --- Geolocalización -----------------------------------------------------
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [geoState, setGeoState] = useState<GeoState>("idle");

  const requestLocation = useCallback(() => {
    track("usar_ubicacion"); // evento: el usuario pidió ubicarse
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoState("unsupported");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("granted");
        track("ubicacion_concedida"); // evento: permiso concedido con éxito
      },
      (err) => {
        setGeoState(
          err.code === err.PERMISSION_DENIED ? "denied" : "error",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  // --- Filtros (extensibles) ----------------------------------------------
  // Cada filtro es un Set independiente. Set vacío = sin filtrar por ese criterio.
  // Para añadir un filtro nuevo, agrega aquí su estado y aplícalo en `filtered`.
  // Inicializador perezoso: si llega un material por deep-link, el filtro
  // arranca con ese material preseleccionado; si no, vacío (sin filtrar).
  const [materialFilter, setMaterialFilter] = useState<Set<MaterialCategory>>(
    () => (initialMaterial ? new Set([initialMaterial]) : new Set()),
  );
  const [statusFilter, setStatusFilter] = useState<Set<VerificationStatus>>(
    new Set(),
  );

  const toggleMaterial = useCallback(
    (m: MaterialCategory) => setMaterialFilter((s) => toggleInSet(s, m)),
    [],
  );
  const toggleStatus = useCallback(
    (s: VerificationStatus) => setStatusFilter((prev) => toggleInSet(prev, s)),
    [],
  );
  const clearFilters = useCallback(() => {
    setMaterialFilter(new Set());
    setStatusFilter(new Set());
  }, []);

  // --- Derivados: distancia + filtrado ------------------------------------
  const withDist = useMemo(
    () => withDistance(centers, userLoc),
    [centers, userLoc],
  );

  const filtered = useMemo(
    () =>
      withDist.filter((c) => {
        const matchMaterial =
          materialFilter.size === 0 ||
          c.materials.some((m) => materialFilter.has(m));
        const matchStatus =
          statusFilter.size === 0 || statusFilter.has(c.status);
        return matchMaterial && matchStatus;
      }),
    [withDist, materialFilter, statusFilter],
  );

  // Marcadores del mapa derivados de la lista filtrada (mapa y lista coinciden).
  const markers: MapMarker[] = useMemo(
    () =>
      filtered.map((c) => ({
        id: c.id,
        lat: c.lat,
        lng: c.lng,
        title: c.name,
        status: c.status,
      })),
    [filtered],
  );

  // --- Selección sincronizada lista <-> mapa ------------------------------
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Al seleccionar (desde el mapa o la lista), desplaza la tarjeta a la vista.
  useEffect(() => {
    if (!selectedId) return;
    const el = document.getElementById(`center-${selectedId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  // Si la selección queda fuera del filtro activo, la limpiamos.
  useEffect(() => {
    if (selectedId && !filtered.some((c) => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  // --- Aviso de cambio de proveedor de mapa -------------------------------
  const [mapProvider, setMapProvider] = useState<MapProviderName>("leaflet");

  return (
    <div className="flex flex-1 flex-col">
      {/* Aviso global de postura de datos (siempre visible) */}
      <div className="border-b border-accent-200 bg-accent-50">
        <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-xs leading-relaxed text-accent-900 sm:text-sm">
          <span aria-hidden="true" className="mt-px shrink-0">
            🛡️
          </span>
          <span>
            <strong className="font-semibold">Información comunitaria.</strong>{" "}
            Algunos centros están <em>sin verificar</em>. Confirma por teléfono
            antes de acudir o donar.
          </span>
        </p>
      </div>

      {/* Controles: ubicación + filtros */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={requestLocation}
              disabled={geoState === "loading"}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-brand-600 bg-brand-50 px-4 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100 disabled:opacity-60"
            >
              <span aria-hidden="true">
                {geoState === "loading" ? "⏳" : "📡"}
              </span>
              {geoState === "granted"
                ? "Ubicación activa"
                : geoState === "loading"
                  ? "Buscando ubicación…"
                  : "Usar mi ubicación"}
            </button>

            {/* CTA principal: recomendar un centro (botón sólido, bien visible) */}
            <Link
              href="/reportar"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-colors hover:bg-brand-700"
            >
              <span aria-hidden="true">＋</span>
              Recomendar un centro de acopio
            </Link>
          </div>

          {/* Mensajes de estado de la geolocalización */}
          {geoState === "granted" && (
            <p className="text-xs text-brand-700">
              Mostrando centros ordenados por cercanía a tu ubicación.
            </p>
          )}
          {geoState === "denied" && (
            <p className="text-xs text-accent-800">
              Permiso de ubicación denegado. Puedes seguir usando el mapa; los
              centros se muestran sin orden por distancia.
            </p>
          )}
          {geoState === "error" && (
            <p className="text-xs text-accent-800">
              No pudimos obtener tu ubicación. Inténtalo de nuevo o usa el mapa
              manualmente.
            </p>
          )}
          {geoState === "unsupported" && (
            <p className="text-xs text-accent-800">
              Tu navegador no permite geolocalización. Puedes explorar el mapa
              manualmente.
            </p>
          )}

          <FilterBar
            materialFilter={materialFilter}
            statusFilter={statusFilter}
            onToggleMaterial={toggleMaterial}
            onToggleStatus={toggleStatus}
            onClear={clearFilters}
            resultCount={filtered.length}
          />

          {/* Atribución a la red oficial acopiove.org (discreta y respetuosa) */}
          <p className="text-xs leading-relaxed text-foreground/55">
            Los centros{" "}
            <strong className="font-semibold text-emerald-700">verificados</strong>{" "}
            provienen de la red oficial{" "}
            <a
              href="https://acopiove.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 underline-offset-2 hover:underline"
            >
              acopiove.org
            </a>
            . Los demás son aportes de la comunidad.
          </p>
        </div>
      </div>

      {/* Aviso si el mapa cambió a Google (fallback) */}
      {mapProvider === "google" && (
        <div className="mx-auto mt-3 w-full max-w-6xl px-4">
          <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
            El mapa se está mostrando con Google Maps (no se pudieron cargar los
            mosaicos de OpenStreetMap).
          </p>
        </div>
      )}

      {/* Mapa + lista. Mobile: apilados. Desktop: dos columnas, mapa fijo. */}
      <div className="mx-auto mt-3 w-full max-w-6xl flex-1 px-4 pb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6">
        {/* Mapa: arriba en móvil (orden 1), a la derecha y fijo en desktop (orden 2) */}
        <section
          aria-label="Mapa de centros de acopio"
          className="mb-4 lg:order-2 lg:mb-0 lg:self-start lg:sticky lg:top-20"
        >
          <div className="h-[45vh] overflow-hidden rounded-2xl border border-border shadow-sm lg:h-[calc(100dvh-7rem)]">
            <MapView
              markers={markers}
              userLocation={userLoc}
              selectedId={selectedId}
              onSelect={handleSelect}
              center={MEDELLIN_CENTER}
              zoom={DEFAULT_ZOOM}
              onProviderChange={setMapProvider}
              className="h-full w-full"
            />
          </div>
        </section>

        {/* Lista de centros */}
        <section aria-label="Lista de centros de acopio" className="lg:order-1">
          <CenterList
            centers={filtered}
            selectedId={selectedId}
            onSelect={handleSelect}
            emptyAction={
              (materialFilter.size > 0 || statusFilter.size > 0) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Limpiar filtros
                </button>
              )
            }
          />
        </section>
      </div>
    </div>
  );
}
