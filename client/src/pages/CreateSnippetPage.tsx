import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { AppNavbar } from "../components/AppNavbar";
import { SnippetForm } from "../components/SnippetForm";
import { SUPPORTED_LANGUAGES } from "../constants/languages";
import { useAuth } from "../context/AuthContext";
import { useCloudSync } from "../hooks/useCloudSync";
import type { Category, Snippet, SnippetPayload, Tag } from "../types";

export function CreateSnippetPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { markLocalChanges } = useCloudSync(token);

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [initialSnippet, setInitialSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editId = searchParams.get("edit");

  useEffect(() => {
    const load = async () => {
      if (!token) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [categoryData, tagData] = await Promise.all([api.getCategories(token), api.getTags(token)]);
        setCategories(categoryData.filter((category) => !category.deletedAt));
        setTags(tagData.filter((tag) => !tag.deletedAt));

        if (editId) {
          const snippet = await api.getSnippet(token, editId);
          setInitialSnippet(snippet);
        } else {
          setInitialSnippet(null);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load form data.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [editId, token]);

  const handleSubmit = async (payload: SnippetPayload, id?: string) => {
    if (!token) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (id) {
        await api.updateSnippet(token, id, payload);
      } else {
        await api.createSnippet(token, payload);
      }

      markLocalChanges();
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save snippet.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="dashboard-layout">
      <AppNavbar showSearch={false} />

      <section className="panel page-panel create-page-panel">
        <header className="page-header-row">
          <h2>{editId ? "Edit Snippet" : "Create Snippet"}</h2>
          <p className="muted">Focused full-page form for snippet creation and editing.</p>
        </header>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading form...</p> : null}

        {!loading ? (
          <SnippetForm
            categories={categories}
            tags={tags}
            languages={SUPPORTED_LANGUAGES}
            initialSnippet={initialSnippet}
            loading={saving}
            cancelLabel="Cancel"
            cancelMode="cancel"
            draftStorageKey={editId ? undefined : `snippet_manager_create_draft_${user?.id ?? "guest"}`}
            onCancel={() => navigate("/dashboard")}
            onSubmit={handleSubmit}
          />
        ) : null}
      </section>
    </main>
  );
}


