import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/security.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }

  const token = authorization.slice("Bearer ".length);

  try {
    const claims = verifyToken(token);
    req.user = {
      id: claims.id,
      email: claims.email,
      name: claims.name,
      role: claims.role
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}
