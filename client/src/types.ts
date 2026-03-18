export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  username?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  _count?: {
    snippets: number;
  };
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  _count?: {
    snippetTags: number;
  };
}

export interface SnippetTag {
  id: string;
  name: string;
}

export interface Snippet {
  id: string;
  title: string;
  description: string | null;
  language: string;
  code: string;
  isPublic: boolean;
  owner: User;
  category: Pick<Category, "id" | "name"> | null;
  tags: SnippetTag[];
  isFavorite: boolean;
  latestVersion: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SnippetVersion {
  id: string;
  snippetId: string;
  version: number;
  title: string;
  description: string | null;
  language: string;
  code: string;
  createdAt: string;
  createdBy: User | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ShareResponse {
  id: string;
  token: string;
  permission: "VIEW" | "EDIT";
  expiresAt: string | null;
  url: string;
}

export interface SharedSnippetResponse {
  token: string;
  permission: "VIEW" | "EDIT";
  expiresAt: string | null;
  snippet: {
    id: string;
    title: string;
    description: string | null;
    language: string;
    code: string;
    owner: User;
    category: Pick<Category, "id" | "name"> | null;
    tags: SnippetTag[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface SnippetPayload {
  title: string;
  description?: string | null;
  language: string;
  code: string;
  categoryId?: string | null;
  tags: string[];
  isPublic: boolean;
}
