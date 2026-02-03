import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { formatDistanceToNow } from "date-fns";

export interface Activity {
  id: string;
  type: "upload" | "query" | "update" | "complete";
  title: string;
  workspace?: string;
  timestamp: string;
  rawTimestamp: Date;
}

export function useRecentActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase
        .channel("activity-sources")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "knowledge_sources",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["recent-activity", user.id] });
          }
        )
        .subscribe(),

      supabase
        .channel("activity-conversations")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["recent-activity", user.id] });
          }
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["recent-activity", user?.id],
    queryFn: async (): Promise<Activity[]> => {
      if (!user) return [];

      const activities: Activity[] = [];

      // Get recent sources (uploads)
      const { data: sources } = await supabase
        .from("knowledge_sources")
        .select("id, name, status, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);

      // Get recent conversations with workspace info
      const { data: conversations } = await supabase
        .from("conversations")
        .select(`
          id,
          title,
          created_at,
          workspace_id,
          workspaces (name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // Process sources into activities
      sources?.forEach((source) => {
        const timestamp = new Date(source.updated_at);
        if (source.status === "ready") {
          activities.push({
            id: `source-complete-${source.id}`,
            type: "complete",
            title: `Finished indexing "${source.name}"`,
            timestamp: formatDistanceToNow(timestamp, { addSuffix: true }),
            rawTimestamp: timestamp,
          });
        } else if (source.status === "processing") {
          activities.push({
            id: `source-processing-${source.id}`,
            type: "update",
            title: `Processing "${source.name}"`,
            timestamp: formatDistanceToNow(new Date(source.created_at), { addSuffix: true }),
            rawTimestamp: new Date(source.created_at),
          });
        } else if (source.status === "pending") {
          activities.push({
            id: `source-upload-${source.id}`,
            type: "upload",
            title: `Uploaded "${source.name}"`,
            timestamp: formatDistanceToNow(new Date(source.created_at), { addSuffix: true }),
            rawTimestamp: new Date(source.created_at),
          });
        }
      });

      // Process conversations into activities
      conversations?.forEach((conv) => {
        const workspace = conv.workspaces as { name: string } | null;
        const timestamp = new Date(conv.created_at);
        activities.push({
          id: `conv-${conv.id}`,
          type: "query",
          title: conv.title || "New conversation",
          workspace: workspace?.name,
          timestamp: formatDistanceToNow(timestamp, { addSuffix: true }),
          rawTimestamp: timestamp,
        });
      });

      // Sort by recency
      return activities
        .sort((a, b) => b.rawTimestamp.getTime() - a.rawTimestamp.getTime())
        .slice(0, 8);
    },
    enabled: !!user,
  });
}
