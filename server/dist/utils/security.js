import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
const SALT_ROUNDS = 12;
export async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export function signToken(user) {
    return jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
}
export function verifyToken(token) {
    return jwt.verify(token, config.jwtSecret);
}
