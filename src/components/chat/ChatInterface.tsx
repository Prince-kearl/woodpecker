import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  Search as SearchIcon,
  Link2,
  Lightbulb,
  Scale,
  BarChart3,
  BookOpen,
  FileText,
  Clock,
  X,
  ChevronDown,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "sonner";

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
    placeholder: "Ask anything about your study materials…",
    icon: BookOpen,
  },
  exam: {
    color: "hsl(var(--mode-exam))",
    label: "Exam Prep",
    placeholder: "Ask anything about exam topics…",
    icon: Sparkles,
  },
  retrieval: {
    color: "hsl(var(--mode-retrieval))",
    label: "Info Retrieval",
    placeholder: "Ask anything about your knowledge base…",
    icon: FileText,
  },
  institutional: {
    color: "hsl(var(--mode-institutional))",
    label: "Institutional",
    placeholder: "Ask anything about the institution…",
    icon: FileText,
  },
};

const quickModes = [
  { id: "compare", icon: Scale, label: "Compare" },
  { id: "analyze", icon: BarChart3, label: "Analyze" },
  { id: "academic", icon: BookOpen, label: "Academic" },
  { id: "policies", icon: FileText, label: "Policies" },
  { id: "latest", icon: Clock, label: "Latest Updates" },
];

export function ChatInterface({
  workspaceId,
  workspaceName,
  mode,
  sources = [],
  conversationId,
  onFirstMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
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

  // Voice input
  const [pendingVoiceSubmit, setPendingVoiceSubmit] = useState(false);
  const { isListening, isSupported, transcript: liveTranscript, toggleListening } = useVoiceInput({
    onResult: (finalTranscript) => {
      setInput((prev) => prev + (prev ? " " : "") + finalTranscript);
      setPendingVoiceSubmit(true);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const config = modeConfig[mode];
  const ModeIcon = config.icon;

  // Get the latest assistant message for the response area
  const latestResponse = messages.filter((m) => m.role === "assistant").pop();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(message);
  };

  // Auto-submit after voice input
  useEffect(() => {
    if (!isListening && pendingVoiceSubmit && input.trim()) {
      const timer = setTimeout(() => {
        handleSubmit();
        setPendingVoiceSubmit(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isListening, pendingVoiceSubmit, input]);

  const handleQuickMode = (modeId: string) => {
    const modePrompts: Record<string, string> = {
      compare: "Compare and contrast ",
      analyze: "Analyze the following: ",
      academic: "From an academic perspective, ",
      policies: "What are the policies regarding ",
      latest: "What are the latest updates on ",
    };
    setInput(modePrompts[modeId] || "");
    textareaRef.current?.focus();
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center">
          {loadingHistory ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasMessages ? (
            <>
              {/* Hero Section - same as Search page */}
              <motion.section
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10 w-full"
              >
                <div className="p-4 rounded-2xl mb-4 inline-block" style={{ backgroundColor: `${config.color}15` }}>
                  <ModeIcon className="w-10 h-10" style={{ color: config.color }} />
                </div>
                <h1 className="text-4xl md:text-5xl font-medium mb-3 gradient-text">
                  {workspaceName}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {config.label} · Evidence-based answers from your sources
                </p>
              </motion.section>

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
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Search sources">
                          <SearchIcon className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Restrict to cited sources">
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Suggest queries">
                          <Lightbulb className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Input */}
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                          }
                        }}
                        placeholder={config.placeholder}
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
                          title={isListening ? "Stop listening" : "Start voice input"}
                        >
                          {isListening ? (
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
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
                          disabled={!input.trim() || isLoading}
                          title="Send"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Voice Listening Indicator */}
                    <AnimatePresence>
                      {isListening && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 pt-2 border-t border-border/50"
                        >
                          <div className="flex items-center gap-3">
                            <motion.div className="flex items-center gap-0.5">
                              {[0, 1, 2, 3, 4].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-1 rounded-full bg-destructive"
                                  animate={{ height: ["8px", "16px", "8px"] }}
                                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                                />
                              ))}
                            </motion.div>
                            <span className="text-sm text-muted-foreground italic flex-1">
                              {liveTranscript || "Listening... speak now"}
                            </span>
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
                {quickModes.map((qm) => (
                  <button
                    key={qm.id}
                    onClick={() => handleQuickMode(qm.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border rounded-full text-muted-foreground text-sm hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
                  >
                    <qm.icon className="h-4 w-4" />
                    <span>{qm.label}</span>
                  </button>
                ))}
              </motion.div>
            </>
          ) : (
            <>
              {/* Conversation Messages */}
              <div className="w-full space-y-8">
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "user" ? (
                        <div className="max-w-[85%] md:max-w-[70%]">
                          <div className="bg-muted text-foreground rounded-3xl px-5 py-3 inline-block">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full space-y-3">
                          {message.content ? (
                            <div className="prose prose-invert max-w-none text-foreground leading-relaxed
                              prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                              prose-h2:text-xl prose-h3:text-lg prose-h4:text-base
                              prose-p:text-foreground prose-p:mb-4 prose-p:leading-7
                              prose-strong:text-primary prose-strong:font-semibold
                              prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                              prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
                              prose-li:text-foreground prose-li:leading-7
                              prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
                              prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
                              prose-code:text-primary prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                              prose-hr:border-border prose-hr:my-6">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">Thinking...</span>
                            </div>
                          )}

                          {/* Sources */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="bg-card border border-border rounded-xl overflow-hidden">
                              <button
                                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                                className="w-full flex items-center justify-between px-5 py-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                              >
                                <h3 className="font-medium text-foreground text-sm">
                                  Sources ({message.sources.length})
                                </h3>
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform",
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
                                      {message.sources.map((source, idx) => (
                                        <div
                                          key={idx}
                                          className={cn(
                                            "py-3 border-b border-border last:border-0",
                                            idx === 0 && "relative pl-3 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary before:rounded"
                                          )}
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-foreground text-sm">{source.title}</span>
                                            {source.page && (
                                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                                Page {source.page}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-muted-foreground">{source.excerpt}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading indicator */}
                {isLoading && messages.length > 0 && messages[messages.length - 1]?.content && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-6">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary"
                          animate={{ scale: [0, 1, 0] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.16 }}
                        />
                      ))}
                    </div>
                    <span className="text-muted-foreground text-sm">Searching knowledge base...</span>
                  </motion.div>
                )}
              </div>

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input area - always visible when there are messages */}
      {hasMessages && (
        <div className="border-t border-border bg-background">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <form onSubmit={handleSubmit}>
              <div className="relative bg-card border border-border rounded-3xl p-3 shadow-lg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-1 pt-1">
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Search sources">
                      <SearchIcon className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Restrict to cited sources">
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Suggest queries">
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder={config.placeholder}
                    className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground resize-none min-h-[28px] max-h-[120px] py-2 px-2 focus:outline-none"
                    rows={1}
                    disabled={isLoading}
                  />
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
                      title={isListening ? "Stop listening" : "Start voice input"}
                    >
                      {isListening ? (
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
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
                      disabled={!input.trim() || isLoading}
                      title="Send"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Voice Listening Indicator */}
                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 pt-2 border-t border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div className="flex items-center gap-0.5">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1 rounded-full bg-destructive"
                              animate={{ height: ["8px", "16px", "8px"] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                            />
                          ))}
                        </motion.div>
                        <span className="text-sm text-muted-foreground italic flex-1">
                          {liveTranscript || "Listening... speak now"}
                        </span>
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
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
