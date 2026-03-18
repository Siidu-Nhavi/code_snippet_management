import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { CodeBlock } from "../components/CodeBlock";
import { useAuth } from "../context/AuthContext";
import type { Snippet, SnippetVersion } from "../types";

export function SnippetDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [versions, setVersions] = useState<SnippetVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharePermission, setSharePermission] = useState<"VIEW" | "EDIT">("VIEW");
  const [shareExpires, setShareExpires] = useState("");
  const [shareLink, setShareLink] = useState<string | null>(null);

  const canManage = useMemo(() => {
    if (!snippet || !user) {
      return false;
    }
    return user.role === "ADMIN" || snippet.owner.id === user.id;
  }, [snippet, user]);

  const load = async () => {
    if (!token || !id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [snippetData, versionData] = await Promise.all([api.getSnippet(token, id), api.getVersions(token, id)]);
      setSnippet(snippetData);
      setVersions(versionData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load snippet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id, token]);

  const toggleFavorite = async () => {
    if (!token || !id || !snippet) {
      return;
    }

    try {
      const result = await api.toggleFavorite(token, id);
      setSnippet({ ...snippet, isFavorite: result.isFavorite });
    } catch (favoriteError) {
      setError(favoriteError instanceof Error ? favoriteError.message : "Failed to update favorite.");
    }
  };

  const restoreVersion = async (versionId: string) => {
    if (!token || !id) {
      return;
    }

    try {
      const updatedSnippet = await api.restoreVersion(token, id, versionId);
      setSnippet(updatedSnippet);
      await load();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Failed to restore version.");
    }
  };

  const createShareLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !id) {
      return;
    }

    try {
      const result = await api.shareSnippet(token, id, {
        permission: sharePermission,
        expiresAt: shareExpires ? new Date(shareExpires).toISOString() : null
      });
      const webUrl = `${window.location.origin}/shared/${result.token}`;
      setShareLink(webUrl);
      await navigator.clipboard.writeText(webUrl);
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "Failed to share snippet.");
    }
  };

  if (loading) {
    return <main className="detail-layout">Loading snippet...</main>;
  }

  if (!snippet) {
    return (
      <main className="detail-layout">
        <p className="error">{error ?? "Snippet not found."}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </main>
    );
  }

  return (
    <main className="detail-layout">
      <header className="detail-header">
        <div>
          <h1>{snippet.title}</h1>
          <p className="muted">
            {snippet.language} • Owned by {snippet.owner.name}
          </p>
        </div>
        <div className="inline-actions">
          <button className="ghost" onClick={() => void toggleFavorite()}>
            {snippet.isFavorite ? "Unfavorite" : "Favorite"}
          </button>
          <Link className="ghost link-btn" to="/dashboard">
            Back
          </Link>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {snippet.description ? <p className="muted">{snippet.description}</p> : null}

      <CodeBlock code={snippet.code} language={snippet.language} />

      <section className="detail-grid">
        <article className="panel">
          <h2>Version History</h2>
          <div className="version-list">
            {versions.map((version) => (
              <div key={version.id} className="version-row">
                <div>
                  <strong>v{version.version}</strong>
                  <p className="muted small">
                    {new Date(version.createdAt).toLocaleString()} by {version.createdBy?.name ?? "System"}
                  </p>
                </div>
                <button disabled={!canManage} onClick={() => void restoreVersion(version.id)}>
                  Restore
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Share Snippet</h2>
          <form onSubmit={createShareLink} className="auth-form">
            <label>
              Permission
              <select value={sharePermission} onChange={(event) => setSharePermission(event.target.value as "VIEW" | "EDIT")}> 
                <option value="VIEW">View</option>
                <option value="EDIT">Edit</option>
              </select>
            </label>

            <label>
              Expires at (optional)
              <input
                type="datetime-local"
                value={shareExpires}
                onChange={(event) => setShareExpires(event.target.value)}
              />
            </label>

            <button disabled={!canManage}>Generate share link</button>
          </form>

          {shareLink ? (
            <p className="muted small">
              Link copied to clipboard: <a href={shareLink}>{shareLink}</a>
            </p>
          ) : null}
        </article>
      </section>
    </main>
  );
}

