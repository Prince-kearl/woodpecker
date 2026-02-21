# State Synchronization & Mutation Handling Guide

## Overview

This document outlines the comprehensive refactoring done to fix state synchronization issues in the Woodpecker app. The app now properly handles mutations with immediate UI updates and real-time data synchronization.

## Architecture

### 1. Query Management (React Query)

**File**: `src/hooks/queryKeys.ts`
- Centralized query keys for consistency across the app
- Ensures proper invalidation matching between mutations and queries
- Query key structure:
  ```
  workspaces.all → ["workspaces"]
  workspaces.byUserId(id) → ["workspaces", id]
  workspaces.detail(id) → ["workspaces", id]
  conversations.byWorkspaceId(id) → ["conversations", id]
  knowledgeSources.all → ["knowledge-sources"]
  dashboardStats.byUserId(id) → ["dashboard-stats", id]
  ```

### 2. Mutation Hooks

**File**: `src/hooks/useMutations.ts`

Contains all mutation operations with automatic query invalidation:

#### Workspace Mutations
- `createWorkspace()` - Create new workspace
  - Invalidates: workspaces queries, dashboard stats
  - Returns: Created workspace data
  
- `updateWorkspaceMode()` - Change workspace retrieval mode
  - Invalidates: specific workspace and all workspaces queries
  - Returns: Updated workspace data
  
- `deleteWorkspace()` - Delete workspace
  - Invalidates: all workspace queries, dashboard stats

#### Workspace Source Mutations
- `addSourceToWorkspace()` - Link knowledge source to workspace
  - Invalidates: workspace detail queries, all workspaces
  
- `removeSourceFromWorkspace()` - Unlink knowledge source from workspace
  - Invalidates: workspace detail queries, all workspaces

#### Knowledge Source Mutations
- `createKnowledgeSource()` - Create new knowledge source
  - Invalidates: knowledge sources queries, dashboard stats
  
- `deleteKnowledgeSource()` - Delete knowledge source and chunks
  - Invalidates: all knowledge source queries, dashboard stats, workspaces

#### Conversation Mutations
- `deleteConversation()` - Delete conversation and messages
  - Invalidates: workspace conversations queries

### 3. Real-Time Data Synchronization

**Implemented in**:
- `src/hooks/useDashboardStats.ts` - Listens to workspace, source, and conversation changes
- `src/hooks/useWorkspaces.ts` - Listens to workspace table changes
- `src/hooks/useConversations.ts` - Listens to conversation changes per workspace
- `src/hooks/useChat.ts` - Listens to message changes per conversation

**How it works**:
1. Components subscribe to Supabase real-time changes
2. On change event, queries are invalidated
3. React Query automatically refetches data
4. UI updates with fresh data

## Component Integration

### CreateWorkspace Page

**Before**: Mutations didn't invalidate queries
**After**: Uses `useWorkspaceMutations()` hook

```tsx
const { createWorkspace } = useWorkspaceMutations();

await createWorkspace({
  name,
  description,
  color,
  mode,
  sourceIds,
});
// UI updates automatically from query invalidation
```

### Workspace Page

**Before**: Direct Supabase calls without invalidation
**After**: Uses mutation hooks for all operations

```tsx
const { addSourceToWorkspace, removeSourceFromWorkspace } = useWorkspaceSourceMutations();
const { updateWorkspaceMode } = useWorkspaceMutations();

// Adding/removing sources triggers query invalidation
await addSourceToWorkspace(workspaceId, sourceId);

// Mode changes propagate to all views
await updateWorkspaceMode(workspaceId, newMode);
```

### Knowledge Page

**Before**: File uploads didn't trigger list refresh
**After**: `useFileUpload` hook invalidates knowledge sources queries

```tsx
// After file upload completes:
// 1. Source record is created
// 2. knowledge-sources query is invalidated
// 3. Knowledge page list automatically updates
```

### SourceCard Component

**Before**: Deletion didn't remove item from list
**After**: Uses `useKnowledgeSourceMutations()` hook

```tsx
const { deleteKnowledgeSource } = useKnowledgeSourceMutations();

await deleteKnowledgeSource(id);
// Query invalidation removes item from UI
```

## Data Flow Diagram

