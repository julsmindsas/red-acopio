/**
 * Script de siembra: carga data/centers.seed.json en Postgres/Neon.
 *
 * Uso:
 *   npm run seed          (requiere .env.local con DATABASE_URL o POSTGRES_URL)
 *
 * Realiza un UPSERT por id: si el registro ya existe se actualiza, si no se
 * inserta. Los ids, status, source y timestamps del archivo semilla se respetan.
 *
 * Ejecutar con: tsx scripts/seed-db.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";

import { PostgresStore } from "../lib/db/postgresStore";
import type { Center } from "../lib/types";
import { SEED_FILE } from "../lib/constants";

async function main() {
  // Validamos que la variable de entorno de conexión esté configurada
  const dbUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.error(
      "❌ Error: no se encontró DATABASE_URL ni POSTGRES_URL en las variables de entorno.",
    );
    console.error(
      "   Crea un archivo .env.local con la URL de conexión a Neon (o Postgres).",
    );
    process.exit(1);
  }

  // Leemos el archivo semilla
  const seedPath = path.join(process.cwd(), SEED_FILE);
  if (!fs.existsSync(seedPath)) {
    console.error(`❌ Error: no se encontró el archivo semilla en "${seedPath}".`);
    process.exit(1);
  }

  const raw = fs.readFileSync(seedPath, "utf-8");
  const centers: Center[] = JSON.parse(raw);

  console.log(`\n🌱 Sembrando ${centers.length} centro(s) en Postgres...`);

  // Inicializamos el store (crea la tabla si no existe)
  const store = new PostgresStore();
  await store.init();
  console.log("   Tabla 'centers' lista.\n");

  let insertados = 0;
  let errores = 0;

  for (const center of centers) {
    try {
      await store.upsertFromSeed(center);
      console.log(`   ✔  ${center.id} — ${center.name}`);
      insertados++;
    } catch (err) {
      console.error(`   ✖  ${center.id} — ${center.name}`);
      console.error("      ", err);
      errores++;
    }
  }

  console.log(`\n✅ Siembra completa: ${insertados} OK, ${errores} con error.\n`);

  if (errores > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err);
  process.exit(1);
});
