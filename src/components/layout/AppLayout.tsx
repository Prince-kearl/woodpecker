import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { Menu, X } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: workspaces = [] } = useWorkspaces();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const sidebarWorkspaces = workspaces.slice(0, 5).map(w => ({
    id: w.id,
    name: w.name,
    color: w.color,
  }));

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Close sidebar on resize to desktop
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen flex-col lg:flex-row bg-background overflow-hidden">
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden flex items-center justify-between min-h-14 px-4 sm:px-6 border-b border-border bg-card z-40">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={isSidebarOpen}
          aria-controls="sidebar-nav"
          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-secondary transition-colors min-h-[44px] min-w-[44px]"
          title={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6 text-foreground" />
          ) : (
            <Menu className="w-6 h-6 text-foreground" />
          )}
        </button>
        <h1 className="text-lg font-bold text-foreground truncate">Woodpecker</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && isMobile && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 top-14"
          onClick={closeSidebar}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static
          top-14 lg:top-0
          left-0 
          h-[calc(100vh-56px)] lg:h-screen
          w-64
          z-40
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          flex-shrink-0
          overflow-y-auto
        `}
      >
        <Sidebar 
          workspaces={sidebarWorkspaces}
          onNavigate={closeSidebar}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full lg:w-auto flex flex-col">
        {children}
      </main>
    </div>
  );
}
