import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
dotenv.config({ path: path.resolve(currentDirPath, "../.env") });
const DEFAULT_CLIENT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://code-snippet-management-server.vercel.app"
];
function required(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function parseOrigins(...values) {
    return values
        .flatMap((value) => value?.split(",") ?? [])
        .map((value) => value.trim())
        .filter(Boolean);
}
function unique(values) {
    return [...new Set(values)];
}
function getVercelPreviewPrefixes(origins) {
    const prefixes = new Set();
    for (const origin of origins) {
        try {
            const { hostname } = new URL(origin);
            if (!hostname.endsWith(".vercel.app")) {
                continue;
            }
            prefixes.add(hostname.replace(/\.vercel\.app$/, ""));
        }
        catch {
            // Ignore invalid origins in env values so the app can still boot.
        }
    }
    return [...prefixes];
}
const clientOrigins = unique([
    ...DEFAULT_CLIENT_ORIGINS,
    ...parseOrigins(process.env.CLIENT_ORIGIN, process.env.CLIENT_ORIGINS)
]);
const vercelPreviewPrefixes = getVercelPreviewPrefixes(clientOrigins);
function isAllowedVercelPreview(origin) {
    try {
        const { protocol, hostname } = new URL(origin);
        if (protocol !== "https:" || !hostname.endsWith(".vercel.app")) {
            return false;
        }
        return vercelPreviewPrefixes.some((prefix) => hostname === `${prefix}.vercel.app` || hostname.startsWith(`${prefix}-`));
    }
    catch {
        return false;
    }
}
function isAllowedClientOrigin(origin) {
    if (!origin) {
        return true;
    }
    return clientOrigins.includes(origin) || isAllowedVercelPreview(origin);
}
export const config = {
    port: Number(process.env.PORT ?? 4000),
    jwtSecret: required("JWT_SECRET", "dev-only-secret-change-me"),
    clientOrigins,
    isAllowedClientOrigin
};
