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
    <div className="flex h-screen bg-background flex-col md:flex-row">
      <Sidebar workspaces={sidebarWorkspaces} className="w-full md:w-1/4" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
