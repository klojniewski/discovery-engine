"use client";

import Link from "next/link";
import { useState } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      <aside
        className={`border-r bg-muted/30 flex flex-col transition-all duration-200 ${
          collapsed ? "w-16 p-2" : "w-64 p-4"
        }`}
      >
        <div className={`flex items-center ${collapsed ? "justify-center mb-4" : "justify-between mb-8"}`}>
          <Link href="/projects" className="flex items-center gap-2">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-semibold text-sm">Discovery Engine</h1>
                <p className="text-xs text-muted-foreground">by Pagepro</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed ? (
          <div className="flex flex-col items-center gap-1 flex-1">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mb-2"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <SidebarNav collapsed />
          </div>
        ) : (
          <>
            <SidebarNav />
            <div className="border-t pt-4 mt-4">
              <p className="text-xs text-muted-foreground">Pagepro Internal Tool</p>
            </div>
          </>
        )}
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
