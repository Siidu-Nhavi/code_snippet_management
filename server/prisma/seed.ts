import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureUser(name: string, email: string, role: Role): Promise<string> {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      passwordHash
    },
    create: {
      name,
      email,
      role,
      passwordHash
    }
  });

  return user.id;
}

async function ensureCategory(ownerId: string, name: string): Promise<string> {
  const category = await prisma.category.upsert({
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
  });

  return category.id;
}

async function ensureTag(ownerId: string, name: string): Promise<string> {
  const tag = await prisma.tag.upsert({
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
  });

  return tag.id;
}

async function ensureSnippet(
  ownerId: string,
  categoryId: string,
  title: string,
  language: string,
  code: string,
  tagIds: string[]
): Promise<string> {
  const existing = await prisma.snippet.findFirst({
    where: {
      ownerId,
      title,
      deletedAt: null
    }
  });

  const snippet =
    existing ??
    (await prisma.snippet.create({
      data: {
        ownerId,
        title,
        language,
        code,
        description: `Reusable ${language} snippet`,
        categoryId,
        isPublic: false
      }
    }));

  await prisma.snippetTag.deleteMany({ where: { snippetId: snippet.id } });

  await prisma.snippetTag.createMany({
    data: tagIds.map((tagId) => ({ snippetId: snippet.id, tagId }))
  });

  const latest = await prisma.snippetVersion.findFirst({
    where: { snippetId: snippet.id },
    orderBy: { version: "desc" }
  });

  if (!latest) {
    await prisma.snippetVersion.create({
      data: {
        snippetId: snippet.id,
        version: 1,
        title: snippet.title,
        description: snippet.description,
        language: snippet.language,
        code: snippet.code,
        createdById: ownerId
      }
    });
  }

  return snippet.id;
}

async function main(): Promise<void> {
  const adminId = await ensureUser("Admin User", "admin@snippet.local", Role.ADMIN);
  const editorId = await ensureUser("Editor User", "editor@snippet.local", Role.EDITOR);
  const viewerId = await ensureUser("Viewer User", "viewer@snippet.local", Role.VIEWER);

  const backendCategoryId = await ensureCategory(editorId, "Backend");
  const frontendCategoryId = await ensureCategory(editorId, "Frontend");

  const tsTagId = await ensureTag(editorId, "typescript");
  const reactTagId = await ensureTag(editorId, "react");
  const apiTagId = await ensureTag(editorId, "api");

  const snippet1Id = await ensureSnippet(
    editorId,
    backendCategoryId,
    "Express JWT middleware",
    "typescript",
    "export function auth(req, _res, next) {\n  const token = req.headers.authorization?.replace('Bearer ', '');\n  if (!token) throw new Error('missing token');\n  next();\n}",
    [tsTagId, apiTagId]
  );

  const snippet2Id = await ensureSnippet(
    editorId,
    frontendCategoryId,
    "React async hook",
    "typescript",
    "import { useEffect, useState } from 'react';\n\nexport function useAsync(fn) {\n  const [data, setData] = useState(null);\n  useEffect(() => { fn().then(setData); }, [fn]);\n  return data;\n}",
    [tsTagId, reactTagId]
  );

  await prisma.favorite.upsert({
    where: {
      userId_snippetId: {
        userId: viewerId,
        snippetId: snippet1Id
      }
    },
    update: {},
    create: {
      userId: viewerId,
      snippetId: snippet1Id
    }
  });

  await prisma.favorite.upsert({
    where: {
      userId_snippetId: {
        userId: adminId,
        snippetId: snippet2Id
      }
    },
    update: {},
    create: {
      userId: adminId,
      snippetId: snippet2Id
    }
  });

  console.log("Seed completed.");
  console.log("Admin: admin@snippet.local / Password123!");
  console.log("Editor: editor@snippet.local / Password123!");
  console.log("Viewer: viewer@snippet.local / Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
