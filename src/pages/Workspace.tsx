import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, ChevronLeft, Sliders } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ModeSelector } from "@/components/workspace/ModeSelector";
import { SourceSelector } from "@/components/workspace/SourceSelector";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";

type Mode = "study" | "exam" | "retrieval" | "institutional";

const mockSources = [
  { id: "1", name: "Attention Is All You Need.pdf", type: "pdf" as const, chunks: 48 },
  { id: "2", name: "Deep Learning Foundations.epub", type: "epub" as const, chunks: 1247 },
  { id: "3", name: "Neural Network Architectures.pdf", type: "pdf" as const, chunks: 156 },
  { id: "4", name: "https://pytorch.org/docs", type: "web" as const, chunks: 89 },
  { id: "5", name: "ML Course Notes.docx", type: "docx" as const, chunks: 234 },
];

const workspaceData: Record<string, { name: string; mode: Mode; color: string }> = {
  "1": { name: "ML Research Papers", mode: "study", color: "#00d4aa" },
  "2": { name: "Company Policies", mode: "institutional", color: "#ec4899" },
  "3": { name: "CS201 Exam Prep", mode: "exam", color: "#a855f7" },
};

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const workspace = workspaceData[id || "1"] || workspaceData["1"];
  
  const [mode, setMode] = useState<Mode>(workspace.mode);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(["1", "2", "3"]);
  const [showSettings, setShowSettings] = useState(false);

  const toggleSource = (sourceId: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

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
                <h1 className="text-lg font-semibold text-foreground">{workspace.name}</h1>
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
            <ChatInterface workspaceName={workspace.name} mode={mode} />
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
                <h3 className="text-lg font-semibold text-foreground mb-4">Workspace Settings</h3>
                
                {/* Mode Selection */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Assistant Mode
                  </label>
                  <ModeSelector selected={mode} onChange={setMode} />
                </div>

                {/* Retrieval Settings */}
                <div className="glass rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-3">Retrieval Settings</h4>
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
                  sources={mockSources}
                  selectedIds={selectedSourceIds}
                  onToggle={toggleSource}
                />
              </div>
            </div>
          </motion.aside>
        )}
      </div>
    </AppLayout>
  );
}
