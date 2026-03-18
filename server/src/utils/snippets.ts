import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";

export async function assertCategoryOwnership(userId: string, categoryId: string | null | undefined): Promise<void> {
  if (!categoryId) {
    return;
  }

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      ownerId: userId,
      deletedAt: null
    }
  });

  if (!category) {
    throw new HttpError(400, "Invalid category.");
  }
}

export async function syncSnippetTags(snippetId: string, ownerId: string, tags: string[]): Promise<void> {
  const normalized = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];

  const tagRecords = await Promise.all(
    normalized.map(async (name) =>
      prisma.tag.upsert({
        where: {
          name_ownerId: {
            name,
            ownerId
          }
        },
        update: {
          deletedAt: null
        },
        create: {
          name,
          ownerId
        }
      })
    )
  );

  await prisma.snippetTag.deleteMany({ where: { snippetId } });

  if (!tagRecords.length) {
    return;
  }

  await prisma.snippetTag.createMany({
    data: tagRecords.map((tag) => ({
      snippetId,
      tagId: tag.id
    }))
  });
}

export async function createVersionSnapshot(snippetId: string, actorId?: string): Promise<void> {
  const snippet = await prisma.snippet.findUnique({
    where: { id: snippetId },
    select: {
      id: true,
      title: true,
      description: true,
      language: true,
      code: true,
      versions: {
        select: { version: true },
        orderBy: { version: "desc" },
        take: 1
      }
    }
  });

  if (!snippet) {
    throw new HttpError(404, "Snippet not found.");
  }

  const currentVersion = snippet.versions[0]?.version ?? 0;

  await prisma.snippetVersion.create({
    data: {
      snippetId: snippet.id,
      version: currentVersion + 1,
      title: snippet.title,
      description: snippet.description,
      language: snippet.language,
      code: snippet.code,
      createdById: actorId
    }
  });
}

export function canEditSnippet(userId: string, role: string, ownerId: string): boolean {
  return role === "ADMIN" || ownerId === userId;
}
