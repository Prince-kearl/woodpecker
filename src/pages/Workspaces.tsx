import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Grid, List } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const allWorkspaces = [
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
  {
    id: "4",
    name: "Legal Documents",
    description: "Contract templates, legal agreements, and regulatory compliance documentation.",
    sourceCount: 15,
    queryCount: 67,
    mode: "retrieval" as const,
    color: "#f59e0b",
  },
  {
    id: "5",
    name: "Product Documentation",
    description: "API references, user guides, and technical documentation for our products.",
    sourceCount: 22,
    queryCount: 312,
    mode: "retrieval" as const,
    color: "#3b82f6",
  },
];

export default function Workspaces() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredWorkspaces = allWorkspaces.filter(ws => 
    ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ws.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Workspaces</h1>
            <p className="text-muted-foreground mt-1">
              Manage your RAG knowledge assistants
            </p>
          </div>
          <Link to="/workspaces/new">
            <Button variant="glow" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Workspace
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 mb-6"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1 glass rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Workspace Grid */}
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "flex flex-col gap-4"
        }>
          {filteredWorkspaces.map((workspace, index) => (
            <WorkspaceCard key={workspace.id} {...workspace} delay={0.1 + index * 0.05} />
          ))}
        </div>

        {filteredWorkspaces.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No workspaces found matching your search.</p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
