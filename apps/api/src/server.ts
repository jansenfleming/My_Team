// Process entrypoint: `npm run dev -w @site/api` / `npm start -w @site/api`.
import { buildApp } from "./app";
import { ConfigError, loadConfig } from "./config";
import { openDb } from "./db/connection";
import { runMigrations } from "./db/migrate";

async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(err instanceof ConfigError ? err.message : "Failed to load configuration.");
    process.exit(1);
  }

  const db = openDb(config.databasePath);
  runMigrations(db);

  const app = await buildApp(config, { db });
  try {
    await app.listen({ host: config.host, port: config.port });
  } catch (err) {
    app.log.error({ err }, "failed to start");
    process.exit(1);
  }
}

void main();
