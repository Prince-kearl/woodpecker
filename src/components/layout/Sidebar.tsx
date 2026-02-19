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
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const navItems = [
  { icon: Zap, label: "Search", path: "/" },
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: FolderOpen, label: "Workspaces", path: "/workspaces" },
  { icon: BookOpen, label: "Knowledge", path: "/knowledge" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  workspaces?: Array<{ id: string; name: string; color: string }>;
}

export function Sidebar({ workspaces = [] }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        className="md:hidden p-4 text-foreground"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
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

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed md:static z-50 w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Woodpecker</h1>
              <p className="text-xs text-muted-foreground">Knowledge Engine</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={closeSidebar}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </motion.div>
              </Link>
            );
          })}

          {/* Workspaces Section */}
          <div className="pt-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Workspaces
              </span>
              <Link to="/workspaces/new" onClick={closeSidebar}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-1">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  to={`/workspace/${workspace.id}`}
                  onClick={closeSidebar}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: workspace.color }}
                    />
                    <span className="text-sm truncate">{workspace.name}</span>
                    <MessageSquare className="w-4 h-4 ml-auto opacity-50" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
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
              className="h-8 w-8 text-muted-foreground"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
