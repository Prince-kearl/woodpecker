import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sliders,
  X,
  Loader2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ConversationList } from "@/components/chat/ConversationList";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RetrievalMode = "indexed" | "live" | "hybrid";

interface Workspace {
  id: string;
  name: string;
  mode: string;
  color: string | null;
}

interface SourceScope {
  id: string;
  name: string;
  selected: boolean;
}

export default function Search() {
  const { user } = useAuth();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>("hybrid");
  const [topK, setTopK] = useState(5);
  const [sourceScopes, setSourceScopes] = useState<SourceScope[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    renameConversation,
    deleteConversation,
    loading: conversationsLoading,
  } = useConversations(selectedWorkspace || undefined);

  // Fetch workspaces with real-time subscription
  useEffect(() => {
    async function fetchWorkspaces() {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from("workspaces")
        .select("id, name, mode, color")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setWorkspaces(data);
        if (!selectedWorkspace) {
          setSelectedWorkspace(data[0].id);
        }
      }
      setLoading(false);
    }
    
    fetchWorkspaces();

    // Real-time subscription for workspaces
    if (!user) return;
    
    const channel = supabase
      .channel("workspaces-search")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspaces",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchWorkspaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedWorkspace]);

  // Fetch source scopes when workspace changes with real-time subscription
  useEffect(() => {
    async function fetchSourceScopes() {
      if (!selectedWorkspace) return;
      const { data } = await supabase
        .from("workspace_sources")
        .select(`
          source_id,
          is_enabled,
          knowledge_sources!inner(id, name, source_type)
        `)
        .eq("workspace_id", selectedWorkspace);

      if (data) {
        const scopes = data.map((item: any) => ({
          id: item.knowledge_sources.id,
          name: item.knowledge_sources.name,
          selected: item.is_enabled,
        }));
        setSourceScopes(scopes);
      }
    }

    fetchSourceScopes();

    // Real-time subscription for workspace sources
    if (!selectedWorkspace) return;

    const channel = supabase
      .channel(`workspace-sources-${selectedWorkspace}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_sources",
          filter: `workspace_id=eq.${selectedWorkspace}`,
        },
        () => {
          fetchSourceScopes();
        }
      )
      .subscribe();

    const knowledgeChannel = supabase
      .channel(`knowledge-sources-${selectedWorkspace}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "knowledge_sources",
        },
        () => {
          fetchSourceScopes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(knowledgeChannel);
    };
  }, [selectedWorkspace]);

  // Reset conversation when workspace changes
  useEffect(() => {
    setActiveConversationId(null);
  }, [selectedWorkspace]);

  const toggleSourceScope = (id: string) => {
    setSourceScopes((prev) =>
      prev.map((scope) =>
        scope.id === id ? { ...scope, selected: !scope.selected } : scope
      )
    );
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
  };

  const handleFirstMessage = (newConvId: string) => {
    setActiveConversationId(newConvId);
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

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row h-full w-full">
        {/* Conversation History Panel - Hidden on mobile, sidebar on tablet+ */}
        {showHistory && (
          <>
            {/* Mobile Overlay */}
            <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setShowHistory(false)} />
            
            {/* History Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed lg:static top-0 left-0 h-screen lg:h-auto z-40 w-64 lg:w-80 lg:w-auto lg:flex-shrink-0 lg:flex-grow-0 border-r border-border bg-card overflow-hidden"
              style={{ maxWidth: "min(100%, 280px)", lg: { maxWidth: "280px" } }}
            >
              <ConversationList
                conversations={conversations}
                activeId={activeConversationId}
                loading={conversationsLoading}
                onSelect={(id) => {
                  setActiveConversationId(id);
                  setShowHistory(false); // Auto-close on mobile selection
                }}
                onCreate={handleNewChat}
                onRename={renameConversation}
                onDelete={deleteConversation}
              />
            </motion.aside>
          </>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 sm:p-4 border-b border-border bg-card"
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(!showHistory)}
                className="lg:hidden"
              >
                {showHistory ? (
                  <PanelLeftClose className="w-5 h-5" />
                ) : (
                  <PanelLeft className="w-5 h-5" />
                )}
              </Button>
              <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
                Institutional RAG
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
              {/* Workspace Selector */}
              {workspaces.length > 0 && (
                <Select
                  value={selectedWorkspace}
                  onValueChange={setSelectedWorkspace}
                >
                  <SelectTrigger className="bg-card border-border w-32 sm:w-44 flex-shrink-0">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: workspace.color || "#00d4aa",
                            }}
                          />
                          <span className="truncate">{workspace.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant={showSettings ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="flex-shrink-0"
              >
                <Sliders className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              workspaceName="Institutional RAG"
              mode="retrieval"
              workspaceId={selectedWorkspace || undefined}
              conversationId={activeConversationId}
              onFirstMessage={handleFirstMessage}
            />
          </div>
        </div>

        {/* Settings Panel - Hidden on mobile, sidebar on tablet+ */}
        {showSettings && (
          <>
            {/* Mobile Overlay */}
            <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setShowSettings(false)} />
            
            {/* Settings Sidebar */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3 }}
              className="fixed lg:static top-0 right-0 h-screen lg:h-full z-40 w-64 sm:w-80 lg:w-[380px] lg:flex-shrink-0 border-l border-border bg-card overflow-hidden"
            >
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    Settings
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 lg:hidden"
                    onClick={() => setShowSettings(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Retrieval Mode */}
                <div>
                  <label className="block text-xs sm:text-sm text-muted-foreground mb-2">
                    Retrieval Mode
                  </label>
                  <div className="flex bg-secondary rounded-lg border border-border overflow-hidden">
                    {(["indexed", "live", "hybrid"] as RetrievalMode[]).map(
                      (mode) => (
                        <button
                          key={mode}
                          onClick={() => setRetrievalMode(mode)}
                          className={cn(
                            "flex-1 py-2 sm:py-2.5 text-xs sm:text-sm transition-all capitalize",
                            retrievalMode === mode
                              ? "gradient-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-secondary/80"
                          )}
                        >
                          {mode === "live" ? "Live" : mode}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Source Scope */}
                {sourceScopes.length > 0 && (
                  <div>
                    <label className="block text-xs sm:text-sm text-muted-foreground mb-2">
                      Source Scope
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sourceScopes.map((scope) => (
                        <button
                          key={scope.id}
                          onClick={() => toggleSourceScope(scope.id)}
                          className={cn(
                            "px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg border transition-all",
                            scope.selected
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-secondary border-border text-muted-foreground hover:bg-primary/10 hover:border-primary hover:text-primary"
                          )}
                        >
                          {scope.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top-K Evidence */}
                <div>
                  <label className="block text-xs sm:text-sm text-muted-foreground mb-2">
                    Top-K Evidence
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-primary font-medium w-6 text-sm">{topK}</span>
                    <Slider
                      value={[topK]}
                      onValueChange={([value]) => setTopK(value)}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </div>
    </AppLayout>
  );
}
