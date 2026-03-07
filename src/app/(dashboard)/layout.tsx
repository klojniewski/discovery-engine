import Link from "next/link";
import { LayoutDashboard, FolderPlus, Settings } from "lucide-react";

const navItems = [
  { href: "/projects", label: "Projects", icon: LayoutDashboard },
  { href: "/projects/new", label: "New Project", icon: FolderPlus },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-muted/30 p-4 flex flex-col">
        <div className="mb-8">
          <Link href="/projects" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm">Discovery Engine</h1>
              <p className="text-xs text-muted-foreground">by Pagepro</p>
            </div>
          </Link>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-muted-foreground">Pagepro Internal Tool</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
