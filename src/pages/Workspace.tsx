import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, ChevronLeft, Sliders, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ModeSelector } from "@/components/workspace/ModeSelector";
import { SourceSelector } from "@/components/workspace/SourceSelector";
import { Button } from "@/components/ui/button";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Mode = Database["public"]["Enums"]["workspace_mode"];
type SourceType = Database["public"]["Enums"]["source_type"];

interface WorkspaceData {
  id: string;
  name: string;
  mode: Mode;
  color: string;
}

interface Source {
  id: string;
  name: string;
  type: SourceType;
  chunks: number;
}

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingSource, setUpdatingSource] = useState<string | null>(null);

  // Fetch workspace and sources
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch workspace
        const { data: workspaceData, error: workspaceError } = await supabase
          .from("workspaces")
          .select("id, name, mode, color")
          .eq("id", id)
          .single();

        if (workspaceError) {
          console.error("Error fetching workspace:", workspaceError);
          toast.error("Workspace not found");
          navigate("/workspaces");
          return;
        }

        setWorkspace(workspaceData);

        // Fetch all user's knowledge sources
        const { data: allSources, error: sourcesError } = await supabase
          .from("knowledge_sources")
          .select("id, name, source_type, chunk_count")
          .eq("status", "ready")
          .order("name");

        if (sourcesError) {
          console.error("Error fetching sources:", sourcesError);
        } else {
          setSources(
            allSources?.map((s) => ({
              id: s.id,
              name: s.name,
              type: s.source_type,
              chunks: s.chunk_count,
            })) || []
          );
        }

        // Fetch linked sources for this workspace
        const { data: linkedSources, error: linkedError } = await supabase
          .from("workspace_sources")
          .select("source_id")
          .eq("workspace_id", id)
          .eq("is_enabled", true);

        if (linkedError) {
          console.error("Error fetching linked sources:", linkedError);
        } else {
          setSelectedSourceIds(linkedSources?.map((ls) => ls.source_id) || []);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load workspace");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const toggleSource = async (sourceId: string) => {
    if (!id || updatingSource) return;
    
    setUpdatingSource(sourceId);
    const isCurrentlySelected = selectedSourceIds.includes(sourceId);

    try {
      if (isCurrentlySelected) {
        // Remove the link
        const { error } = await supabase
          .from("workspace_sources")
          .delete()
          .eq("workspace_id", id)
          .eq("source_id", sourceId);

        if (error) throw error;

        setSelectedSourceIds((prev) => prev.filter((sid) => sid !== sourceId));
        toast.success("Source removed from workspace");
      } else {
        // Add the link
        const { error } = await supabase
          .from("workspace_sources")
          .insert({ workspace_id: id, source_id: sourceId });

        if (error) throw error;

        setSelectedSourceIds((prev) => [...prev, sourceId]);
        toast.success("Source added to workspace");
      }
    } catch (error) {
      console.error("Error toggling source:", error);
      toast.error("Failed to update source");
    } finally {
      setUpdatingSource(null);
    }
  };

  const handleModeChange = async (newMode: Mode) => {
    if (!id || !workspace) return;

    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ mode: newMode })
        .eq("id", id);

      if (error) throw error;

      setWorkspace({ ...workspace, mode: newMode });
      toast.success("Mode updated");
    } catch (error) {
      console.error("Error updating mode:", error);
      toast.error("Failed to update mode");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!workspace) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Workspace not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Workspace Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 border-b border-border bg-card"
          >
            <div className="flex items-center gap-4">
              <Link to="/workspaces">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: workspace.color }}
                />
                <h1 className="text-lg font-semibold text-foreground">
                  {workspace.name}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showSettings ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Sliders className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface 
              workspaceName={workspace.name} 
              mode={workspace.mode}
              workspaceId={workspace.id}
            />
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border bg-card overflow-hidden"
          >
            <div className="p-6 space-y-6 h-full overflow-auto">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Workspace Settings
                </h3>

                {/* Mode Selection */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Assistant Mode
                  </label>
                  <ModeSelector selected={workspace.mode} onChange={handleModeChange} />
                </div>

                {/* Retrieval Settings */}
                <div className="glass rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Retrieval Settings
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        Top K Results: 5
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        defaultValue="5"
                        className="w-full accent-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-2">
                        Similarity Threshold: 0.7
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="70"
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Source Selection */}
                <SourceSelector
                  sources={sources}
                  selectedIds={selectedSourceIds}
                  onToggle={toggleSource}
                />
                
                {sources.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No processed sources available. Upload documents in the Knowledge section.
                  </p>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </div>
    </AppLayout>
  );
}
