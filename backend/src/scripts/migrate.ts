import 'reflect-metadata';
import '../config/env';
import { AppDataSource } from '../config/db';

async function main() {
    await AppDataSource.initialize();
    console.log('DB initialized');

    const res = await AppDataSource.runMigrations();
    console.log('Migrations run:', res.map(m => m.name));

    await AppDataSource.destroy();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
