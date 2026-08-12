"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import MapView from "@/components/map/MapView";
import {
  AFFECTED_CITIES,
  DEFAULT_CITY,
  DEFAULT_ZOOM,
  REGIONAL_ZOOM,
} from "@/lib/constants";
import { haversineKm, nearestPlace, withDistance } from "@/lib/geo";
import type {
  Center,
  LatLng,
  MapMarker,
  MapProviderName,
  MaterialCategory,
  PointKind,
  VerificationStatus,
} from "@/lib/types";
import CenterList from "./CenterList";
import CityStatus from "./CityStatus";
import FilterBar from "./FilterBar";
import IntentBar from "./IntentBar";

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
  initialKinds,
}: {
  centers: Center[];
  /**
   * Material con el que precargar el filtro (deep-link, p. ej.
   * /mapa?material=mascotas). Si se omite, el filtro arranca vacío.
   */
  initialMaterial?: MaterialCategory;
  /**
   * Tipos de punto con los que arrancar (deep-link desde la portada, p. ej.
   * /mapa?necesito=refugio). Permite entrar ya filtrado, sin tocar nada.
   */
  initialKinds?: PointKind[];
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

  // --- Ciudad activa -------------------------------------------------------
  // Sin ubicación, el mapa abre en la ciudad más afectada; con ubicación, en la
  // más cercana a la persona. Una selección manual siempre manda.
  //
  // Se declara antes que los derivados porque también ordena la lista: quien
  // está viendo Pereira no debería recibir primero los puntos de Manizales.
  const [manualCity, setManualCity] = useState<string | null>(null);

  const activeCity = useMemo(() => {
    if (manualCity) {
      const picked = AFFECTED_CITIES.find((c) => c.slug === manualCity);
      if (picked) return picked;
    }
    return nearestPlace(AFFECTED_CITIES, userLoc) ?? DEFAULT_CITY;
  }, [manualCity, userLoc]);

  // --- Filtros (extensibles) ----------------------------------------------
  // Cada filtro es un Set independiente. Set vacío = sin filtrar por ese criterio.
  // Para añadir un filtro nuevo, agrega aquí su estado y aplícalo en `filtered`.
  // Inicializador perezoso: si llega un material por deep-link, el filtro
  // arranca con ese material preseleccionado; si no, vacío (sin filtrar).
  const [kindFilter, setKindFilter] = useState<Set<PointKind>>(
    () => new Set(initialKinds ?? []),
  );
  const [materialFilter, setMaterialFilter] = useState<Set<MaterialCategory>>(
    () => (initialMaterial ? new Set([initialMaterial]) : new Set()),
  );
  const [statusFilter, setStatusFilter] = useState<Set<VerificationStatus>>(
    new Set(),
  );

  const toggleKind = useCallback(
    (k: PointKind) => setKindFilter((s) => toggleInSet(s, k)),
    [],
  );

  /** Selección desde IntentBar: reemplaza la selección (no acumula). */
  const pickKinds = useCallback((kinds: PointKind[]) => {
    setKindFilter((prev) => {
      const same =
        prev.size === kinds.length && kinds.every((k) => prev.has(k));
      // Volver a tocar la intención activa la desactiva: sale de la vista
      // filtrada sin tener que buscar otro botón.
      return same ? new Set() : new Set(kinds);
    });
  }, []);

  const clearKinds = useCallback(() => setKindFilter(new Set()), []);

  /** Cuántos criterios hay activos: se muestra en el resumen de "Más filtros". */
  const activeFilterCount =
    kindFilter.size + materialFilter.size + statusFilter.size;
  const toggleMaterial = useCallback(
    (m: MaterialCategory) => setMaterialFilter((s) => toggleInSet(s, m)),
    [],
  );
  const toggleStatus = useCallback(
    (s: VerificationStatus) => setStatusFilter((prev) => toggleInSet(prev, s)),
    [],
  );
  const clearFilters = useCallback(() => {
    setKindFilter(new Set());
    setMaterialFilter(new Set());
    setStatusFilter(new Set());
  }, []);

  // --- Derivados: distancia + filtrado ------------------------------------
  const withDist = useMemo(
    () => withDistance(centers, userLoc, activeCity.center),
    [centers, userLoc, activeCity],
  );

  const filtered = useMemo(
    () =>
      withDist.filter((c) => {
        const matchKind = kindFilter.size === 0 || kindFilter.has(c.kind);
        // El filtro de materiales solo se aplica a los centros de acopio: un
        // albergue no tiene materiales y quedaría descartado siempre.
        const matchMaterial =
          materialFilter.size === 0 ||
          c.kind !== "acopio" ||
          c.materials.some((m) => materialFilter.has(m));
        const matchStatus =
          statusFilter.size === 0 || statusFilter.has(c.status);
        return matchKind && matchMaterial && matchStatus;
      }),
    [withDist, kindFilter, materialFilter, statusFilter],
  );

  // Marcadores del mapa: los puntos filtrados (mapa y lista coinciden) más las
  // zonas afectadas como contexto.
  //
  // Las zonas existen porque, sin ellas, elegir una ciudad sin puntos deja un
  // mapa completamente vacío: la app parece rota justo donde más golpeó el
  // sismo. Van dibujadas de forma distinta y su popup aclara que no son un
  // lugar al que acudir.
  const markers: MapMarker[] = useMemo(() => {
    const points: MapMarker[] = filtered.map((c) => ({
      id: c.id,
      lat: c.lat,
      lng: c.lng,
      title: c.name,
      status: c.status,
      kind: c.kind,
      variant: "punto",
    }));

    const zones: MapMarker[] = AFFECTED_CITIES.filter((c) => c.damaged).map(
      (c) => ({
        id: `zona-${c.slug}`,
        lat: c.center.lat,
        lng: c.center.lng,
        title: `${c.name}, ${c.department}`,
        status: "sin_verificar" as const,
        kind: "acopio" as const,
        variant: "zona" as const,
        subtitle: c.note,
      }),
    );

    return [...zones, ...points];
  }, [filtered]);

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

  /**
   * Qué se ve en móvil: la lista o el mapa.
   *
   * Arranca en "lista" porque el dato accionable —nombre, dirección, teléfono—
   * está ahí; el mapa sirve para orientarse después.
   */
  const [mobileView, setMobileView] = useState<"lista" | "mapa">("lista");

  /**
   * ¿Hay algún punto en el área de la ciudad activa? Se mide por distancia
   * (30 km) y no por el campo `city`, que muchas fuentes no publican.
   *
   * Si no hay ninguno, mostramos el estado de la ciudad en lugar de una lista
   * vacía: hay ciudades gravemente afectadas para las que todavía no se ha
   * publicado ni un albergue con dirección.
   */
  const cityHasPoints = useMemo(
    () =>
      centers.some(
        (c) => haversineKm({ lat: c.lat, lng: c.lng }, activeCity.center) <= 30,
      ),
    [centers, activeCity],
  );

  /**
   * Punto de ayuda más cercano a la ciudad activa, con su distancia.
   *
   * Cuando en la ciudad no hay nada, decir "el más cercano está a 180 km, en
   * Manizales" es información accionable; un mapa vacío no lo es.
   */
  const nearestPoint = useMemo(() => {
    let best: { center: Center; km: number } | null = null;
    for (const c of centers) {
      const km = haversineKm({ lat: c.lat, lng: c.lng }, activeCity.center);
      if (!best || km < best.km) best = { center: c, km };
    }
    return best;
  }, [centers, activeCity]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Una sola franja superior en vez de dos.
          Antes había dos avisos apilados —emergencia y postura de datos— que
          juntos empujaban el primer punto fuera de la pantalla en móvil. El
          123 se queda porque salva vidas; la advertencia de verificación pasa
          a la tarjeta de cada punto, que es donde se toma la decisión. */}
      <div className="border-b border-rose-200 bg-rose-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-xs text-rose-900 sm:text-sm">
          <span>
            <span aria-hidden="true">🚨</span> ¿Emergencia? Llama al{" "}
            <a
              href="tel:123"
              className="text-base font-bold underline underline-offset-2"
            >
              123
            </a>
          </span>
          <Link
            href="/ayuda"
            className="font-semibold text-rose-800 underline underline-offset-2 hover:text-rose-900"
          >
            Buscar a un familiar →
          </Link>
        </div>
      </div>

      {/* Controles: intención + ubicación + filtros */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        <div className="flex flex-col gap-3">
          {/* Lo primero y más grande: qué necesitas */}
          <IntentBar
            kindFilter={kindFilter}
            onPick={pickKinds}
            onClear={clearKinds}
          />

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

            {/* Ciudad activa: el mapa ya no vive anclado a una sola ciudad */}
            <label className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground/80">
              <span aria-hidden="true">🏙️</span>
              <span className="sr-only">Ciudad</span>
              <select
                value={activeCity.slug}
                onChange={(e) => {
                  setManualCity(e.target.value);
                  track("cambio_ciudad", { ciudad: e.target.value });
                }}
                className="cursor-pointer bg-transparent font-semibold text-foreground outline-none"
              >
                {AFFECTED_CITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {/* "Recomendar un punto" ya vive en la barra superior: repetirlo
                aquí competía con los controles que sí usa quien busca ayuda. */}
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

          {/* Recuento y contexto de la ciudad en UNA línea: antes eran dos
              párrafos separados que empujaban la lista hacia abajo.
              Solo se afirma cercanía cuando hay ubicación real. */}
          <p aria-live="polite" className="px-0.5 text-sm leading-relaxed">
            {filtered.length === 0 ? (
              <span className="text-foreground/70">
                No hay puntos que coincidan. Prueba a quitar filtros.
              </span>
            ) : (
              <>
                <strong className="font-bold text-foreground">
                  {filtered.length} {filtered.length === 1 ? "punto" : "puntos"}
                </strong>
                <span className="text-foreground/60">
                  {userLoc
                    ? ", del más cercano a ti al más lejano."
                    : ` cerca de ${activeCity.name}.`}
                </span>
                {activeCity.note && (
                  <span className="text-foreground/50"> {activeCity.note}</span>
                )}
              </>
            )}
          </p>

          {/* Filtros finos: plegados, para no abrumar a quien solo quiere ver puntos */}
          <details className="group rounded-xl border border-border bg-surface">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-foreground/80">
              <span>
                <span aria-hidden="true">⚙️</span> Más filtros
                {activeFilterCount > 0 && (
                  <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <span
                aria-hidden="true"
                className="text-foreground/50 transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <div className="border-t border-border px-4 py-3">
              <FilterBar
                kindFilter={kindFilter}
                materialFilter={materialFilter}
                statusFilter={statusFilter}
                onToggleKind={toggleKind}
                onToggleMaterial={toggleMaterial}
                onToggleStatus={toggleStatus}
                onClear={clearFilters}
                resultCount={filtered.length}
              />
            </div>
          </details>
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

      {/* Móvil: lista o mapa, uno u otro.
          Antes el mapa ocupaba media pantalla ENCIMA de la lista, así que había
          que desplazarse para ver el primer punto. Ahora se elige, como en
          cualquier app de mapas. En escritorio caben los dos y el conmutador
          desaparece. */}
      <div className="mx-auto mt-3 w-full max-w-6xl px-4 lg:hidden">
        <div
          role="tablist"
          aria-label="Ver lista o mapa"
          className="grid grid-cols-2 gap-1 rounded-full border border-border bg-surface-muted p-1"
        >
          {(["lista", "mapa"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={mobileView === v}
              onClick={() => setMobileView(v)}
              className={`min-h-10 rounded-full text-sm font-bold transition-colors ${
                mobileView === v
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-foreground/60"
              }`}
            >
              {v === "lista" ? "📋 Lista" : "🗺️ Mapa"}
            </button>
          ))}
        </div>
      </div>

      {/* Mapa + lista. Móvil: uno u otro. Escritorio: dos columnas, mapa fijo. */}
      <div className="mx-auto mt-3 w-full max-w-6xl flex-1 px-4 pb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6">
        <section
          aria-label="Mapa de puntos de ayuda"
          className={`mb-4 lg:order-2 lg:mb-0 lg:block lg:self-start lg:sticky lg:top-20 ${
            mobileView === "mapa" ? "block" : "hidden"
          }`}
        >
          {/* En móvil el mapa manda: si lo elegiste, ocupa la pantalla. */}
          <div className="h-[70vh] overflow-hidden rounded-2xl border border-border shadow-sm lg:h-[calc(100dvh-7rem)]">
            <MapView
              markers={markers}
              userLocation={userLoc}
              selectedId={selectedId}
              onSelect={handleSelect}
              center={activeCity.center}
              // Sin puntos en la ciudad, un zoom de barrio solo muestra calles
              // vacías. Se aleja para que entren las zonas afectadas vecinas y
              // el mapa comunique algo.
              zoom={cityHasPoints ? DEFAULT_ZOOM : REGIONAL_ZOOM}
              onProviderChange={setMapProvider}
              className="h-full w-full"
            />
          </div>
        </section>

        {/* Lista de puntos */}
        <section
          aria-label="Lista de puntos de ayuda"
          className={`lg:order-1 lg:block ${
            mobileView === "lista" ? "block" : "hidden"
          }`}
        >
          {/* Sin puntos en esta ciudad: decir qué se sabe y a dónde mirar,
              en vez de dejar la impresión de que allí no pasó nada. */}
          {!cityHasPoints && (
            <div className="mb-4">
              <CityStatus
                city={activeCity}
                nearest={
                  nearestPoint
                    ? {
                        name: nearestPoint.center.name,
                        city: nearestPoint.center.city ?? null,
                        km: nearestPoint.km,
                        onSelect: () => handleSelect(nearestPoint.center.id),
                      }
                    : null
                }
              />
            </div>
          )}

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
