"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderPlus, Settings } from "lucide-react";

const navItems = [
  { href: "/projects", label: "Projects", icon: LayoutDashboard },
  { href: "/projects/new", label: "New Project", icon: FolderPlus },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={`flex-1 ${collapsed ? "flex flex-col items-center gap-1" : "space-y-1"}`}>
      {navItems.map((item) => {
        const isActive = item.href === "/projects"
          ? pathname === "/projects" || (pathname.startsWith("/projects/") && !pathname.startsWith("/projects/new"))
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`flex items-center rounded-md transition-colors ${
              collapsed
                ? `p-2 justify-center ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`
                : `gap-3 px-3 py-2 text-sm ${isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`
            }`}
          >
            <item.icon className="h-4 w-4" />
            {!collapsed && item.label}
          </Link>
        );
      })}
    </nav>
  );
}
