import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: workspaces = [] } = useWorkspaces();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const sidebarWorkspaces = workspaces.slice(0, 5).map(w => ({
    id: w.id,
    name: w.name,
    color: w.color,
  }));

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar workspaces={sidebarWorkspaces} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-bold text-foreground">Woodpecker</span>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar workspaces={sidebarWorkspaces} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
