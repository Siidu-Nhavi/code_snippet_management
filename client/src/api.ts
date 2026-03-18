import type {
  AuthResponse,
  Category,
  ShareResponse,
  SharedSnippetResponse,
  Snippet,
  SnippetPayload,
  SnippetVersion,
  Tag,
  User
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export const api = {
  health: () => request<{ status: string; timestamp: string }>("/health"),

  register: (payload: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  me: (token: string) => request<User>("/auth/me", {}, token),

  getCategories: (token: string) => request<Category[]>("/categories", {}, token),

  createCategory: (token: string, name: string) =>
    request<Category>(
      "/categories",
      {
        method: "POST",
        body: JSON.stringify({ name })
      },
      token
    ),

  getTags: (token: string) => request<Tag[]>("/tags", {}, token),

  createTag: (token: string, name: string) =>
    request<Tag>(
      "/tags",
      {
        method: "POST",
        body: JSON.stringify({ name })
      },
      token
    ),

  getSnippets: (
    token: string,
    filters: {
      query?: string;
      language?: string;
      categoryId?: string;
      tags?: string;
      favorites?: boolean;
    } = {}
  ) => {
    const params = new URLSearchParams();

    if (filters.query) params.set("query", filters.query);
    if (filters.language) params.set("language", filters.language);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.tags) params.set("tags", filters.tags);
    if (filters.favorites) params.set("favorites", "true");

    const queryString = params.toString();
    return request<Snippet[]>(`/snippets${queryString ? `?${queryString}` : ""}`, {}, token);
  },

  getSnippet: (token: string, id: string) => request<Snippet>(`/snippets/${id}`, {}, token),

  getSharedSnippet: (token: string) => request<SharedSnippetResponse>(`/snippets/shared/${token}`),

  createSnippet: (token: string, payload: SnippetPayload) =>
    request<Snippet>(
      "/snippets",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),

  updateSnippet: (token: string, id: string, payload: Partial<SnippetPayload>) =>
    request<Snippet>(
      `/snippets/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload)
      },
      token
    ),

  deleteSnippet: (token: string, id: string) =>
    request<void>(
      `/snippets/${id}`,
      {
        method: "DELETE"
      },
      token
    ),

  toggleFavorite: (token: string, id: string) =>
    request<{ isFavorite: boolean }>(
      `/snippets/${id}/favorite`,
      {
        method: "POST"
      },
      token
    ),

  getVersions: (token: string, id: string) => request<SnippetVersion[]>(`/snippets/${id}/versions`, {}, token),

  restoreVersion: (token: string, id: string, versionId: string) =>
    request<Snippet>(
      `/snippets/${id}/versions/${versionId}/restore`,
      {
        method: "POST"
      },
      token
    ),

  shareSnippet: (
    token: string,
    id: string,
    payload: {
      permission?: "VIEW" | "EDIT";
      expiresAt?: string | null;
    }
  ) =>
    request<ShareResponse>(
      `/snippets/${id}/share`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),

  pullSync: (token: string, since?: string) => {
    const query = since ? `?since=${encodeURIComponent(since)}` : "";
    return request<any>(`/sync/pull${query}`, {}, token);
  },

  pushSync: (token: string, payload: Record<string, unknown>) =>
    request<any>(
      "/sync/push",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    )
};

export { ApiError };
