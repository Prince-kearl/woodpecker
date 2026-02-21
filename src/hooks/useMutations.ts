import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { queryKeys } from "./queryKeys";
import type { Database } from "@/integrations/supabase/types";

type Mode = Database["public"]["Enums"]["workspace_mode"];
type SourceType = Database["public"]["Enums"]["source_type"];
type ProcessingStatus = Database["public"]["Enums"]["processing_status"];

// Workspace mutations
export function useWorkspaceMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createWorkspace = useCallback(
    async (data: {
      name: string;
      description?: string;
      color: string;
      mode: Mode;
      sourceIds?: string[];
    }) => {
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: data.name.trim(),
          description: data.description?.trim() || null,
          color: data.color,
          mode: data.mode,
          user_id: user?.id,
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Link sources if provided
      if (data.sourceIds && data.sourceIds.length > 0 && workspace) {
        const workspaceSources = data.sourceIds.map((sourceId) => ({
          workspace_id: workspace.id,
          source_id: sourceId,
        }));

        const { error: sourcesError } = await supabase
          .from("workspace_sources")
          .insert(workspaceSources);

        if (sourcesError) {
          console.error("Error linking sources:", sourcesError);
          // Continue anyway, workspace was created
        }
      }

      // Invalidate all workspace-related queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.byUserId(user?.id!) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.byUserId(user?.id!) });

      return workspace;
    },
    [queryClient, user?.id]
  );

  const updateWorkspaceMode = useCallback(
    async (workspaceId: string, mode: Mode) => {
      const { data, error } = await supabase
        .from("workspaces")
        .update({ mode })
        .eq("id", workspaceId)
        .select()
        .single();

      if (error) throw error;

      // Invalidate workspace queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });

      return data;
    },
    [queryClient]
  );

  const deleteWorkspace = useCallback(
    async (workspaceId: string) => {
      const { error } = await supabase
        .from("workspaces")
        .delete()
        .eq("id", workspaceId);

      if (error) throw error;

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.byUserId(user?.id!) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.byUserId(user?.id!) });

      return null;
    },
    [queryClient, user?.id]
  );

  return {
    createWorkspace,
    updateWorkspaceMode,
    deleteWorkspace,
  };
}

// Workspace sources mutations
export function useWorkspaceSourceMutations() {
  const queryClient = useQueryClient();

  const addSourceToWorkspace = useCallback(
    async (workspaceId: string, sourceId: string) => {
      const { error } = await supabase
        .from("workspace_sources")
        .insert({
          workspace_id: workspaceId,
          source_id: sourceId,
        });

      if (error) throw error;

      // Invalidate workspace sources queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });

      return null;
    },
    [queryClient]
  );

  const removeSourceFromWorkspace = useCallback(
    async (workspaceId: string, sourceId: string) => {
      const { error } = await supabase
        .from("workspace_sources")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("source_id", sourceId);

      if (error) throw error;

      // Invalidate workspace sources queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });

      return null;
    },
    [queryClient]
  );

  return {
    addSourceToWorkspace,
    removeSourceFromWorkspace,
  };
}

// Knowledge source mutations
export function useKnowledgeSourceMutations() {
  const queryClient = useQueryClient();

  const deleteKnowledgeSource = useCallback(
    async (sourceId: string) => {
      // Delete chunks first
      const { error: chunksError } = await supabase
        .from("document_chunks")
        .delete()
        .eq("source_id", sourceId);

      if (chunksError) throw chunksError;

      // Delete the source
      const { error: sourceError } = await supabase
        .from("knowledge_sources")
        .delete()
        .eq("id", sourceId);

      if (sourceError) throw sourceError;

      // Invalidate all knowledge source queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeSources.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });

      return null;
    },
    [queryClient]
  );

  const createKnowledgeSource = useCallback(
    async (data: {
      user_id: string;
      name: string;
      source_type: SourceType;
      file_path: string;
      file_size: number;
      mime_type: string;
      status?: ProcessingStatus;
    }) => {
      const { data: source, error } = await supabase
        .from("knowledge_sources")
        .insert({
          user_id: data.user_id,
          name: data.name,
          source_type: data.source_type,
          file_path: data.file_path,
          file_size: data.file_size,
          mime_type: data.mime_type,
          status: data.status || "pending" as ProcessingStatus,
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate knowledge sources queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeSources.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats.all });

      return source;
    },
    [queryClient]
  );

  return {
    deleteKnowledgeSource,
    createKnowledgeSource,
  };
}

// Conversation mutations
export function useConversationMutations() {
  const queryClient = useQueryClient();

  const deleteConversation = useCallback(
    async (conversationId: string, workspaceId: string) => {
      // Delete messages first
      await supabase.from("messages").delete().eq("conversation_id", conversationId);

      // Delete conversation
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      // Invalidate conversation queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations.byWorkspaceId(workspaceId) });

      return null;
    },
    [queryClient]
  );

  return {
    deleteConversation,
  };
}
