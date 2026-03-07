"use client";

import { useState, useEffect, useRef } from "react";

const SECTIONS = [
  { id: "executive-summary", label: "Executive Summary" },
  { id: "template-inventory", label: "Templates" },
  { id: "component-inventory", label: "Components" },
  { id: "site-architecture", label: "Site Architecture" },
  { id: "content-audit", label: "Content Audit" },
] as const;

interface ReportLayoutProps {
  clientName: string;
  websiteUrl: string;
  date: string;
  children: React.ReactNode;
  showBranding?: boolean;
}

export function ReportLayout({
  clientName,
  websiteUrl,
  date,
  children,
  showBranding = true,
}: ReportLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            {showBranding && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Pagepro Migration Audit
              </p>
            )}
            <h1 className="text-xl font-bold">{clientName}</h1>
            <p className="text-sm text-muted-foreground">{websiteUrl}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{date}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sticky sidebar nav */}
        <nav className="hidden lg:block w-56 shrink-0 sticky top-[73px] h-[calc(100vh-73px)] py-8 px-4 border-r">
          <ul className="space-y-1">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(section.id)
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0 py-8 px-6 lg:px-12 space-y-16">
          {children}
        </main>
      </div>
    </div>
  );
}
