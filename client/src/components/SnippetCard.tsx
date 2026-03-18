import { getLanguageMeta } from "../constants/languages";
import type { Snippet } from "../types";
import { Button, ButtonLink } from "./Button";
import { CodeBlock } from "./CodeBlock";

interface SnippetCardProps {
  snippet: Snippet;
  canManage: boolean;
  viewsCount: number;
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: string) => Promise<void>;
  onFavorite: (id: string) => Promise<void>;
  onPreview: (snippet: Snippet) => void;
  onOpen: (id: string) => void;
}

function relativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function tagColor(name: string): string {
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 360;
  }

  return `hsla(${hash}, 72%, 62%, 0.14)`;
}

export function SnippetCard({
  snippet,
  canManage,
  viewsCount,
  onEdit,
  onDelete,
  onFavorite,
  onPreview,
  onOpen
}: SnippetCardProps) {
  const language = getLanguageMeta(snippet.language);

  const copyCode = async () => {
    await navigator.clipboard.writeText(snippet.code);
  };

  return (
    <article className="snippet-card">
      <header className="snippet-card-header">
        <div className="snippet-title-wrap">
          <h3>{snippet.title}</h3>
          <span className="language-chip" title={language.label}>
            <span className="language-chip-icon">{language.icon}</span>
            {language.label}
          </span>
        </div>

        <div className="inline-actions">
          <Button variant="ghost" size="sm" onClick={() => void onFavorite(snippet.id)}>
            {snippet.isFavorite ? "Favorited" : "Favorite"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onPreview(snippet)}>
            Preview
          </Button>
        </div>
      </header>

      <p className="muted">{snippet.description || "No description"}</p>
      <CodeBlock code={snippet.code} language={snippet.language} maxHeight={220} />

      <div className="pill-row">
        {snippet.category ? <span className="pill category-pill">{snippet.category.name}</span> : null}
        {snippet.tags.map((tag) => (
          <span className="pill" key={tag.id} style={{ background: tagColor(tag.name) }}>
            #{tag.name}
          </span>
        ))}
      </div>

      <div className="snippet-meta-row">
        <span className="muted small">Updated {relativeTime(snippet.updatedAt)}</span>
        <span className="muted small">Views {viewsCount}</span>
      </div>

      <footer className="inline-actions snippet-action-row">
        <Button variant="ghost" size="sm" onClick={() => void copyCode()}>
          Copy code
        </Button>
        <ButtonLink
          to={`/snippets/${snippet.id}`}
          variant="secondary"
          size="sm"
          onClick={() => onOpen(snippet.id)}
        >
          Open
        </ButtonLink>

        {canManage ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => onEdit(snippet)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => void onDelete(snippet.id)}>
              Delete
            </Button>
          </>
        ) : null}
      </footer>
    </article>
  );
}
