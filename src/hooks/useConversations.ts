import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Conversation {
  id: string;
  title: string | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export function useConversations(workspaceId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch conversations for workspace
  useEffect(() => {
    if (!workspaceId || !user) return;

    const fetchConversations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, workspace_id, created_at, updated_at")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
      } else {
        setConversations(data || []);
      }
      setLoading(false);
    };

    fetchConversations();

    // Real-time subscription
    const channel = supabase
      .channel(`conversations-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, user]);

  const createConversation = useCallback(async (): Promise<string | null> => {
    if (!workspaceId || !user) return null;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        title: "New Chat",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to create conversation" });
      return null;
    }

    setActiveConversationId(data.id);
    return data.id;
  }, [workspaceId, user, toast]);

  const renameConversation = useCallback(async (id: string, title: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to rename conversation" });
    }
  }, [toast]);

  const deleteConversation = useCallback(async (id: string) => {
    // Delete messages first, then conversation
    await supabase.from("messages").delete().eq("conversation_id", id);
    const { error } = await supabase.from("conversations").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete conversation" });
    } else {
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    }
  }, [activeConversationId, toast]);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    renameConversation,
    deleteConversation,
    loading,
  };
}
