import { motion } from "framer-motion";
import { Plus, FolderOpen, FileText, MessageSquare, Zap, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function Dashboard() {
  const { data: workspaces = [], isLoading: workspacesLoading } = useWorkspaces();
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();

  const stats = [
    { 
      title: "Workspaces", 
      value: statsData?.workspaceCount ?? 0, 
      icon: FolderOpen, 
      change: "", 
      trend: "neutral" as const 
    },
    { 
      title: "Knowledge Sources", 
      value: statsData?.sourceCount ?? 0, 
      icon: FileText, 
      change: statsData?.processingCount ? `${statsData.processingCount} processing` : "", 
      trend: "neutral" as const 
    },
    { 
      title: "Total Queries", 
      value: statsData?.queryCount ?? 0, 
      icon: MessageSquare, 
      change: "", 
      trend: "neutral" as const 
    },
    { 
      title: "Avg Response Time", 
      value: "~1s", 
      icon: Zap, 
      change: "", 
      trend: "up" as const 
    },
  ];

  const recentWorkspaces = workspaces.slice(0, 3);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your knowledge platform.
            </p>
          </div>
          <Link to="/workspaces/new">
            <Button variant="glow" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New Workspace
            </Button>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {statsLoading ? (
            <div className="col-span-2 lg:col-span-4 flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            stats.map((stat, index) => (
              <StatsCard key={stat.title} {...stat} delay={index * 0.1} />
            ))
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workspaces */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Recent Workspaces</h2>
              <Link to="/workspaces">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            {workspacesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentWorkspaces.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-muted-foreground mb-4">No workspaces yet</p>
                <Link to="/workspaces/new">
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create your first workspace
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {recentWorkspaces.map((workspace, index) => (
                  <WorkspaceCard 
                    key={workspace.id} 
                    id={workspace.id}
                    name={workspace.name}
                    description={workspace.description}
                    mode={workspace.mode}
                    color={workspace.color}
                    delay={0.2 + index * 0.1} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
