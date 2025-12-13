"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
async function register(req, res) {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Email & password required' });
    const userRepo = db_1.AppDataSource.getRepository(User_1.User);
    const existing = await userRepo.findOneBy({ email });
    if (existing) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const hash = await bcryptjs_1.default.hash(password, 10);
    const newUser = userRepo.create({ email, passwordHash: hash });
    await userRepo.save(newUser);
    res.json({ message: 'User created successfully' });
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Email & password required' });
    const userRepo = db_1.AppDataSource.getRepository(User_1.User);
    const user = await userRepo.findOneBy({ email });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: 'Invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env['JWT_SECRET'], { expiresIn: '7d' });
    res.json({ token, email: user.email });
}
