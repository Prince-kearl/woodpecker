import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Grid, List, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"] & {
  sourceCount?: number;
  queryCount?: number;
};

export default function Workspaces() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      // Fetch workspaces
      const { data: workspacesData, error: workspacesError } = await supabase
        .from("workspaces")
        .select("*")
        .order("updated_at", { ascending: false });

      if (workspacesError || !workspacesData) {
        setLoading(false);
        return;
      }

      // Fetch source counts and conversation counts in parallel
      const [sourceCountsResult, conversationCountsResult] = await Promise.all([
        supabase
          .from("workspace_sources")
          .select("workspace_id")
          .eq("is_enabled", true),
        supabase
          .from("conversations")
          .select("workspace_id")
      ]);

      // Count sources per workspace
      const sourceCountMap: Record<string, number> = {};
      sourceCountsResult.data?.forEach((item) => {
        sourceCountMap[item.workspace_id] = (sourceCountMap[item.workspace_id] || 0) + 1;
      });

      // Count conversations per workspace
      const queryCountMap: Record<string, number> = {};
      conversationCountsResult.data?.forEach((item) => {
        queryCountMap[item.workspace_id] = (queryCountMap[item.workspace_id] || 0) + 1;
      });

      // Merge counts into workspaces
      const workspacesWithCounts = workspacesData.map((ws) => ({
        ...ws,
        sourceCount: sourceCountMap[ws.id] || 0,
        queryCount: queryCountMap[ws.id] || 0,
      }));

      setWorkspaces(workspacesWithCounts);
      setLoading(false);
    };

    fetchWorkspaces();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("workspaces-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspaces",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setWorkspaces((prev) => [payload.new as Workspace, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setWorkspaces((prev) =>
              prev.map((ws) =>
                ws.id === (payload.new as Workspace).id
                  ? (payload.new as Workspace)
                  : ws
              )
            );
          } else if (payload.eventType === "DELETE") {
            setWorkspaces((prev) =>
              prev.filter((ws) => ws.id !== (payload.old as Workspace).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredWorkspaces = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ws.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "flex flex-col gap-4"
          }>
            {filteredWorkspaces.map((workspace, index) => (
              <WorkspaceCard 
                key={workspace.id} 
                id={workspace.id}
                name={workspace.name}
                description={workspace.description}
                mode={workspace.mode}
                color={workspace.color}
                sourceCount={workspace.sourceCount}
                queryCount={workspace.queryCount}
                delay={0.1 + index * 0.05} 
              />
            ))}
          </div>
        )}

        {!loading && filteredWorkspaces.length === 0 && (
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
