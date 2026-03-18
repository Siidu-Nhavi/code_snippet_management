import hljs from "highlight.js/lib/common";
import { useMemo } from "react";

interface CodeBlockProps {
  code: string;
  language: string;
  maxHeight?: number;
}

export function CodeBlock({ code, language, maxHeight }: CodeBlockProps) {
  const highlighted = useMemo(() => {
    try {
      if (language) {
        return hljs.highlight(code, { language }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return hljs.highlightAuto(code).value;
    }
  }, [code, language]);

  return (
    <pre className="code-block" style={maxHeight ? { maxHeight } : undefined}>
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}
