import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireAuth } from "../middleware/auth.js";
import { hashPassword, signToken, verifyPassword } from "../utils/security.js";
const router = Router();
const registerSchema = z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(128)
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128)
});
router.post("/register", asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (existing) {
        throw new HttpError(409, "Email is already in use.");
    }
    const usersCount = await prisma.user.count();
    const role = usersCount === 0 ? Role.ADMIN : Role.EDITOR;
    const user = await prisma.user.create({
        data: {
            name: payload.name,
            email: payload.email.toLowerCase(),
            passwordHash: await hashPassword(payload.password),
            role
        }
    });
    const token = signToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    });
    res.status(201).json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
}));
router.post("/login", asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (!user) {
        throw new HttpError(401, "Invalid credentials.");
    }
    const isValid = await verifyPassword(payload.password, user.passwordHash);
    if (!isValid) {
        throw new HttpError(401, "Invalid credentials.");
    }
    const token = signToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    });
    res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
}));
router.get("/me", requireAuth, asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true
        }
    });
    if (!user) {
        throw new HttpError(404, "User not found.");
    }
    res.json(user);
}));
export default router;
