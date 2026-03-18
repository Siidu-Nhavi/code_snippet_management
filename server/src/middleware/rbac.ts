import type { Role } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";

export function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions." });
      return;
    }

    next();
  };
}
