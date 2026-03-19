import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { requireRole } from "../middleware/rbac.js";
import { assertCategoryOwnership, createVersionSnapshot, syncSnippetTags } from "../utils/snippets.js";
const router = Router();
const pullSchema = z.object({
    since: z.string().datetime().optional()
});
const pushSchema = z.object({
    categories: z
        .array(z.object({
        id: z.string().cuid().optional(),
        name: z.string().trim().min(1).max(80),
        deleted: z.boolean().optional().default(false)
    }))
        .default([]),
    tags: z
        .array(z.object({
        id: z.string().cuid().optional(),
        name: z.string().trim().min(1).max(40),
        deleted: z.boolean().optional().default(false)
    }))
        .default([]),
    snippets: z
        .array(z.object({
        id: z.string().cuid().optional(),
        title: z.string().trim().min(1).max(140),
        description: z.string().trim().max(5000).optional().nullable(),
        language: z.string().trim().min(1).max(40),
        code: z.string().min(1),
        categoryId: z.string().cuid().optional().nullable(),
        tags: z.array(z.string().trim().min(1).max(40)).default([]),
        isPublic: z.boolean().default(false),
        deleted: z.boolean().optional().default(false)
    }))
        .default([]),
    favorites: z
        .array(z.object({
        snippetId: z.string().cuid(),
        active: z.boolean()
    }))
        .default([])
});
router.use(requireAuth);
router.get("/pull", asyncHandler(async (req, res) => {
    const payload = pullSchema.parse(req.query);
    const sinceDate = payload.since ? new Date(payload.since) : null;
    const categoryWhere = { ownerId: req.user.id };
    const tagWhere = { ownerId: req.user.id };
    const snippetWhere = { ownerId: req.user.id };
    if (sinceDate) {
        categoryWhere.OR = [{ updatedAt: { gte: sinceDate } }, { deletedAt: { gte: sinceDate } }];
        tagWhere.OR = [{ updatedAt: { gte: sinceDate } }, { deletedAt: { gte: sinceDate } }];
        snippetWhere.OR = [{ updatedAt: { gte: sinceDate } }, { deletedAt: { gte: sinceDate } }];
    }
    const [categories, tags, snippets, favorites, versions, shareLinks] = await Promise.all([
        prisma.category.findMany({
            where: categoryWhere,
            orderBy: { updatedAt: "desc" }
        }),
        prisma.tag.findMany({
            where: tagWhere,
            orderBy: { updatedAt: "desc" }
        }),
        prisma.snippet.findMany({
            where: snippetWhere,
            include: {
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
                }
            },
            orderBy: { updatedAt: "desc" }
        }),
        prisma.favorite.findMany({
            where: {
                userId: req.user.id,
                ...(sinceDate ? { createdAt: { gte: sinceDate } } : {})
            }
        }),
        prisma.snippetVersion.findMany({
            where: {
                snippet: {
                    ownerId: req.user.id
                },
                ...(sinceDate ? { createdAt: { gte: sinceDate } } : {})
            },
            orderBy: { createdAt: "desc" }
        }),
        prisma.shareLink.findMany({
            where: {
                createdById: req.user.id,
                ...(sinceDate ? { createdAt: { gte: sinceDate } } : {})
            },
            orderBy: { createdAt: "desc" }
        })
    ]);
    res.json({
        serverTime: new Date().toISOString(),
        categories,
        tags,
        snippets: snippets.map((snippet) => ({
            ...snippet,
            tags: snippet.snippetTags
                .map((entry) => entry.tag)
                .filter((tag) => !tag.deletedAt)
                .map((tag) => ({ id: tag.id, name: tag.name }))
        })),
        favorites,
        versions,
        shareLinks
    });
}));
router.post("/push", requireRole([Role.ADMIN, Role.EDITOR]), asyncHandler(async (req, res) => {
    const payload = pushSchema.parse(req.body);
    for (const category of payload.categories) {
        if (category.id) {
            const existing = await prisma.category.findUnique({ where: { id: category.id } });
            if (existing && existing.ownerId === req.user.id) {
                await prisma.category.update({
                    where: { id: category.id },
                    data: {
                        name: category.name,
                        deletedAt: category.deleted ? new Date() : null
                    }
                });
                continue;
            }
        }
        await prisma.category.create({
            data: {
                id: category.id,
                name: category.name,
                ownerId: req.user.id,
                deletedAt: category.deleted ? new Date() : null
            }
        });
    }
    for (const tag of payload.tags) {
        if (tag.id) {
            const existing = await prisma.tag.findUnique({ where: { id: tag.id } });
            if (existing && existing.ownerId === req.user.id) {
                await prisma.tag.update({
                    where: { id: tag.id },
                    data: {
                        name: tag.name,
                        deletedAt: tag.deleted ? new Date() : null
                    }
                });
                continue;
            }
        }
        await prisma.tag.create({
            data: {
                id: tag.id,
                name: tag.name,
                ownerId: req.user.id,
                deletedAt: tag.deleted ? new Date() : null
            }
        });
    }
    for (const snippet of payload.snippets) {
        if (snippet.categoryId && req.user.role !== Role.ADMIN) {
            await assertCategoryOwnership(req.user.id, snippet.categoryId);
        }
        if (snippet.id) {
            const existing = await prisma.snippet.findUnique({ where: { id: snippet.id } });
            if (existing && existing.ownerId === req.user.id) {
                await prisma.snippet.update({
                    where: { id: snippet.id },
                    data: {
                        title: snippet.title,
                        description: snippet.description ?? null,
                        language: snippet.language,
                        code: snippet.code,
                        categoryId: snippet.categoryId ?? null,
                        isPublic: snippet.isPublic,
                        deletedAt: snippet.deleted ? new Date() : null
                    }
                });
                await syncSnippetTags(snippet.id, req.user.id, snippet.tags);
                await createVersionSnapshot(snippet.id, req.user.id);
                continue;
            }
        }
        const created = await prisma.snippet.create({
            data: {
                id: snippet.id,
                title: snippet.title,
                description: snippet.description ?? null,
                language: snippet.language,
                code: snippet.code,
                categoryId: snippet.categoryId ?? null,
                isPublic: snippet.isPublic,
                deletedAt: snippet.deleted ? new Date() : null,
                ownerId: req.user.id
            }
        });
        await syncSnippetTags(created.id, req.user.id, snippet.tags);
        await createVersionSnapshot(created.id, req.user.id);
    }
    for (const favorite of payload.favorites) {
        if (favorite.active) {
            await prisma.favorite.upsert({
                where: {
                    userId_snippetId: {
                        userId: req.user.id,
                        snippetId: favorite.snippetId
                    }
                },
                update: {},
                create: {
                    userId: req.user.id,
                    snippetId: favorite.snippetId
                }
            });
        }
        else {
            await prisma.favorite.deleteMany({
                where: {
                    userId: req.user.id,
                    snippetId: favorite.snippetId
                }
            });
        }
    }
    res.json({
        message: "Sync push applied successfully.",
        serverTime: new Date().toISOString()
    });
}));
export default router;
