import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { queryKeys } from "./queryKeys";

export function useDashboardStats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime changes for stats
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase
        .channel("stats-workspaces")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "workspaces",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.byUserId(user.id) });
          }
        )
        .subscribe(),

      supabase
        .channel("stats-sources")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "knowledge_sources",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.byUserId(user.id) });
          }
        )
        .subscribe(),

      supabase
        .channel("stats-conversations")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.byUserId(user.id) });
          }
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: queryKeys.dashboardStats.byUserId(user?.id || ""),
    queryFn: async () => {
      if (!user) return null;

      // Fetch all counts in parallel
      const [workspacesRes, sourcesRes, conversationsRes] = await Promise.all([
        supabase
          .from("workspaces")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("knowledge_sources")
          .select("id, status, chunk_count")
          .eq("user_id", user.id),
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const workspaceCount = workspacesRes.count || 0;
      const sources = sourcesRes.data || [];
      const sourceCount = sources.length;
      const processingCount = sources.filter(
        (s) => s.status === "processing" || s.status === "pending"
      ).length;
      const totalChunks = sources.reduce((sum, s) => sum + (s.chunk_count || 0), 0);
      const queryCount = conversationsRes.count || 0;

      return {
        workspaceCount,
        sourceCount,
        processingCount,
        queryCount,
        totalChunks,
      };
    },
    enabled: !!user,
  });
}
