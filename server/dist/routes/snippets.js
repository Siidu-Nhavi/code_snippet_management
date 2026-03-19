import { Role, SharePermission } from "@prisma/client";
import { nanoid } from "nanoid";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireRole } from "../middleware/rbac.js";
import { assertCategoryOwnership, canEditSnippet, createVersionSnapshot, syncSnippetTags } from "../utils/snippets.js";
const router = Router();
const createSnippetSchema = z.object({
    title: z.string().trim().min(1).max(140),
    description: z.string().trim().max(5000).optional().nullable(),
    language: z.string().trim().min(1).max(40),
    code: z.string().min(1),
    categoryId: z.string().cuid().optional().nullable(),
    tags: z.array(z.string().trim().min(1).max(40)).default([]),
    isPublic: z.boolean().default(false)
});
const updateSnippetSchema = createSnippetSchema.partial();
const shareSchema = z.object({
    permission: z.nativeEnum(SharePermission).default(SharePermission.VIEW),
    expiresAt: z.string().datetime().optional().nullable()
});
function snippetInclude(userId) {
    return {
        owner: {
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        },
        category: {
            select: {
                id: true,
                name: true
            }
        },
        snippetTags: {
            include: {
                tag: {
                    select: {
                        id: true,
                        name: true,
                        deletedAt: true
                    }
                }
            }
        },
        favorites: {
            where: {
                userId
            },
            select: {
                userId: true
            }
        },
        versions: {
            select: {
                id: true,
                version: true,
                createdAt: true
            },
            orderBy: {
                version: "desc"
            },
            take: 1
        }
    };
}
function mapSnippet(snippet) {
    return {
        id: snippet.id,
        title: snippet.title,
        description: snippet.description,
        language: snippet.language,
        code: snippet.code,
        isPublic: snippet.isPublic,
        owner: snippet.owner,
        category: snippet.category,
        tags: snippet.snippetTags
            .map((entry) => entry.tag)
            .filter((tag) => !tag.deletedAt)
            .map((tag) => ({ id: tag.id, name: tag.name })),
        isFavorite: snippet.favorites.length > 0,
        latestVersion: snippet.versions[0]?.version ?? null,
        createdAt: snippet.createdAt,
        updatedAt: snippet.updatedAt,
        deletedAt: snippet.deletedAt
    };
}
function visibilityFilter(userId, role) {
    if (role === Role.ADMIN) {
        return { deletedAt: null };
    }
    return {
        deletedAt: null,
        OR: [
            { ownerId: userId },
            { isPublic: true },
            {
                sharedLinks: {
                    some: {
                        isRevoked: false,
                        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
                    }
                }
            }
        ]
    };
}
async function getSnippetOrThrow(id) {
    const snippet = await prisma.snippet.findUnique({
        where: { id },
        include: {
            owner: true,
            sharedLinks: true
        }
    });
    if (!snippet || snippet.deletedAt) {
        throw new HttpError(404, "Snippet not found.");
    }
    return snippet;
}
async function assertReadable(snippetId, userId, role) {
    if (role === Role.ADMIN) {
        return;
    }
    const snippet = await prisma.snippet.findUnique({
        where: { id: snippetId },
        include: {
            sharedLinks: {
                where: {
                    isRevoked: false,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
                }
            }
        }
    });
    if (!snippet || snippet.deletedAt) {
        throw new HttpError(404, "Snippet not found.");
    }
    if (snippet.ownerId !== userId && !snippet.isPublic && snippet.sharedLinks.length === 0) {
        throw new HttpError(403, "You cannot view this snippet.");
    }
}
router.use((req, res, next) => {
    if (req.path.startsWith("/shared/")) {
        next();
        return;
    }
    requireAuth(req, res, next);
});
router.get("/", asyncHandler(async (req, res) => {
    const { query, language, categoryId, tags, favorites } = req.query;
    const searchTerm = typeof query === "string" ? query.trim() : "";
    const languageFilter = typeof language === "string" ? language.trim() : "";
    const categoryFilter = typeof categoryId === "string" ? categoryId.trim() : "";
    const tagFilter = typeof tags === "string" ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [];
    const favoritesOnly = favorites === "true";
    const filters = [visibilityFilter(req.user.id, req.user.role)];
    if (searchTerm) {
        filters.push({
            OR: [
                { title: { contains: searchTerm } },
                { description: { contains: searchTerm } },
                { code: { contains: searchTerm } },
                { language: { contains: searchTerm } },
                { snippetTags: { some: { tag: { name: { contains: searchTerm }, deletedAt: null } } } },
                { category: { is: { name: { contains: searchTerm }, deletedAt: null } } }
            ]
        });
    }
    if (languageFilter) {
        filters.push({ language: { equals: languageFilter } });
    }
    if (categoryFilter) {
        filters.push({ categoryId: categoryFilter });
    }
    if (tagFilter.length > 0) {
        filters.push({
            snippetTags: {
                some: {
                    tag: {
                        name: { in: tagFilter },
                        deletedAt: null
                    }
                }
            }
        });
    }
    if (favoritesOnly) {
        filters.push({
            favorites: {
                some: {
                    userId: req.user.id
                }
            }
        });
    }
    const snippets = await prisma.snippet.findMany({
        where: { AND: filters },
        include: snippetInclude(req.user.id),
        orderBy: { updatedAt: "desc" }
    });
    res.json(snippets.map(mapSnippet));
}));
router.get("/shared/:token", asyncHandler(async (req, res) => {
    const link = await prisma.shareLink.findUnique({
        where: { token: req.params.token },
        include: {
            snippet: {
                include: {
                    owner: {
                        select: { id: true, name: true, email: true, role: true }
                    },
                    category: {
                        select: { id: true, name: true }
                    },
                    snippetTags: {
                        include: {
                            tag: {
                                select: { id: true, name: true, deletedAt: true }
                            }
                        }
                    }
                }
            }
        }
    });
    if (!link || link.isRevoked || (link.expiresAt && link.expiresAt < new Date())) {
        throw new HttpError(404, "Share link is invalid or expired.");
    }
    if (link.snippet.deletedAt) {
        throw new HttpError(404, "Snippet not found.");
    }
    res.json({
        token: link.token,
        permission: link.permission,
        expiresAt: link.expiresAt,
        snippet: {
            id: link.snippet.id,
            title: link.snippet.title,
            description: link.snippet.description,
            language: link.snippet.language,
            code: link.snippet.code,
            owner: link.snippet.owner,
            category: link.snippet.category,
            tags: link.snippet.snippetTags
                .map((entry) => entry.tag)
                .filter((tag) => !tag.deletedAt)
                .map((tag) => ({ id: tag.id, name: tag.name })),
            createdAt: link.snippet.createdAt,
            updatedAt: link.snippet.updatedAt
        }
    });
}));
router.get("/:id", asyncHandler(async (req, res) => {
    await assertReadable(req.params.id, req.user.id, req.user.role);
    const snippet = await prisma.snippet.findUnique({
        where: { id: req.params.id },
        include: snippetInclude(req.user.id)
    });
    if (!snippet || snippet.deletedAt) {
        throw new HttpError(404, "Snippet not found.");
    }
    res.json(mapSnippet(snippet));
}));
router.post("/", requireRole([Role.ADMIN, Role.EDITOR]), asyncHandler(async (req, res) => {
    const payload = createSnippetSchema.parse(req.body);
    if (req.user.role !== Role.ADMIN) {
        await assertCategoryOwnership(req.user.id, payload.categoryId ?? null);
    }
    const snippet = await prisma.snippet.create({
        data: {
            title: payload.title,
            description: payload.description ?? null,
            language: payload.language,
            code: payload.code,
            categoryId: payload.categoryId ?? null,
            isPublic: payload.isPublic,
            ownerId: req.user.id
        }
    });
    await syncSnippetTags(snippet.id, req.user.id, payload.tags);
    await createVersionSnapshot(snippet.id, req.user.id);
    const hydrated = await prisma.snippet.findUnique({
        where: { id: snippet.id },
        include: snippetInclude(req.user.id)
    });
    res.status(201).json(mapSnippet(hydrated));
}));
router.patch("/:id", requireRole([Role.ADMIN, Role.EDITOR]), asyncHandler(async (req, res) => {
    const payload = updateSnippetSchema.parse(req.body);
    const snippet = await getSnippetOrThrow(req.params.id);
    if (!canEditSnippet(req.user.id, req.user.role, snippet.ownerId)) {
        throw new HttpError(403, "You cannot modify this snippet.");
    }
    if (payload.categoryId !== undefined && req.user.role !== Role.ADMIN) {
        await assertCategoryOwnership(req.user.id, payload.categoryId ?? null);
    }
    await prisma.snippet.update({
        where: { id: snippet.id },
        data: {
            title: payload.title ?? snippet.title,
            description: payload.description !== undefined ? payload.description : snippet.description,
            language: payload.language ?? snippet.language,
            code: payload.code ?? snippet.code,
            categoryId: payload.categoryId !== undefined ? payload.categoryId : snippet.categoryId,
            isPublic: payload.isPublic ?? snippet.isPublic,
            deletedAt: null
        }
    });
    if (payload.tags) {
        await syncSnippetTags(snippet.id, snippet.ownerId, payload.tags);
    }
    await createVersionSnapshot(snippet.id, req.user.id);
    const hydrated = await prisma.snippet.findUnique({
        where: { id: snippet.id },
        include: snippetInclude(req.user.id)
    });
    res.json(mapSnippet(hydrated));
}));
router.delete("/:id", requireRole([Role.ADMIN, Role.EDITOR]), asyncHandler(async (req, res) => {
    const snippet = await getSnippetOrThrow(req.params.id);
    if (!canEditSnippet(req.user.id, req.user.role, snippet.ownerId)) {
        throw new HttpError(403, "You cannot delete this snippet.");
    }
    await prisma.snippet.update({
        where: { id: snippet.id },
        data: {
            deletedAt: new Date()
        }
    });
    res.status(204).send();
}));
router.post("/:id/favorite", asyncHandler(async (req, res) => {
    await assertReadable(req.params.id, req.user.id, req.user.role);
    const existing = await prisma.favorite.findUnique({
        where: {
            userId_snippetId: {
                userId: req.user.id,
                snippetId: req.params.id
            }
        }
    });
    if (existing) {
        await prisma.favorite.delete({
            where: {
                userId_snippetId: {
                    userId: req.user.id,
                    snippetId: req.params.id
                }
            }
        });
        res.json({ isFavorite: false });
        return;
    }
    await prisma.favorite.create({
        data: {
            userId: req.user.id,
            snippetId: req.params.id
        }
    });
    res.json({ isFavorite: true });
}));
router.get("/:id/versions", asyncHandler(async (req, res) => {
    await assertReadable(req.params.id, req.user.id, req.user.role);
    const versions = await prisma.snippetVersion.findMany({
        where: { snippetId: req.params.id },
        orderBy: { version: "desc" },
        include: {
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });
    res.json(versions);
}));
router.post("/:id/versions/:versionId/restore", requireRole([Role.ADMIN, Role.EDITOR]), asyncHandler(async (req, res) => {
    const snippet = await getSnippetOrThrow(req.params.id);
    if (!canEditSnippet(req.user.id, req.user.role, snippet.ownerId)) {
        throw new HttpError(403, "You cannot restore this snippet.");
    }
    const version = await prisma.snippetVersion.findUnique({ where: { id: req.params.versionId } });
    if (!version || version.snippetId !== snippet.id) {
        throw new HttpError(404, "Version not found.");
    }
    await prisma.snippet.update({
        where: { id: snippet.id },
        data: {
            title: version.title,
            description: version.description,
            language: version.language,
            code: version.code,
            deletedAt: null
        }
    });
    await createVersionSnapshot(snippet.id, req.user.id);
    const hydrated = await prisma.snippet.findUnique({
        where: { id: snippet.id },
        include: snippetInclude(req.user.id)
    });
    res.json(mapSnippet(hydrated));
}));
router.post("/:id/share", asyncHandler(async (req, res) => {
    const payload = shareSchema.parse(req.body);
    const snippet = await getSnippetOrThrow(req.params.id);
    if (!canEditSnippet(req.user.id, req.user.role, snippet.ownerId)) {
        throw new HttpError(403, "You cannot share this snippet.");
    }
    const shareLink = await prisma.shareLink.create({
        data: {
            token: nanoid(18),
            snippetId: snippet.id,
            permission: payload.permission,
            expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
            createdById: req.user.id
        }
    });
    res.status(201).json({
        id: shareLink.id,
        token: shareLink.token,
        permission: shareLink.permission,
        expiresAt: shareLink.expiresAt,
        url: `${req.protocol}://${req.get("host")}/api/snippets/shared/${shareLink.token}`
    });
}));
router.delete("/share/:token", asyncHandler(async (req, res) => {
    const link = await prisma.shareLink.findUnique({
        where: { token: req.params.token },
        include: { snippet: true }
    });
    if (!link) {
        throw new HttpError(404, "Share link not found.");
    }
    if (!canEditSnippet(req.user.id, req.user.role, link.snippet.ownerId)) {
        throw new HttpError(403, "You cannot revoke this share link.");
    }
    await prisma.shareLink.update({
        where: { token: req.params.token },
        data: { isRevoked: true }
    });
    res.status(204).send();
}));
export default router;
