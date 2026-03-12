"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ContentPreviewPage {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  rawMarkdown: string | null;
}

const MIN_WIDTH = 320;
const MAX_WIDTH_RATIO = 0.9;
const DEFAULT_WIDTH = 520;

export function ContentPreviewPanel({
  page,
  onClose,
}: {
  page: ContentPreviewPage;
  onClose: () => void;
}) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX;
      const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;
      const newWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    }

    function handleMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full bg-background border-l shadow-lg z-50 flex flex-col"
        style={{ width }}
      >
        {/* Resize handle */}
        <div
          className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/30 z-10"
          onMouseDown={handleMouseDown}
        />

        <div className="flex items-center justify-between p-4 border-b bg-muted/30 shrink-0">
          <div className="min-w-0 mr-3">
            <p className="text-sm font-medium truncate">
              {page.title || "Untitled"}
            </p>
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline truncate block"
            >
              {page.url}
            </a>
            <p className="text-xs text-muted-foreground mt-0.5">
              {page.wordCount} words
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <article className="md-preview">
            <ReactMarkdown>
              {page.rawMarkdown || "No content available."}
            </ReactMarkdown>
          </article>
        </div>
      </div>

      <style jsx global>{`
        .md-preview {
          font-size: 14px;
          line-height: 1.6;
          color: var(--color-muted-foreground);
        }
        .md-preview h1,
        .md-preview h2,
        .md-preview h3,
        .md-preview h4,
        .md-preview h5,
        .md-preview h6 {
          color: var(--color-foreground);
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          padding-bottom: 0.3em;
          border-bottom: 1px solid var(--color-border);
        }
        .md-preview h1 {
          font-size: 1.25rem;
          font-weight: 700;
          border-bottom-width: 2px;
        }
        .md-preview h2 {
          font-size: 1.1rem;
        }
        .md-preview h3 {
          font-size: 0.95rem;
          border-bottom: none;
        }
        .md-preview h4,
        .md-preview h5,
        .md-preview h6 {
          font-size: 0.875rem;
          border-bottom: none;
        }
        .md-preview p {
          margin: 0.75em 0;
        }
        .md-preview a {
          color: var(--color-primary);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .md-preview strong {
          color: var(--color-foreground);
          font-weight: 600;
        }
        .md-preview ul,
        .md-preview ol {
          margin: 0.75em 0;
          padding-left: 1.5em;
        }
        .md-preview li {
          margin: 0.25em 0;
        }
        .md-preview ul {
          list-style-type: disc;
        }
        .md-preview ol {
          list-style-type: decimal;
        }
        .md-preview blockquote {
          margin: 0.75em 0;
          padding-left: 1em;
          border-left: 3px solid var(--color-border);
          color: var(--color-muted-foreground);
          font-style: italic;
        }
        .md-preview code {
          font-size: 0.8em;
          background: var(--color-muted);
          padding: 0.15em 0.4em;
          border-radius: 4px;
        }
        .md-preview pre {
          margin: 0.75em 0;
          padding: 0.75em 1em;
          background: var(--color-muted);
          border-radius: 6px;
          overflow-x: auto;
        }
        .md-preview pre code {
          background: none;
          padding: 0;
        }
        .md-preview hr {
          margin: 1.5em 0;
          border: none;
          border-top: 1px solid var(--color-border);
        }
        .md-preview img {
          max-width: 100%;
          border-radius: 6px;
          border: 1px solid var(--color-border);
          margin: 0.75em 0;
        }
        .md-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75em 0;
          font-size: 0.85em;
        }
        .md-preview th,
        .md-preview td {
          border: 1px solid var(--color-border);
          padding: 0.4em 0.6em;
          text-align: left;
        }
        .md-preview th {
          background: var(--color-muted);
          font-weight: 600;
          color: var(--color-foreground);
        }
      `}</style>
    </>
  );
}
