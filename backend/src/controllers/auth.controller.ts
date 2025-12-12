import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/db';
import { User } from '../entities/User';

export async function register(req: any, res: any) {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Email & password required' });

    const userRepo = AppDataSource.getRepository(User);
    const existing = await userRepo.findOneBy({ email });

    if (existing) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = userRepo.create({ email, passwordHash: hash });
    await userRepo.save(newUser);

    res.json({ message: 'User created successfully' });
}

export async function login(req: any, res: any) {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Email & password required' });

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ email });

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
    );

    res.json({ token, email: user.email });
}