```
User Action (Create/Update/Delete)
        ↓
Mutation Hook (useMutations.ts)
        ↓
Supabase API Call
        ↓
Query Invalidation (via queryClient)
        ↓
React Query Auto-Refetch
        ↓
UI Update (via component re-render)

Parallel: Real-Time Subscription
        ↓
Change Event from Supabase
        ↓
Query Invalidation Triggered
        ↓
React Query Auto-Refetch
        ↓
UI Update
```

## Pages with Synchronized State

### Dashboard
- ✅ Workspace count updates on create/delete
- ✅ Source count updates on upload/delete
- ✅ Query count updates on conversation changes
- ✅ Stats refresh from real-time subscriptions

### Workspaces
- ✅ New workspaces appear instantly
- ✅ Workspace deletions remove from list
- ✅ Source counts update in real-time
- ✅ Query counts update in real-time

### Search
- ✅ Workspace list updates on changes
- ✅ Knowledge sources appear in settings
- ✅ Settings changes reflect immediately
- ✅ Conversations sync in real-time

### Workspace Detail
- ✅ Adding/removing sources updates instantly
- ✅ Mode changes propagate to UI
- ✅ Conversation list updates in real-time
- ✅ Chat messages appear in real-time

### Knowledge
- ✅ New sources appear after upload
- ✅ Processing status updates via real-time
- ✅ Source deletion removes from list
- ✅ Chunk previews load dynamically

## Best Practices

### When Adding New Mutations

1. Create a mutation function in `useMutations.ts`
2. Add to appropriate export group (Workspace, KnowledgeSource, etc.)
3. Query invalidation MUST match:
   ```tsx
   const { createItem } = useItemMutations();
   
   // Invalidate all related queries
   await queryClient.invalidateQueries({ 
     queryKey: queryKeys.items.all 
   });
   ```

4. Use standardized query keys from `queryKeys.ts`

### When Creating Components with Mutations

1. Import the appropriate mutation hook:
   ```tsx
   import { useWorkspaceMutations } from "@/hooks/useMutations";
   ```

2. Use the mutation:
   ```tsx
   const { createWorkspace } = useWorkspaceMutations();
   
   try {
     await createWorkspace(data);
     toast.success("Created successfully");
   } catch (error) {
     toast.error("Failed to create");
   }
   ```

3. No manual state updates needed - query invalidation handles it

### Real-Time Subscriptions

- Already implemented in all data-fetching hooks
- Subscribe to changes with automatic refetch
- No need to manually manage subscriptions in components
- Cleanup handled automatically in useEffect return

## Testing the State Synchronization

### Test 1: Create Workspace
1. Navigate to Workspaces page
2. Click "Create Workspace"
3. Fill in details and create
4. ✅ New workspace appears in list immediately
5. ✅ Dashboard updates with new count
6. ✅ Workspace appears in dropdown on Search page

### Test 2: Add Knowledge Source
1. Go to Knowledge page
2. Upload a file
3. ✅ Source appears in list with "Pending" status
4. ✅ Dashboard source count increases
5. ✅ Status updates to "Ready" when processing completes

### Test 3: Add Source to Workspace
1. Go to Workspace detail page
2. Add a knowledge source
3. ✅ Source appears in workspace immediately
4. ✅ Count updates in Workspaces list
5. ✅ Workspace sidebar updates if showing count

### Test 4: Delete Operations
1. Delete a workspace/source/conversation
2. ✅ Item removed from UI immediately
3. ✅ No refresh needed
4. ✅ Counts update automatically
5. ✅ Related views reflect deletion

## Troubleshooting

### Query Not Updating After Mutation

1. Check that mutation hook is used (not direct Supabase calls)
2. Verify query key matches in queryKeys.ts
3. Check that queryClient.invalidateQueries is called
4. Look for typos in query key names

### Real-Time Subscription Not Working

1. Verify Supabase real-time is enabled
2. Check RLS policies allow reading the table
3. Ensure channel name is unique
4. Verify filter condition matches the data

### Stale Data Showing

1. Check if query is being cached too long
2. Ensure invalidation happens after mutation
3. Verify real-time subscription is active
4. Check browser DevTools React Query extension

## Performance Considerations

- Queries are cached by default (stale-time: 0)
- Invalidation triggers immediate refetch
- Real-time subscriptions ensure freshness
- Dashboard stats are debounced to avoid excessive updates
- File uploads use background processing

## Future Improvements

1. Add optimistic updates for better UX
2. Implement pagination for large data sets
3. Add selective invalidation for nested queries
4. Implement local cache management
5. Add offline support with background sync
