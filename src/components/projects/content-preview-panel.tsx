"use client";

import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ContentPreviewPage {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  rawMarkdown: string | null;
}

export function ContentPreviewPanel({
  page,
  onClose,
}: {
  page: ContentPreviewPage;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[520px] max-w-[90vw] bg-background border-l shadow-lg z-50 flex flex-col">
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
          <article className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:border-b prose-headings:border-border prose-headings:pb-1.5 prose-h1:text-lg prose-h1:font-bold prose-h1:border-b-2 prose-h2:text-base prose-h2:font-semibold prose-h3:text-sm prose-h3:font-semibold prose-h3:border-b-0 prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground prose-hr:border-border prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-img:rounded-md prose-img:border prose-img:border-border">
            <ReactMarkdown>
              {page.rawMarkdown || "No content available."}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </>
  );
}
