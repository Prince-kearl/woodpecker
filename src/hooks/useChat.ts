import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

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
  mode?: "study" | "exam" | "retrieval" | "institutional";
  sources?: Source[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function useChat({ workspaceId, mode = "study", sources: knowledgeSources = [] }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    // Add empty assistant message that we'll update
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
        
        if (response.status === 429) {
          toast({
            variant: "destructive",
            title: "Rate Limit Exceeded",
            description: "Too many requests. Please wait a moment and try again.",
          });
        } else if (response.status === 402) {
          toast({
            variant: "destructive",
            title: "Usage Limit Reached",
            description: "Please add credits to your workspace to continue.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: errorData.error || "Failed to get response",
          });
        }
        
        // Remove the empty assistant message
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setIsLoading(false);
        return;
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

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
            // Incomplete JSON, put it back and wait for more data
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
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
          } catch {
            /* ignore partial leftovers */
          }
        }
      }

      // Extract citations from the response (simple pattern matching)
      const extractedSources = extractCitations(assistantContent);
      if (extractedSources.length > 0) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, sources: extractedSources } : m
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to the AI service. Please try again.",
      });
      // Remove the empty assistant message
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, workspaceId, mode, knowledgeSources, isLoading, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    setMessages,
  };
}

// Extract citations from AI response
function extractCitations(content: string): Array<{ title: string; excerpt: string; page?: number }> {
  const citations: Array<{ title: string; excerpt: string; page?: number }> = [];
  
  // Pattern: [Source Name, page X] or [Source Name]
  const citationPattern = /\[([^\],]+)(?:,\s*(?:page|p\.?)\s*(\d+))?\]/gi;
  const matches = content.matchAll(citationPattern);
  
  const seen = new Set<string>();
  for (const match of matches) {
    const title = match[1].trim();
    const page = match[2] ? parseInt(match[2], 10) : undefined;
    const key = `${title}-${page}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({
        title,
        excerpt: `Referenced in the response`,
        page,
      });
    }
  }
  
  return citations;
}
