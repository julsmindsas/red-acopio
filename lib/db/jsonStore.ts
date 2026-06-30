/**
 * Implementación del repositorio usando un archivo JSON local.
 *
 * Útil para desarrollo sin necesidad de configurar una base de datos.
 * NOTA: En Vercel el sistema de archivos es efímero y de solo lectura
 * en las rutas de la aplicación; este store es EXCLUSIVO para entorno local.
 */
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

import type { Center, CenterInput } from "../types";
import type { CenterRepository, CreateMeta } from "./repository";

/**
 * Convierte el nombre del centro en un slug URL-friendly.
 * Ejemplo: "Centro de acopio Laureles" → "centro-de-acopio-laureles"
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // elimina diacríticos
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export class JsonStore implements CenterRepository {
  // Rutas acotadas explícitamente al subdirectorio "data" (segmento literal
  // separado) para que el trazador de archivos de Next no incluya todo el
  // proyecto en el bundle.
  private localPath = path.join(process.cwd(), "data", "centers.local.json");
  private seedPath = path.join(process.cwd(), "data", "centers.seed.json");

  /**
   * Modo solo-lectura: se activa cuando el sistema de archivos no permite
   * escribir (p. ej. el FS efímero/solo-lectura de Vercel cuando NO hay base de
   * datos configurada). En ese caso, list()/getById() leen directamente la
   * semilla y create() devuelve un error claro pidiendo configurar Postgres.
   */
  private readOnly = false;

  /**
   * Inicializa el store: si no existe data/centers.local.json, lo crea
   * copiando el archivo semilla. Si el FS es de solo lectura, cae a modo
   * solo-lectura sirviendo la semilla.
   */
  async init(): Promise<void> {
    try {
      await fs.access(this.localPath);
    } catch {
      // El archivo local no existe; intentamos crearlo a partir de la semilla.
      try {
        const seed = await fs.readFile(this.seedPath, "utf-8");
        await fs.mkdir(path.dirname(this.localPath), { recursive: true });
        await fs.writeFile(this.localPath, seed, "utf-8");
      } catch {
        // No se pudo escribir (FS de solo lectura, p. ej. Vercel sin DB):
        // operamos en modo solo-lectura leyendo la semilla.
        this.readOnly = true;
      }
    }
  }

  /**
   * Lee y parsea los centros. En modo normal usa el archivo local mutable;
   * en modo solo-lectura usa directamente la semilla versionada.
   */
  private async readAll(): Promise<Center[]> {
    const raw = await fs.readFile(
      this.readOnly ? this.seedPath : this.localPath,
      "utf-8",
    );
    return JSON.parse(raw) as Center[];
  }

  /** Escribe la lista completa de centros al archivo local. */
  private async writeAll(centers: Center[]): Promise<void> {
    await fs.writeFile(this.localPath, JSON.stringify(centers, null, 2), "utf-8");
  }

  async list(): Promise<Center[]> {
    return this.readAll();
  }

  async getById(id: string): Promise<Center | null> {
    const centers = await this.readAll();
    return centers.find((c) => c.id === id) ?? null;
  }

  async create(input: CenterInput, meta?: CreateMeta): Promise<Center> {
    if (this.readOnly) {
      throw new Error(
        "READ_ONLY_STORE: el almacenamiento es de solo lectura en este entorno. " +
          "Configura DATABASE_URL o POSTGRES_URL (Postgres/Neon) para habilitar el registro de centros.",
      );
    }

    const centers = await this.readAll();

    // Generamos un id único: slug del nombre + sufijo aleatorio
    const slug = toSlug(input.name);
    const suffix = crypto.randomUUID().slice(0, 8);
    const id = `${slug}-${suffix}`;

    const now = new Date().toISOString();

    const center: Center = {
      id,
      name: input.name,
      address: input.address,
      phone: input.phone ?? null,
      materials: input.materials,
      schedule: input.schedule,
      lat: input.lat,
      lng: input.lng,
      notes: input.notes ?? null,
      source: meta?.source ?? "reporte-ciudadano",
      status: meta?.status ?? "reportado",
      createdAt: now,
      updatedAt: now,
    };

    centers.push(center);
    await this.writeAll(centers);
    return center;
  }
}
