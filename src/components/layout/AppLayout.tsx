import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useWorkspaces } from "@/hooks/useWorkspaces";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: workspaces = [] } = useWorkspaces();

  const sidebarWorkspaces = workspaces.slice(0, 5).map(w => ({
    id: w.id,
    name: w.name,
    color: w.color,
  }));

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-background">
      {/* Sidebar (with built-in hamburger for mobile) */}
      <Sidebar workspaces={sidebarWorkspaces} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full md:w-auto">
        {children}
      </main>
    </div>
  );
}
