import { notFound } from "next/navigation";
import { db } from "@/db";
import { pages, templates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PageDetail } from "@/components/pages/page-detail";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function PageDetailPage({
  params,
}: {
  params: Promise<{ id: string; pageId: string }>;
}) {
  const { id, pageId } = await params;

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.projectId, id)))
    .limit(1);

  if (!page) return notFound();

  const template = page.templateId
    ? (
        await db
          .select({ name: templates.displayName, fallback: templates.name })
          .from(templates)
          .where(eq(templates.id, page.templateId))
          .limit(1)
      )[0]
    : null;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href={`/projects/${id}/scrape`} className="hover:text-foreground">
          Scrape
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate max-w-xs">
          {page.title || new URL(page.url).pathname}
        </span>
      </nav>

      <PageDetail
        page={{
          id: page.id,
          projectId: page.projectId,
          url: page.url,
          title: page.title,
          wordCount: page.wordCount,
          screenshotUrl: page.screenshotUrl,
          contentTier: page.contentTier,
          templateName: template?.name ?? template?.fallback ?? null,
          detectedSections: page.detectedSections ?? null,
        }}
      />
    </div>
  );
}
