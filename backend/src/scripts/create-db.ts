import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default DB first
});

async function main() {
    try {
        await client.connect();
        console.log('Connected to postgres default db');

        // Check if db exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'income_tracker'");
        if (res.rowCount === 0) {
            await client.query('CREATE DATABASE income_tracker');
            console.log('✅ Database income_tracker created successfully');
        } else {
            console.log('ℹ️ Database income_tracker already exists');
        }
    } catch (err) {
        console.error('❌ Error creating database:', err);
    } finally {
        await client.end();
    }
}

main();
