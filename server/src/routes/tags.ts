import { Role, type Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

const tagSchema = z.object({
  name: z.string().trim().min(1).max(40)
});

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const where: Prisma.TagWhereInput = req.user!.role === Role.ADMIN ? { deletedAt: null } : { ownerId: req.user!.id, deletedAt: null };

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { snippetTags: true } }
      }
    });

    res.json(tags);
  })
);

router.post(
  "/",
  requireRole([Role.ADMIN, Role.EDITOR]),
  asyncHandler(async (req, res) => {
    const payload = tagSchema.parse(req.body);

    const tag = await prisma.tag.upsert({
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

    res.status(201).json(tag);
  })
);

router.patch(
  "/:id",
  requireRole([Role.ADMIN, Role.EDITOR]),
  asyncHandler(async (req, res) => {
    const payload = tagSchema.parse(req.body);

    const existing = await prisma.tag.findUnique({ where: { id: req.params.id } });

    if (!existing || existing.deletedAt) {
      throw new HttpError(404, "Tag not found.");
    }

    if (existing.ownerId !== req.user!.id && req.user!.role !== Role.ADMIN) {
      throw new HttpError(403, "You cannot modify this tag.");
    }

    const updated = await prisma.tag.update({
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
    const existing = await prisma.tag.findUnique({ where: { id: req.params.id } });

    if (!existing || existing.deletedAt) {
      throw new HttpError(404, "Tag not found.");
    }

    if (existing.ownerId !== req.user!.id && req.user!.role !== Role.ADMIN) {
      throw new HttpError(403, "You cannot delete this tag.");
    }

    await prisma.tag.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date()
      }
    });

    res.status(204).send();
  })
);

export default router;
