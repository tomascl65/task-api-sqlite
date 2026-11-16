import { env } from "../../config/env.js";
import { app } from "./app.js";
import { closeDb } from "../../infrastructure/sqlite/connection.js";

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`Señal ${signal} recibida: cerrando servidor...`);
  server.close(() => {
    closeDb();
    // eslint-disable-next-line no-console
    console.log("Servidor cerrado.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
