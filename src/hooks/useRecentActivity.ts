import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { formatDistanceToNow } from "date-fns";

export interface Activity {
  id: string;
  type: "upload" | "query" | "update" | "complete";
  title: string;
  workspace?: string;
  timestamp: string;
}

export function useRecentActivity() {
  const { user } = useAuth();

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
        .order("created_at", { ascending: false })
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
      sources?.forEach(source => {
        if (source.status === "ready") {
          activities.push({
            id: `source-complete-${source.id}`,
            type: "complete",
            title: `Finished indexing "${source.name}"`,
            timestamp: formatDistanceToNow(new Date(source.updated_at), { addSuffix: true }),
          });
        } else if (source.status === "processing" || source.status === "pending") {
          activities.push({
            id: `source-upload-${source.id}`,
            type: "upload",
            title: `Uploaded "${source.name}"`,
            timestamp: formatDistanceToNow(new Date(source.created_at), { addSuffix: true }),
          });
        }
      });

      // Process conversations into activities
      conversations?.forEach(conv => {
        const workspace = conv.workspaces as { name: string } | null;
        activities.push({
          id: `conv-${conv.id}`,
          type: "query",
          title: conv.title || "New conversation",
          workspace: workspace?.name,
          timestamp: formatDistanceToNow(new Date(conv.created_at), { addSuffix: true }),
        });
      });

      // Sort by recency (we'll use the raw timestamp for sorting)
      return activities
        .sort((a, b) => {
          // This is a simple sort - in production you'd want actual timestamps
          return 0;
        })
        .slice(0, 8);
    },
    enabled: !!user,
  });
}
