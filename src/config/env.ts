import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

dotenvConfig();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_PATH: z.string().default("./database.sqlite"),
  DB_JOURNAL_MODE: z.enum(["DELETE", "WAL", "MEMORY", "OFF"]).optional(),
  LOG_LEVEL: z.enum(["silent", "error", "warn", "info", "debug"]).default("info"),
});

const _env = envSchema.parse(process.env);

export const env = Object.freeze(_env);

export type Env = z.infer<typeof envSchema>;
