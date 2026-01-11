import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Sparkles, BookOpen, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    title: string;
    excerpt: string;
    page?: number;
  }>;
}

interface ChatInterfaceProps {
  workspaceName: string;
  mode: "study" | "exam" | "retrieval" | "institutional";
}

const modeConfig = {
  study: { 
    color: "hsl(var(--mode-study))", 
    label: "Study Helper",
    placeholder: "Ask me to explain concepts, summarize topics, or help you understand...",
    icon: BookOpen,
  },
  exam: { 
    color: "hsl(var(--mode-exam))", 
    label: "Exam Prep",
    placeholder: "Ask for practice questions, flashcards, or test your knowledge...",
    icon: Sparkles,
  },
  retrieval: { 
    color: "hsl(var(--mode-retrieval))", 
    label: "Info Retrieval",
    placeholder: "Search for specific facts, data, or references...",
    icon: FileText,
  },
  institutional: { 
    color: "hsl(var(--mode-institutional))", 
    label: "Institutional",
    placeholder: "Look up policies, procedures, or organizational guidelines...",
    icon: FileText,
  },
};

const sampleMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "What are the key differences between transformers and RNNs for sequence modeling?",
  },
  {
    id: "2",
    role: "assistant",
    content: `Based on your knowledge sources, here are the key differences between Transformers and RNNs:

**1. Attention Mechanism**
Transformers use self-attention to process all positions simultaneously, while RNNs process sequences step-by-step. This allows transformers to capture long-range dependencies more effectively.

**2. Parallelization**
Transformers can be fully parallelized during training since all positions are computed at once. RNNs must process tokens sequentially, making them slower to train.

**3. Memory & Context**
RNNs have a fixed hidden state that acts as memory, which can lead to vanishing gradients over long sequences. Transformers attend to all positions directly, though they're limited by context window size.

**4. Computational Complexity**
Self-attention has O(n²) complexity with sequence length, while RNNs are O(n). However, the parallelization benefits often outweigh this for modern hardware.`,
    sources: [
      { title: "Attention Is All You Need", excerpt: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms...", page: 1 },
      { title: "Deep Learning Foundations", excerpt: "Recurrent neural networks process sequences by maintaining a hidden state that is updated at each timestep...", page: 145 },
    ],
  },
];

export function ChatInterface({ workspaceName, mode }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [input, setInput] = useState("");
  const config = modeConfig[mode];
  const ModeIcon = config.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <ModeIcon className="w-5 h-5" style={{ color: config.color }} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{workspaceName}</h2>
            <p className="text-xs" style={{ color: config.color }}>{config.label}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "flex gap-4",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[80%] space-y-3",
                message.role === "user" && "order-first"
              )}>
                <div className={cn(
                  "rounded-2xl px-4 py-3",
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground ml-auto" 
                    : "glass"
                )}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Sources</p>
                    {message.sources.map((source, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass rounded-lg p-3 hover:border-primary/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-foreground truncate">
                                {source.title}
                              </span>
                              {source.page && (
                                <span className="text-xs text-muted-foreground">
                                  p.{source.page}
                                </span>
                              )}
                              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {source.excerpt}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-accent-foreground">JD</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 glass rounded-xl p-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={config.placeholder}
              rows={1}
              className="w-full bg-transparent border-0 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim()}
            className="gradient-primary glow flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
