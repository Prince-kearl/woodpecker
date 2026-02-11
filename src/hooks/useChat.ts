import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

interface Source {
  name: string;
  content?: string;
}

interface UseChatOptions {
  workspaceId?: string;
  conversationId?: string | null;
  mode?: "study" | "exam" | "retrieval" | "institutional";
  sources?: Source[];
  onFirstMessage?: (conversationId: string) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function useChat({
  workspaceId,
  conversationId,
  mode = "study",
  sources: knowledgeSources = [],
  onFirstMessage,
}: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();

  // Load messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, sources")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
      } else {
        setMessages(
          (data || []).map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            sources: m.sources as Message["sources"],
          }))
        );
      }
      setLoadingHistory(false);
    };

    loadMessages();

    // Real-time subscription for new messages in this conversation
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Only add if we don't already have it (avoid duplicates from our own inserts)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                id: newMsg.id,
                role: newMsg.role,
                content: newMsg.content,
                sources: newMsg.sources,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const persistMessage = useCallback(
    async (convId: string, role: string, content: string, sources?: any) => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: convId,
        role,
        content,
        sources: sources || [],
      });
      if (error) console.error("Error persisting message:", error);
    },
    []
  );

  const sendMessage = useCallback(
    async (input: string) => {
      if (!input.trim() || isLoading) return;

      let activeConvId = conversationId;

      // Auto-create conversation if none active
      if (!activeConvId && workspaceId && user) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            workspace_id: workspaceId,
            user_id: user.id,
            title: input.trim().slice(0, 60),
          })
          .select("id")
          .single();

        if (error || !data) {
          toast({ variant: "destructive", title: "Error", description: "Failed to create conversation" });
          return;
        }
        activeConvId = data.id;
        onFirstMessage?.(data.id);
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: input.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Persist user message
      if (activeConvId) {
        await persistMessage(activeConvId, "user", userMessage.content);
      }

      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            workspaceId,
            mode,
            sources: knowledgeSources,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessages: Record<number, { title: string; description: string }> = {
            429: { title: "Rate Limit Exceeded", description: "Too many requests. Please wait a moment and try again." },
            402: { title: "Usage Limit Reached", description: "Please add credits to your workspace to continue." },
          };
          const errMsg = errorMessages[response.status] || {
            title: "Error",
            description: errorData.error || "Failed to get response",
          };
          toast({ variant: "destructive", ...errMsg });
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setIsLoading(false);
          return;
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") { streamDone = true; break; }
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Final flush
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              );
            }
          } catch { /* ignore */ }
        }

        // Extract citations
        const extractedSources = extractCitations(assistantContent);
        if (extractedSources.length > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, sources: extractedSources } : m
            )
          );
        }

        // Persist assistant message
        if (activeConvId) {
          await persistMessage(activeConvId, "assistant", assistantContent, extractedSources.length > 0 ? extractedSources : undefined);
        }
      } catch (error) {
        console.error("Chat error:", error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to connect to the AI service. Please try again.",
        });
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, workspaceId, conversationId, mode, knowledgeSources, isLoading, toast, session, user, persistMessage, onFirstMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, loadingHistory, sendMessage, clearMessages, setMessages };
}

function extractCitations(content: string): Array<{ title: string; excerpt: string; page?: number }> {
  const citations: Array<{ title: string; excerpt: string; page?: number }> = [];
  const citationPattern = /\[([^\],]+)(?:,\s*(?:page|p\.?)\s*(\d+))?\]/gi;
  const matches = content.matchAll(citationPattern);
  const seen = new Set<string>();
  for (const match of matches) {
    const title = match[1].trim();
    const page = match[2] ? parseInt(match[2], 10) : undefined;
    const key = `${title}-${page}`;
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({ title, excerpt: "Referenced in the response", page });
    }
  }
  return citations;
}
