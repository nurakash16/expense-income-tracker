"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("../config/env");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
async function main() {
    const email = 'admin@example.com';
    const password = 'admin123';
    await db_1.AppDataSource.initialize();
    const userRepo = db_1.AppDataSource.getRepository(User_1.User);
    const existing = await userRepo.findOneBy({ email });
    const hash = await bcryptjs_1.default.hash(password, 10);
    if (!existing) {
        const user = userRepo.create({ email, passwordHash: hash });
        await userRepo.save(user);
        console.log('Demo user created:', email);
    }
    else {
        existing.passwordHash = hash;
        await userRepo.save(existing);
        console.log('Demo user password reset:', email);
    }
    await db_1.AppDataSource.destroy();
}
main().catch((err) => {
    console.error('Seed failed', err);
    process.exit(1);
});
