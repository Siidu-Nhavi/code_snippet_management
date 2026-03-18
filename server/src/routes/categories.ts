import { Role, type Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

const categorySchema = z.object({
  name: z.string().trim().min(1).max(80)
});

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const where: Prisma.CategoryWhereInput = req.user!.role === Role.ADMIN ? { deletedAt: null } : { deletedAt: null, ownerId: req.user!.id };

    const categories = await prisma.category.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { snippets: true } }
      }
    });

    res.json(categories);
  })
);

router.post(
  "/",
  requireRole([Role.ADMIN, Role.EDITOR]),
  asyncHandler(async (req, res) => {
    const payload = categorySchema.parse(req.body);

    const category = await prisma.category.upsert({
      where: {
        name_ownerId: {
          name: payload.name,
          ownerId: req.user!.id
        }
      },
      update: {
        deletedAt: null
      },
      create: {
        name: payload.name,
        ownerId: req.user!.id
      }
    });

    res.status(201).json(category);
  })
);

router.patch(
  "/:id",
  requireRole([Role.ADMIN, Role.EDITOR]),
  asyncHandler(async (req, res) => {
    const payload = categorySchema.parse(req.body);

    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });

    if (!existing || existing.deletedAt) {
      throw new HttpError(404, "Category not found.");
    }

    if (existing.ownerId !== req.user!.id && req.user!.role !== Role.ADMIN) {
      throw new HttpError(403, "You cannot modify this category.");
    }

    const updated = await prisma.category.update({
      where: { id: existing.id },
      data: {
        name: payload.name,
        deletedAt: null
      }
    });

    res.json(updated);
  })
);

router.delete(
  "/:id",
  requireRole([Role.ADMIN, Role.EDITOR]),
  asyncHandler(async (req, res) => {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });

    if (!existing || existing.deletedAt) {
      throw new HttpError(404, "Category not found.");
    }

    if (existing.ownerId !== req.user!.id && req.user!.role !== Role.ADMIN) {
      throw new HttpError(403, "You cannot delete this category.");
    }

    await prisma.category.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date()
      }
    });

    res.status(204).send();
  })
);

export default router;
