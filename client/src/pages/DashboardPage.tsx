import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { AppNavbar } from "../components/AppNavbar";
import { Button, ButtonLink } from "../components/Button";
import { CodeBlock } from "../components/CodeBlock";
import { SnippetCard } from "../components/SnippetCard";
import { SUPPORTED_LANGUAGES, getLanguageMeta } from "../constants/languages";
import { useAuth } from "../context/AuthContext";
import { useCloudSync } from "../hooks/useCloudSync";
import type { Category, Snippet, Tag } from "../types";

interface Filters {
  query: string;
  language: string;
  categoryId: string;
  tags: string;
  favorites: boolean;
}

type SortMode = "recent" | "most-used" | "favorites";

const defaultFilters: Filters = {
  query: "",
  language: "",
  categoryId: "",
  tags: "",
  favorites: false
};

export function DashboardPage() {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { markLocalChanges } = useCloudSync(token);

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState<Filters>(defaultFilters);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [previewSnippet, setPreviewSnippet] = useState<Snippet | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const [navSearch, setNavSearch] = useState("");

  const usageStorageKey = `snippet_manager_usage_${user?.id ?? "guest"}`;
  const canWrite = user?.role !== "VIEWER";
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(usageStorageKey);

    if (!raw) {
      setUsageMap({});
      return;
    }

    try {
      setUsageMap(JSON.parse(raw) as Record<string, number>);
    } catch {
      setUsageMap({});
    }
  }, [usageStorageKey]);

  useEffect(() => {
    localStorage.setItem(usageStorageKey, JSON.stringify(usageMap));
  }, [usageMap, usageStorageKey]);

  useEffect(() => {
    setNavSearch(draftFilters.query);
  }, [draftFilters.query]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const favoritesOnly = params.get("favorites") === "1";

    if (!favoritesOnly) {
      return;
    }

    setDraftFilters((previous) => ({ ...previous, favorites: true }));
    setFilters((previous) => ({ ...previous, favorites: true }));
    setSortMode("favorites");
  }, [location.search]);

  useEffect(() => {
    if (location.hash !== "#filters") {
      return;
    }

    setIsSidebarCollapsed(false);
    const target = document.getElementById("filters-panel");

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  useEffect(() => {
    const onShortcuts = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onShortcuts);
    return () => window.removeEventListener("keydown", onShortcuts);
  }, []);

  useEffect(() => {
    if (!previewSnippet) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewSnippet(null);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [previewSnippet]);

  const loadData = async (activeFilters: Filters) => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [snippetData, categoryData, tagData] = await Promise.all([
        api.getSnippets(token, {
          query: activeFilters.query,
          language: activeFilters.language,
          categoryId: activeFilters.categoryId,
          tags: activeFilters.tags,
          favorites: activeFilters.favorites
        }),
        api.getCategories(token),
        api.getTags(token)
      ]);

      setSnippets(snippetData);
      setCategories(categoryData.filter((category) => !category.deletedAt));
      setTags(tagData.filter((tag) => !tag.deletedAt));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load snippets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(filters);
  }, [filters, token]);

  const sortedSnippets = useMemo(() => {
    const list = [...snippets];

    if (sortMode === "most-used") {
      return list.sort((a, b) => (usageMap[b.id] ?? 0) - (usageMap[a.id] ?? 0));
    }

    if (sortMode === "favorites") {
      return list.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) {
          return -1;
        }

        if (!a.isFavorite && b.isFavorite) {
          return 1;
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [snippets, sortMode, usageMap]);

  const applyFilters = () => {
    setFilters(draftFilters);
    setNavSearch(draftFilters.query);
  };

  const resetFilters = () => {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
    setNavSearch("");
  };

  const submitGlobalSearch = () => {
    setDraftFilters((previous) => ({ ...previous, query: navSearch }));
    setFilters((previous) => ({ ...previous, query: navSearch }));
  };

  const recordUsage = (snippetId: string) => {
    setUsageMap((current) => ({
      ...current,
      [snippetId]: (current[snippetId] ?? 0) + 1
    }));
  };

  const handleDeleteSnippet = async (id: string) => {
    if (!token || !confirm("Delete this snippet?")) {
      return;
    }

    try {
      await api.deleteSnippet(token, id);
      markLocalChanges();
      await loadData(filters);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete snippet.");
    }
  };

  const handleFavorite = async (id: string) => {
    if (!token) {
      return;
    }

    try {
      const result = await api.toggleFavorite(token, id);
      setSnippets((previous) =>
        previous.map((snippet) =>
          snippet.id === id
            ? {
                ...snippet,
                isFavorite: result.isFavorite
              }
            : snippet
        )
      );
      markLocalChanges();
    } catch (favoriteError) {
      setError(favoriteError instanceof Error ? favoriteError.message : "Failed to update favorite.");
    }
  };

  const handleAddCategory = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token || !newCategoryName.trim()) {
      return;
    }

    try {
      await api.createCategory(token, newCategoryName.trim());
      setNewCategoryName("");
      markLocalChanges();
      await loadData(filters);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create category.");
    }
  };

  const handleAddTag = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token || !newTagName.trim()) {
      return;
    }

    try {
      await api.createTag(token, newTagName.trim());
      setNewTagName("");
      markLocalChanges();
      await loadData(filters);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create tag.");
    }
  };

  return (
    <main className="dashboard-layout">
      <AppNavbar
        searchValue={navSearch}
        onSearchChange={setNavSearch}
        onSearchSubmit={submitGlobalSearch}
      />

      <section className="content-grid dashboard-grid">
        <aside id="filters-panel" className={`panel filters-panel ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-header-row">
            <h2>Search & Filters</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarCollapsed((value) => !value)}>
              {isSidebarCollapsed ? "Expand" : "Collapse"}
            </Button>
          </div>

          {!isSidebarCollapsed ? (
            <>
              <div className="section-block">
                <label>
                  <span className="label-title">Search</span>
                  <input
                    ref={searchInputRef}
                    value={draftFilters.query}
                    onChange={(event) => setDraftFilters((previous) => ({ ...previous, query: event.target.value }))}
                    placeholder="title, code, tags"
                  />
                </label>

                <label>
                  <span className="label-title">Language</span>
                  <select
                    value={draftFilters.language}
                    onChange={(event) => setDraftFilters((previous) => ({ ...previous, language: event.target.value }))}
                  >
                    <option value="">All</option>
                    {SUPPORTED_LANGUAGES.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.icon}  {language.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="label-title">Category</span>
                  <select
                    value={draftFilters.categoryId}
                    onChange={(event) => setDraftFilters((previous) => ({ ...previous, categoryId: event.target.value }))}
                  >
                    <option value="">All</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="label-title">Tags</span>
                  <input
                    value={draftFilters.tags}
                    onChange={(event) => setDraftFilters((previous) => ({ ...previous, tags: event.target.value }))}
                    placeholder="react, auth"
                  />
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={draftFilters.favorites}
                    onChange={(event) =>
                      setDraftFilters((previous) => ({ ...previous, favorites: event.target.checked }))
                    }
                  />
                  Favorites only
                </label>

                <div className="inline-actions">
                  <Button variant="primary" onClick={applyFilters}>
                    Apply
                  </Button>
                  <Button variant="ghost" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>
              </div>

              <div className="section-block">
                <h2>Taxonomy</h2>
                <form className="inline-form" onSubmit={handleAddCategory}>
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="New category"
                    disabled={!canWrite}
                  />
                  <Button variant="secondary" disabled={!canWrite}>
                    Add
                  </Button>
                </form>

                <form className="inline-form" onSubmit={handleAddTag}>
                  <input
                    value={newTagName}
                    onChange={(event) => setNewTagName(event.target.value)}
                    placeholder="New tag"
                    disabled={!canWrite}
                  />
                  <Button variant="secondary" disabled={!canWrite}>
                    Add
                  </Button>
                </form>
              </div>
            </>
          ) : null}
        </aside>

        <section className="panel snippets-panel">
          <div className="section-header snippets-header">
            <div>
              <h2>Snippets</h2>
              <p className="muted small">{sortedSnippets.length} result(s)</p>
            </div>

            <label className="sort-control">
              <span className="muted small">Sort</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                <option value="recent">Recent</option>
                <option value="most-used">Most Used</option>
                <option value="favorites">Favorites</option>
              </select>
            </label>
          </div>

          {error ? <p className="error">{error}</p> : null}
          {loading ? <p className="muted">Loading snippets...</p> : null}

          {!loading && !sortedSnippets.length ? (
            <div className="empty-state">
              <p>No snippets found with current filters.</p>
            </div>
          ) : null}

          <div className="snippet-grid">
            {sortedSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                viewsCount={usageMap[snippet.id] ?? 0}
                canManage={Boolean(canWrite && (user?.role === "ADMIN" || snippet.owner.id === user?.id))}
                onEdit={(item) => navigate(`/create-snippet?edit=${item.id}`)}
                onDelete={handleDeleteSnippet}
                onFavorite={handleFavorite}
                onPreview={(item) => {
                  recordUsage(item.id);
                  setPreviewSnippet(item);
                }}
                onOpen={recordUsage}
              />
            ))}
          </div>
        </section>
      </section>

      {previewSnippet ? (
        <div className="modal-backdrop" onClick={() => setPreviewSnippet(null)}>
          <div className="preview-modal" onClick={(event) => event.stopPropagation()}>
            <header className="preview-header">
              <div>
                <h3>{previewSnippet.title}</h3>
                <p className="muted small">
                  {getLanguageMeta(previewSnippet.language).label} • {previewSnippet.owner.name}
                </p>
              </div>
              <div className="inline-actions">
                <Button variant="ghost" size="sm" onClick={() => void navigator.clipboard.writeText(previewSnippet.code)}>
                  Copy
                </Button>
                <ButtonLink
                  to={`/snippets/${previewSnippet.id}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => recordUsage(previewSnippet.id)}
                >
                  Open
                </ButtonLink>
                <Button variant="ghost" size="sm" onClick={() => setPreviewSnippet(null)}>
                  Close
                </Button>
              </div>
            </header>

            <CodeBlock code={previewSnippet.code} language={previewSnippet.language} maxHeight={420} />
          </div>
        </div>
      ) : null}
    </main>
  );
}




