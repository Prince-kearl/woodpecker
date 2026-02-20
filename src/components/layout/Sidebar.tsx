import { motion } from "framer-motion";
import { 
  Brain, 
  FolderOpen, 
  MessageSquare, 
  Settings, 
  Plus,
  Home,
  BookOpen,
  LogOut,
  ChevronRight
} from "lucide-react";
import { Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Zap, label: "Search", path: "/" },
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: FolderOpen, label: "Workspaces", path: "/workspaces" },
  { icon: BookOpen, label: "Knowledge", path: "/knowledge" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  workspaces?: Array<{ id: string; name: string; color: string }>;
  onNavigate?: () => void;
}

export function Sidebar({ workspaces = [], onNavigate }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";

  return (
    <nav id="sidebar-nav" className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <button onClick={() => handleNavigate("/")} className="flex items-center gap-3 group hover:opacity-80 transition-opacity text-left">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow">
            <img src="/favicon.ico" alt="App Logo" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Woodpecker</h1>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              whileHover={{ x: 4 }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left min-h-[44px]",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />}
            </motion.button>
          );
        })}

        {/* Workspaces Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workspaces
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => handleNavigate("/workspaces/new")}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <motion.button
                key={workspace.id}
                onClick={() => handleNavigate(`/workspace/${workspace.id}`)}
                whileHover={{ x: 4 }}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors text-left min-h-[44px]"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: workspace.color }}
                />
                <span className="text-sm truncate flex-1">{workspace.name}</span>
                <MessageSquare className="w-4 h-4 opacity-50 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-white">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.user_metadata?.display_name ||
                user?.email?.split("@")[0] ||
                "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground flex-shrink-0"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
