import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./Button";
import type { LanguageOption } from "../constants/languages";
import type { Category, Snippet, SnippetPayload, Tag } from "../types";

interface SnippetFormProps {
  categories: Category[];
  tags: Tag[];
  languages: LanguageOption[];
  initialSnippet?: Snippet | null;
  disabled?: boolean;
  loading?: boolean;
  submitSignal?: number;
  draftStorageKey?: string;
  cancelLabel?: string;
  cancelMode?: "clear" | "cancel";
  onDirtyChange?: (dirty: boolean) => void;
  onCancel: () => void;
  onSubmit: (payload: SnippetPayload, id?: string) => Promise<void>;
}

const defaultValues: SnippetPayload = {
  title: "",
  description: "",
  language: "typescript",
  code: "",
  categoryId: null,
  tags: [],
  isPublic: false
};

function normalizeTags(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function SnippetForm({
  categories,
  tags,
  languages,
  initialSnippet,
  disabled,
  loading,
  submitSignal,
  draftStorageKey,
  cancelLabel = "Clear",
  cancelMode = "clear",
  onDirtyChange,
  onCancel,
  onSubmit
}: SnippetFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [form, setForm] = useState<SnippetPayload>(defaultValues);
  const [tagInput, setTagInput] = useState("");

  const baselineSerialized = useMemo(() => {
    if (!initialSnippet) {
      return JSON.stringify({ ...defaultValues, tags: [] });
    }

    return JSON.stringify({
      title: initialSnippet.title,
      description: initialSnippet.description ?? "",
      language: initialSnippet.language,
      code: initialSnippet.code,
      categoryId: initialSnippet.category?.id ?? null,
      tags: initialSnippet.tags.map((tag) => tag.name),
      isPublic: initialSnippet.isPublic
    });
  }, [initialSnippet]);

  useEffect(() => {
    if (initialSnippet) {
      setForm({
        title: initialSnippet.title,
        description: initialSnippet.description,
        language: initialSnippet.language,
        code: initialSnippet.code,
        categoryId: initialSnippet.category?.id ?? null,
        tags: initialSnippet.tags.map((tag) => tag.name),
        isPublic: initialSnippet.isPublic
      });
      setTagInput(initialSnippet.tags.map((tag) => tag.name).join(", "));
      return;
    }

    if (!draftStorageKey) {
      setForm(defaultValues);
      setTagInput("");
      return;
    }

    const rawDraft = localStorage.getItem(draftStorageKey);

    if (!rawDraft) {
      setForm(defaultValues);
      setTagInput("");
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft) as SnippetPayload;
      setForm({
        title: parsed.title ?? "",
        description: parsed.description ?? "",
        language: parsed.language ?? "typescript",
        code: parsed.code ?? "",
        categoryId: parsed.categoryId ?? null,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        isPublic: Boolean(parsed.isPublic)
      });
      setTagInput(Array.isArray(parsed.tags) ? parsed.tags.join(", ") : "");
    } catch {
      setForm(defaultValues);
      setTagInput("");
    }
  }, [draftStorageKey, initialSnippet]);

  useEffect(() => {
    if (!submitSignal) {
      return;
    }

    formRef.current?.requestSubmit();
  }, [submitSignal]);

  useEffect(() => {
    if (initialSnippet || !draftStorageKey) {
      return;
    }

    const payload = {
      ...form,
      description: form.description ?? "",
      tags: normalizeTags(tagInput)
    };

    localStorage.setItem(draftStorageKey, JSON.stringify(payload));
  }, [draftStorageKey, form, initialSnippet, tagInput]);

  useEffect(() => {
    const payload = {
      title: form.title,
      description: form.description ?? "",
      language: form.language,
      code: form.code,
      categoryId: form.categoryId ?? null,
      tags: normalizeTags(tagInput),
      isPublic: form.isPublic
    };

    onDirtyChange?.(JSON.stringify(payload) !== baselineSerialized);
  }, [baselineSerialized, form, onDirtyChange, tagInput]);

  const knownTags = useMemo(() => tags.map((tag) => tag.name), [tags]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      ...form,
      description: form.description?.trim() || null,
      tags: normalizeTags(tagInput)
    };

    await onSubmit(payload, initialSnippet?.id);

    if (initialSnippet || cancelMode === "cancel") {
      return;
    }

    setForm(defaultValues);
    setTagInput("");

    if (draftStorageKey) {
      localStorage.removeItem(draftStorageKey);
    }
  };

  const clearForm = () => {
    if (cancelMode === "cancel") {
      onCancel();
      return;
    }

    setForm(defaultValues);
    setTagInput("");

    if (!initialSnippet && draftStorageKey) {
      localStorage.removeItem(draftStorageKey);
    }

    onCancel();
  };

  return (
    <form ref={formRef} className="snippet-form" onSubmit={handleSubmit}>
      <header className="editor-title-row">
        <h2>{initialSnippet ? "Edit Snippet" : "Create Snippet"}</h2>
        <p className="muted small">Ctrl+Enter to save</p>
      </header>

      <div className="form-group">
        <label>
          <span className="label-title">Title</span>
          <input
            required
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            disabled={disabled}
          />
        </label>

        <label>
          <span className="label-title">Description</span>
          <textarea
            rows={3}
            value={form.description ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            disabled={disabled}
          />
        </label>
      </div>

      <div className="grid two-col form-group">
        <label>
          <span className="label-title">Language</span>
          <select
            required
            value={form.language}
            onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
            disabled={disabled}
          >
            {languages.map((language) => (
              <option key={language.value} value={language.value}>
                {language.icon}  {language.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-title">Category</span>
          <select
            value={form.categoryId ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value || null }))}
            disabled={disabled}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-group">
        <label>
          <span className="label-title">Tags</span>
          <input
            list="known-tags"
            placeholder={knownTags.length ? `Existing: ${knownTags.slice(0, 6).join(", ")}` : "api, react, hooks"}
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            disabled={disabled}
          />
          <datalist id="known-tags">
            {knownTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="form-group">
        <label>
          <span className="label-title">Code</span>
          <textarea
            required
            rows={18}
            className="code-input code-editor"
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            onKeyDown={(event) => {
              if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            disabled={disabled}
          />
        </label>
      </div>

      <footer className="editor-footer-row">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(event) => setForm((prev) => ({ ...prev, isPublic: event.target.checked }))}
            disabled={disabled}
          />
          Public snippet
        </label>

        <div className="inline-actions">
          <Button type="button" variant="ghost" onClick={clearForm}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant="primary" disabled={disabled || loading}>
            {loading ? "Saving..." : initialSnippet ? "Save Snippet" : "Create Snippet"}
          </Button>
        </div>
      </footer>
    </form>
  );
}
