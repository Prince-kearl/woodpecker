import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search as SearchIcon, 
  Link2, 
  Lightbulb, 
  Mic, 
  MicOff,
  Send,
  Scale,
  BarChart3,
  BookOpen,
  FileText,
  Clock,
  X,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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

const quickModes = [
  { id: "compare", icon: Scale, label: "Compare" },
  { id: "analyze", icon: BarChart3, label: "Analyze" },
  { id: "academic", icon: BookOpen, label: "Academic" },
  { id: "policies", icon: FileText, label: "Policies" },
  { id: "latest", icon: Clock, label: "Latest Updates" },
];

export default function Search() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showSettings, setShowSettings] = useState(true);
  const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>("hybrid");
  const [topK, setTopK] = useState(5);
  const [sourceScopes, setSourceScopes] = useState<SourceScope[]>([]);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useChat({
    workspaceId: selectedWorkspace,
    mode: "retrieval",
  });

  // Voice input hook
  const [pendingVoiceSubmit, setPendingVoiceSubmit] = useState(false);
  const { isListening, isSupported, transcript: liveTranscript, toggleListening } = useVoiceInput({
    onResult: (finalTranscript) => {
      setQuery((prev) => prev + (prev ? " " : "") + finalTranscript);
      setPendingVoiceSubmit(true);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Reference to track if we should auto-submit (used by effect below handleSubmit)
  const pendingVoiceSubmitRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    pendingVoiceSubmitRef.current = pendingVoiceSubmit;
  }, [pendingVoiceSubmit]);

  // Get the latest assistant message
  const latestResponse = messages.filter(m => m.role === "assistant").pop();

  // Fetch workspaces
  useEffect(() => {
    async function fetchWorkspaces() {
      if (!user) return;
      
      const { data } = await supabase
        .from("workspaces")
        .select("id, name, mode, color")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data && data.length > 0) {
        setWorkspaces(data);
        setSelectedWorkspace(data[0].id);
      }
    }
    fetchWorkspaces();
  }, [user]);

  // Fetch source scopes when workspace changes
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
  }, [selectedWorkspace]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;
    
    await sendMessage(query);
    setQuery("");
  };

  // Auto-submit after voice input ends with a short delay
  useEffect(() => {
    if (!isListening && pendingVoiceSubmit && query.trim()) {
      const timer = setTimeout(() => {
        handleSubmit();
        setPendingVoiceSubmit(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isListening, pendingVoiceSubmit, query]);

  const handleQuickMode = (mode: string) => {
    const modePrompts: Record<string, string> = {
      compare: "Compare and contrast ",
      analyze: "Analyze the following: ",
      academic: "From an academic perspective, ",
      policies: "What are the policies regarding ",
      latest: "What are the latest updates on ",
    };
    setQuery(modePrompts[mode] || "");
    textareaRef.current?.focus();
  };

  const toggleSourceScope = (id: string) => {
    setSourceScopes(prev =>
      prev.map(scope =>
        scope.id === id ? { ...scope, selected: !scope.selected } : scope
      )
    );
  };

  const selectedWorkspaceData = workspaces.find(w => w.id === selectedWorkspace);

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col items-center px-4 py-8 min-h-screen">
        <div className="w-full max-w-3xl flex flex-col items-center">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 w-full"
          >
            <h1 className="text-4xl md:text-5xl font-medium mb-3 gradient-text">
              Institutional RAG
            </h1>
            <p className="text-muted-foreground text-lg">
              Evidence-based answers from official sources
            </p>
          </motion.section>

          {/* Workspace Selector */}
          {workspaces.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6 w-full max-w-md"
            >
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Select a workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: workspace.color || "#00d4aa" }}
                        />
                        {workspace.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Prompt Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full mb-8"
          >
            <form onSubmit={handleSubmit}>
              <div className="relative bg-card border border-border rounded-3xl p-3 shadow-lg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="flex items-start gap-2">
                  {/* Left Actions */}
                  <div className="flex items-center gap-1 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      title="Search institutional sources"
                    >
                      <SearchIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      title="Restrict to cited sources"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      title="Suggest queries"
                    >
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Input */}
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Ask anything about the institution…"
                    className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground resize-none min-h-[28px] max-h-[120px] py-2 px-2 focus:outline-none"
                    rows={1}
                  />

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 transition-colors",
                        isListening 
                          ? "text-destructive hover:text-destructive/80 bg-destructive/10" 
                          : "text-muted-foreground hover:text-foreground",
                        !isSupported && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={toggleListening}
                      disabled={!isSupported}
                      title={
                        !isSupported 
                          ? "Voice input not supported in this browser" 
                          : isListening 
                            ? "Stop listening" 
                            : "Start voice input"
                      }
                    >
                      {isListening ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <MicOff className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="submit"
                      size="icon"
                      className="h-9 w-9 gradient-primary text-primary-foreground rounded-full"
                      disabled={!query.trim() || isLoading}
                      title="Send"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Live Listening Indicator - Shows as soon as listening starts */}
                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 pt-2 border-t border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        {/* Animated waveform */}
                        <motion.div
                          className="flex items-center gap-0.5"
                        >
                          {[0, 1, 2, 3, 4].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1 rounded-full bg-destructive"
                              animate={{ 
                                height: ["8px", "16px", "8px"],
                              }}
                              transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                delay: i * 0.1,
                                ease: "easeInOut",
                              }}
                            />
                          ))}
                        </motion.div>
                        
                        {/* Status text or live transcript */}
                        <span className="text-sm text-muted-foreground italic flex-1">
                          {liveTranscript || "Listening... speak now"}
                        </span>
                        
                        {/* Stop button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={toggleListening}
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Stop
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.div>

          {/* Quick Modes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {quickModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleQuickMode(mode.id)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border rounded-full text-muted-foreground text-sm hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
              >
                <mode.icon className="h-4 w-4" />
                <span>{mode.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Loading Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mb-6"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [0, 1, 0] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        delay: i * 0.16,
                      }}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground text-sm">Searching knowledge base...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Response Area */}
          <AnimatePresence>
            {latestResponse && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full mb-8"
              >
                {/* Response Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                  <h3 className="text-lg font-medium text-foreground">Response</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Answer confidence</span>
                    <div className="w-20 h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full w-[85%] gradient-primary rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Response Content */}
                <div className="prose prose-invert max-w-none text-foreground leading-relaxed mb-6">
                  {latestResponse.content}
                </div>

                {/* Sources Panel */}
                {latestResponse.sources && latestResponse.sources.length > 0 && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setSourcesExpanded(!sourcesExpanded)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <h3 className="font-medium text-foreground">
                        Sources ({latestResponse.sources.length})
                      </h3>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform",
                          sourcesExpanded && "rotate-180"
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {sourcesExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 py-4 space-y-3">
                            {latestResponse.sources.map((source, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "py-3 border-b border-border last:border-0",
                                  idx === 0 && "relative pl-3 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary before:rounded"
                                )}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-foreground">
                                    {source.title}
                                  </span>
                                  {source.page && (
                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                      Page {source.page}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {source.excerpt}
                                </p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Retrieval Settings */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-medium text-foreground">Retrieval Settings</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSettings(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Retrieval Mode */}
                <div className="mb-5">
                  <label className="block text-sm text-muted-foreground mb-2">
                    Retrieval Mode
                  </label>
                  <div className="flex bg-secondary rounded-lg border border-border overflow-hidden">
                    {(["indexed", "live", "hybrid"] as RetrievalMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setRetrievalMode(mode)}
                        className={cn(
                          "flex-1 py-2.5 text-sm transition-all capitalize",
                          retrievalMode === mode
                            ? "gradient-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-secondary/80"
                        )}
                      >
                        {mode === "live" ? "Live Web" : mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source Scope */}
                {sourceScopes.length > 0 && (
                  <div className="mb-5">
                    <label className="block text-sm text-muted-foreground mb-2">
                      Source Scope
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sourceScopes.map((scope) => (
                        <button
                          key={scope.id}
                          onClick={() => toggleSourceScope(scope.id)}
                          className={cn(
                            "px-3 py-2 text-sm rounded-lg border transition-all",
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
                  <label className="block text-sm text-muted-foreground mb-2">
                    Top-K Evidence
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-primary font-medium w-6">{topK}</span>
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 text-center text-sm text-muted-foreground w-full pt-5 border-t border-border"
          >
            <p>Answers generated using Retrieval-Augmented Generation from public institutional data</p>
            <div className="flex justify-center gap-5 mt-3">
              <a href="#" className="text-primary hover:underline">Methodology</a>
              <a href="#" className="text-primary hover:underline">Data Sources</a>
              <a href="#" className="text-primary hover:underline">Privacy</a>
            </div>
          </motion.footer>
        </div>
      </div>
    </AppLayout>
  );
}
