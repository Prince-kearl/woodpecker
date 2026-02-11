import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Sparkles, BookOpen, FileText, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
  workspaceId?: string;
  workspaceName: string;
  mode: "study" | "exam" | "retrieval" | "institutional";
  sources?: Array<{ name: string; content?: string }>;
  conversationId?: string | null;
  onFirstMessage?: (conversationId: string) => void;
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

export function ChatInterface({ workspaceId, workspaceName, mode, sources = [], conversationId, onFirstMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  
  const { messages, isLoading, loadingHistory, sendMessage, clearMessages } = useChat({
    workspaceId,
    conversationId,
    mode,
    sources,
    onFirstMessage,
  });

  const config = modeConfig[mode];
  const ModeIcon = config.icon;

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "U";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(message);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}20` }}>
            <ModeIcon className="w-5 h-5" style={{ color: config.color }} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{workspaceName}</h2>
            <p className="text-xs" style={{ color: config.color }}>{config.label}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearMessages} className="text-muted-foreground hover:text-foreground">
            <Trash2 className="w-4 h-4 mr-2" />Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-2xl mb-4" style={{ backgroundColor: `${config.color}15` }}>
              <ModeIcon className="w-10 h-10" style={{ color: config.color }} />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Start a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-md">{config.placeholder}</p>
          </motion.div>
        ) : null}

        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn("flex gap-4", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className={cn("max-w-[80%] space-y-3", message.role === "user" && "order-first")}>
                <div className={cn(
                  "rounded-2xl px-4 py-3",
                  message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "glass"
                )}>
                  {message.content ? (
                    <div className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                </div>

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
                              <span className="text-xs font-medium text-foreground truncate">{source.title}</span>
                              {source.page && <span className="text-xs text-muted-foreground">p.{source.page}</span>}
                              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.excerpt}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-accent-foreground">{userInitials}</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages.length > 0 && messages[messages.length - 1]?.content && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-muted-foreground pl-12">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 glass rounded-xl p-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={config.placeholder}
              rows={1}
              disabled={isLoading}
              className="w-full bg-transparent border-0 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
              }}
            />
          </div>
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="gradient-primary glow flex-shrink-0">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
