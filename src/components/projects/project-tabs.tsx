"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/crawl", label: "Crawl" },
  { href: "/analysis", label: "Analysis" },
  { href: "/pages", label: "Pages" },
  { href: "/seo", label: "SEO" },
  { href: "/report", label: "Report" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;

  return (
    <div className="border-b mb-6">
      <nav className="flex gap-6">
        {tabs.map((tab) => {
          const tabPath = `${basePath}${tab.href}`;
          const isActive = tab.href === ""
            ? pathname === basePath
            : pathname.startsWith(tabPath);

          return (
            <Link
              key={tab.label}
              href={tabPath}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "text-foreground border-foreground"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
