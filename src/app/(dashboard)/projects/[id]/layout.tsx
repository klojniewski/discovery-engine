import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/crawl", label: "Crawl" },
  { href: "/analysis", label: "Analysis" },
  { href: "/report", label: "Report" },
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={`/projects/${id}${tab.href}`}
              className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-foreground transition-colors -mb-px"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  );
}
