import { motion } from "framer-motion";
import { Plus, FolderOpen, FileText, MessageSquare, Zap } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const stats = [
  { title: "Workspaces", value: 5, icon: FolderOpen, change: "+2 this week", trend: "up" as const },
  { title: "Knowledge Sources", value: 23, icon: FileText, change: "3 processing", trend: "neutral" as const },
  { title: "Total Queries", value: "1.2k", icon: MessageSquare, change: "+18% vs last month", trend: "up" as const },
  { title: "Avg Response Time", value: "1.2s", icon: Zap, change: "-0.3s improvement", trend: "up" as const },
];

const workspaces = [
  {
    id: "1",
    name: "ML Research Papers",
    description: "Collection of machine learning papers including transformers, neural networks, and deep learning fundamentals.",
    sourceCount: 12,
    queryCount: 156,
    mode: "study" as const,
    color: "#00d4aa",
  },
  {
    id: "2",
    name: "Company Policies",
    description: "HR policies, compliance documents, and employee handbooks for quick reference.",
    sourceCount: 8,
    queryCount: 89,
    mode: "institutional" as const,
    color: "#ec4899",
  },
  {
    id: "3",
    name: "CS201 Exam Prep",
    description: "Data structures and algorithms course materials for final exam preparation.",
    sourceCount: 6,
    queryCount: 234,
    mode: "exam" as const,
    color: "#a855f7",
  },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={stat.title} {...stat} delay={index * 0.1} />
          ))}
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
            <div className="grid gap-4">
              {workspaces.map((workspace, index) => (
                <WorkspaceCard key={workspace.id} {...workspace} delay={0.2 + index * 0.1} />
              ))}
            </div>
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
