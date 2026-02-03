import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Fetch all counts in parallel
      const [workspacesRes, sourcesRes, conversationsRes, messagesRes] = await Promise.all([
        supabase
          .from("workspaces")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("knowledge_sources")
          .select("id, status", { count: "exact" })
          .eq("user_id", user.id),
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("messages")
          .select("id, conversation_id")
          .eq("role", "user"),
      ]);

      const workspaceCount = workspacesRes.count || 0;
      const sources = sourcesRes.data || [];
      const sourceCount = sources.length;
      const processingCount = sources.filter(s => s.status === "processing" || s.status === "pending").length;
      
      // Count messages that belong to user's conversations
      const conversationIds = conversationsRes.data?.map(c => c.id) || [];
      const userMessages = messagesRes.data?.filter(m => 
        conversationIds.includes(m.conversation_id)
      ) || [];
      const queryCount = userMessages.length;

      return {
        workspaceCount,
        sourceCount,
        processingCount,
        queryCount,
      };
    },
    enabled: !!user,
  });
}
