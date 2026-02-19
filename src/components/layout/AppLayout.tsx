import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { useWorkspaces } from "@/hooks/useWorkspaces";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: workspaces = [] } = useWorkspaces();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebarWorkspaces = workspaces.slice(0, 5).map(w => ({
    id: w.id,
    name: w.name,
    color: w.color,
  }));

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background">
      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-sidebar-border">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle menu"
          aria-expanded={isSidebarOpen}
          className="text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 5.25h16.5m-16.5 6.75h16.5m-16.5 6.75h16.5"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-foreground">Woodpecker</h1>
      </div>

      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar workspaces={sidebarWorkspaces} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
