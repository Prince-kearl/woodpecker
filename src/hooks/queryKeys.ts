/**
 * Centralized query keys for React Query
 * Ensures consistency across the app for proper invalidation
 */

export const queryKeys = {
  workspaces: {
    all: ["workspaces"] as const,
    byUserId: (userId: string) => [...queryKeys.workspaces.all, userId] as const,
    detail: (id: string) => [...queryKeys.workspaces.all, id] as const,
  },
  conversations: {
    all: ["conversations"] as const,
    byWorkspaceId: (workspaceId: string) =>
      [...queryKeys.conversations.all, workspaceId] as const,
    detail: (id: string) => [...queryKeys.conversations.all, id] as const,
  },
  knowledgeSources: {
    all: ["knowledge-sources"] as const,
    byUserId: (userId: string) =>
      [...queryKeys.knowledgeSources.all, userId] as const,
    detail: (id: string) => [...queryKeys.knowledgeSources.all, id] as const,
  },
  messages: {
    all: ["messages"] as const,
    byConversationId: (conversationId: string) =>
      [...queryKeys.messages.all, conversationId] as const,
  },
  dashboardStats: {
    all: ["dashboard-stats"] as const,
    byUserId: (userId: string) =>
      [...queryKeys.dashboardStats.all, userId] as const,
  },
} as const;
