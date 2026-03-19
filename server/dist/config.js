import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
dotenv.config({ path: path.resolve(currentDirPath, "../.env") });
function required(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
export const config = {
    port: Number(process.env.PORT ?? 4000),
    jwtSecret: required("JWT_SECRET", "dev-only-secret-change-me"),
    clientOrigin: process.env.CLIENT_ORIGIN ?? "https://code-snippet-management-server.vercel.app"
};
