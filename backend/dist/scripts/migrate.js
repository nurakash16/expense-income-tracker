"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("../config/env");
const db_1 = require("../config/db");
async function main() {
    await db_1.AppDataSource.initialize();
    console.log('DB initialized');
    const res = await db_1.AppDataSource.runMigrations();
    console.log('Migrations run:', res.map(m => m.name));
    await db_1.AppDataSource.destroy();
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
