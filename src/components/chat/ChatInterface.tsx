import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, Sparkles, BookOpen, FileText, ExternalLink, Loader2, Mic } from "lucide-react";
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
    placeholder: "Ask anything",
    icon: BookOpen,
  },
  exam: { 
    color: "hsl(var(--mode-exam))", 
    label: "Exam Prep",
    placeholder: "Ask anything",
    icon: Sparkles,
  },
  retrieval: { 
    color: "hsl(var(--mode-retrieval))", 
    label: "Info Retrieval",
    placeholder: "Ask anything",
    icon: FileText,
  },
  institutional: { 
    color: "hsl(var(--mode-institutional))", 
    label: "Institutional",
    placeholder: "Ask anything",
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
    <div className="flex flex-col h-full bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="p-4 rounded-2xl mb-4" style={{ backgroundColor: `${config.color}15` }}>
                <ModeIcon className="w-10 h-10" style={{ color: config.color }} />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">How can I help you today?</h3>
              <p className="text-sm text-muted-foreground max-w-md">{workspaceName} · {config.label}</p>
            </motion.div>
          ) : (
            <div className="space-y-8">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "user" ? (
                      /* User message - right-aligned bubble */
                      <div className="max-w-[85%] md:max-w-[70%]">
                        <div className="bg-muted text-foreground rounded-3xl px-5 py-3 inline-block">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      /* Assistant message - left-aligned, full width content */
                      <div className="max-w-[90%] md:max-w-[80%] space-y-3">
                        {message.content ? (
                          <div className="text-sm leading-relaxed text-foreground prose prose-sm dark:prose-invert max-w-none
                            prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
                            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs
                            prose-pre:bg-muted prose-pre:rounded-xl prose-pre:p-4">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        )}

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <p className="text-xs text-muted-foreground font-medium">Sources</p>
                            {message.sources.map((source, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-muted/50 border border-border rounded-xl p-3 hover:border-primary/30 transition-colors cursor-pointer group"
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
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && messages.length > 0 && messages[messages.length - 1]?.content && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - centered, ChatGPT-style */}
      <div className="border-t border-border bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 border border-border rounded-2xl bg-muted/30 px-4 py-2 focus-within:border-primary/50 transition-colors">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground">
                <Plus className="w-5 h-5" />
              </Button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.placeholder}
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 px-1 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none disabled:opacity-50 min-h-[36px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                }}
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Mic className="w-5 h-5" />
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-2">AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}
