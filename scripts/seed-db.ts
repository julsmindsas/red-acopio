/**
 * Script de siembra: carga data/centers.seed.json en Postgres/Neon.
 *
 * Uso:
 *   npm run seed                    (requiere .env.local con DATABASE_URL o POSTGRES_URL)
 *   npm run seed -- --list-extra    lista los centros de la base que NO están en la semilla
 *   npm run seed -- --purge-extra   ⚠️ los ELIMINA (irreversible)
 *
 * Realiza un UPSERT por id: si el registro ya existe se actualiza, si no se
 * inserta. Los ids, status, source y timestamps del archivo semilla se respetan.
 *
 * SOBRE `--purge-extra`
 * ---------------------
 * Al cambiar de emergencia, la base queda con los puntos de la anterior. Esos
 * puntos ya no atienden la emergencia activa y mostrarlos manda gente a lugares
 * equivocados. Este modo los borra, pero **nunca se ejecuta por defecto**:
 * también borraría los reportes ciudadanos aprobados que no estén en la semilla.
 * Revisa siempre antes con `--list-extra`.
 *
 * Ejecutar con: tsx scripts/seed-db.ts
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import { PostgresStore } from "../lib/db/postgresStore";
import type { Center } from "../lib/types";
import { SEED_FILE } from "../lib/constants";

// `dotenv/config` solo lee `.env`, pero el proyecto guarda la conexión en
// `.env.local` (que es lo que carga Next.js). Se cargan ambos, con `.env.local`
// como prioritario, para que `npm run seed` funcione con la configuración real.
for (const file of [".env.local", ".env"]) {
  const envPath = path.join(process.cwd(), file);
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
}

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

  // ---------------------------------------------------------------------
  // Puntos que están en la base pero NO en la semilla
  // ---------------------------------------------------------------------
  // Típicamente: puntos de una emergencia anterior, o reportes ciudadanos
  // aprobados desde el panel. Los primeros hay que retirarlos; los segundos
  // hay que conservarlos. Por eso solo se listan, salvo petición explícita.
  const listExtra = process.argv.includes("--list-extra");
  const purgeExtra = process.argv.includes("--purge-extra");

  if (listExtra || purgeExtra) {
    const seedIds = new Set(centers.map((c) => c.id));
    const existing = await store.list();
    const extra = existing.filter((c) => !seedIds.has(c.id));

    if (extra.length === 0) {
      console.log("🔎 No hay centros fuera de la semilla.\n");
    } else if (purgeExtra) {
      console.log(`🗑️  Eliminando ${extra.length} centro(s) fuera de la semilla…`);
      for (const c of extra) {
        await store.remove(c.id);
        console.log(`   ✔  eliminado ${c.id} — ${c.name}`);
      }
      console.log("");
    } else {
      console.log(`🔎 ${extra.length} centro(s) en la base fuera de la semilla:`);
      for (const c of extra) {
        console.log(`   · ${c.id} — ${c.name} (${c.city ?? "sin ciudad"}, ${c.source ?? "sin fuente"})`);
      }
      console.log(
        "\n   Si corresponden a una emergencia anterior, retíralos con:\n" +
          "     npm run seed -- --purge-extra\n" +
          "   ⚠️ Es irreversible y también borraría reportes ciudadanos aprobados.\n",
      );
    }
  }

  if (errores > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err);
  process.exit(1);
});
