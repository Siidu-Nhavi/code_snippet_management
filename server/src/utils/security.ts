import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthUser, JwtClaims } from "../types/auth.js";
import { config } from "../config.js";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtClaims {
  return jwt.verify(token, config.jwtSecret) as JwtClaims;
}
