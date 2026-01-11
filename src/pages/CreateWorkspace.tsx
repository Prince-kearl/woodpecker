import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Sparkles,
  Palette
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModeSelector } from "@/components/workspace/ModeSelector";
import { SourceSelector } from "@/components/workspace/SourceSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type Mode = "study" | "exam" | "retrieval" | "institutional";

const steps = [
  { id: 1, title: "Basics", description: "Name and describe your workspace" },
  { id: 2, title: "Mode", description: "Choose how the assistant behaves" },
  { id: 3, title: "Sources", description: "Select knowledge sources" },
  { id: 4, title: "Review", description: "Confirm and create" },
];

const colorOptions = [
  "#00d4aa", "#3b82f6", "#a855f7", "#ec4899", 
  "#f59e0b", "#10b981", "#6366f1", "#ef4444"
];

const mockSources = [
  { id: "1", name: "Attention Is All You Need.pdf", type: "pdf" as const, chunks: 48 },
  { id: "2", name: "Deep Learning Foundations.epub", type: "epub" as const, chunks: 1247 },
  { id: "3", name: "Neural Network Architectures.pdf", type: "pdf" as const, chunks: 156 },
  { id: "4", name: "https://pytorch.org/docs", type: "web" as const, chunks: 89 },
  { id: "5", name: "ML Course Notes.docx", type: "docx" as const, chunks: 234 },
  { id: "6", name: "Statistics Handbook.pdf", type: "pdf" as const, chunks: 312 },
  { id: "7", name: "Python Data Science.epub", type: "epub" as const, chunks: 567 },
];

const modeDescriptions = {
  study: "Provides explanations, summaries, and helps understand complex topics. Best for learning and comprehension.",
  exam: "Generates practice questions, flashcards, and quizzes. Optimized for test preparation and knowledge retention.",
  retrieval: "Returns precise, factual answers with citations. Ideal for research and fact-finding.",
  institutional: "Navigates policies, procedures, and organizational documentation. Perfect for compliance and SOPs.",
};

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(colorOptions[0]);
  const [mode, setMode] = useState<Mode>("study");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

  const toggleSource = (sourceId: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return name.trim().length >= 3;
      case 2:
        return true;
      case 3:
        return selectedSourceIds.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleCreate = () => {
    toast({
      title: "Workspace Created! 🎉",
      description: `"${name}" has been created with ${selectedSourceIds.length} sources.`,
    });
    navigate("/workspaces");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Workspace Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., ML Research Papers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 bg-secondary border-border text-lg"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/50 characters
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                placeholder="Describe what this workspace is for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={200}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/200 characters
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color Theme
              </label>
              <div className="flex items-center gap-3">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="relative w-10 h-10 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && (
                      <motion.div
                        layoutId="color-check"
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Check className="w-5 h-5 text-white drop-shadow-md" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Select Assistant Mode
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose how your AI assistant should behave when answering questions.
              </p>
              <ModeSelector selected={mode} onChange={setMode} />
            </div>

            <div className="glass rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground capitalize">{mode} Mode</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {modeDescriptions[mode]}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Select Knowledge Sources
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose which documents and data sources this workspace can access.
              </p>
              <SourceSelector
                sources={mockSources}
                selectedIds={selectedSourceIds}
                onToggle={toggleSource}
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-medium text-foreground mb-6">
                Review Your Workspace
              </h3>

              <div className="space-y-4">
                {/* Preview Card */}
                <div className="glass rounded-xl overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: color }} />
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Sparkles className="w-6 h-6" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-foreground">{name || "Untitled Workspace"}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mode</p>
                    <p className="text-foreground font-medium capitalize">{mode}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sources</p>
                    <p className="text-foreground font-medium">{selectedSourceIds.length} selected</p>
                  </div>
                </div>

                {/* Selected Sources List */}
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Knowledge Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSourceIds.map(id => {
                      const source = mockSources.find(s => s.id === id);
                      return source ? (
                        <span 
                          key={id}
                          className="px-3 py-1.5 bg-secondary rounded-lg text-sm text-secondary-foreground"
                        >
                          {source.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to="/workspaces" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="w-4 h-4" />
            Back to Workspaces
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create Workspace</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new knowledge assistant for your documents
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                      currentStep > step.id 
                        ? "gradient-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "border-2 border-primary text-primary"
                        : "border-2 border-border text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center hidden sm:block">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`w-full h-0.5 mx-4 ${
                      currentStep > step.id ? "bg-primary" : "bg-border"
                    }`}
                    style={{ minWidth: "60px" }}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-8 mb-8"
        >
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between"
        >
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              variant="glow"
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
            >
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="glow"
              onClick={handleCreate}
              disabled={!canProceed()}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Workspace
            </Button>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
