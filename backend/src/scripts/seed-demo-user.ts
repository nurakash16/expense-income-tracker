import 'reflect-metadata';
import '../config/env';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/db';
import { User } from '../entities/User';

async function main() {
    const email = 'admin@example.com';
    const password = 'admin123';

    await AppDataSource.initialize();
    const userRepo = AppDataSource.getRepository(User);

    const existing = await userRepo.findOneBy({ email });
    const hash = await bcrypt.hash(password, 10);

    if (!existing) {
        const user = userRepo.create({ email, passwordHash: hash });
        await userRepo.save(user);
        console.log('Demo user created:', email);
    } else {
        existing.passwordHash = hash;
        await userRepo.save(existing);
        console.log('Demo user password reset:', email);
    }

    await AppDataSource.destroy();
}

main().catch((err) => {
    console.error('Seed failed', err);
    process.exit(1);
});
