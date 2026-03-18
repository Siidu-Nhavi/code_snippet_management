import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { CodeBlock } from "../components/CodeBlock";
import type { SharedSnippetResponse } from "../types";

export function SharedSnippetPage() {
  const { token } = useParams();
  const [payload, setPayload] = useState<SharedSnippetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid share token.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const sharedSnippet = await api.getSharedSnippet(token);
        setPayload(sharedSnippet);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load shared snippet.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  if (loading) {
    return <main className="detail-layout">Loading shared snippet...</main>;
  }

  if (!payload) {
    return (
      <main className="detail-layout">
        <p className="error">{error ?? "Snippet is unavailable."}</p>
        <Link to="/login">Sign in</Link>
      </main>
    );
  }

  return (
    <main className="detail-layout">
      <header className="detail-header">
        <div>
          <h1>{payload.snippet.title}</h1>
          <p className="muted">
            Shared by {payload.snippet.owner.name} ({payload.permission.toLowerCase()} permission)
          </p>
        </div>
        <Link className="ghost link-btn" to="/login">
          Open your workspace
        </Link>
      </header>

      {payload.snippet.description ? <p className="muted">{payload.snippet.description}</p> : null}
      <CodeBlock code={payload.snippet.code} language={payload.snippet.language} />

      <div className="pill-row">
        {payload.snippet.category ? <span className="pill">{payload.snippet.category.name}</span> : null}
        {payload.snippet.tags.map((tag) => (
          <span className="pill" key={tag.id}>
            #{tag.name}
          </span>
        ))}
      </div>
    </main>
  );
}
