import type { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface JwtClaims extends AuthUser {
  iat?: number;
  exp?: number;
}
