import fs from "fs";
import path from "path";
import { openDb, closeDb } from "./connection.js";

const MIGRATIONS_DIR = path.resolve("migrations");

async function readMigrationFiles(): Promise<string[]> {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export async function migrate(): Promise<void> {
  const db = openDb();

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        aplicada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const appliedRows = db
      .prepare("SELECT nombre FROM schema_migrations")
      .all() as { nombre: string }[];
    const applied = new Set(appliedRows.map((r) => r.nombre));

    const files = await readMigrationFiles();
    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      // eslint-disable-next-line no-console
      console.log("No hay migraciones pendientes.");
      return;
    }

    for (const file of pending) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      const insertMigration = db.prepare(
        "INSERT INTO schema_migrations (nombre) VALUES (?)"
      );

      try {
        const transaction = db.transaction(() => {
          db.exec(sql);
          insertMigration.run(file);
        });
        transaction();
        // eslint-disable-next-line no-console
        console.log(`Aplicada: ${file}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Fallo aplicando "${file}": ${err instanceof Error ? err.message : String(err)}`);
        throw new Error(`Migración fallida: ${file}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`Migraciones completadas: ${pending.length} aplicada(s).`);
  } finally {
    closeDb();
  }
}

migrate().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
