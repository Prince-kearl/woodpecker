import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const modePrompts: Record<string, string> = {
  study: `You are a Study Helper assistant. Your goal is to help users understand concepts deeply.
- Provide clear explanations with examples
- Break down complex topics into digestible parts
- Use analogies to make concepts relatable
- Encourage deeper understanding over memorization
- When referencing sources, cite them clearly`,

  exam: `You are an Exam Prep assistant. Your goal is to help users prepare for tests effectively.
- Generate practice questions when asked
- Create flashcard-style Q&A
- Test understanding with challenging scenarios
- Provide detailed explanations for answers
- Help identify knowledge gaps
- When referencing sources, cite them clearly`,

  retrieval: `You are an Information Retrieval assistant. Your goal is to provide accurate, factual answers.
- Be precise and factual in your responses
- Always cite your sources clearly
- Provide direct answers first, then context
- Include relevant quotes from sources when helpful
- Acknowledge when information is not available in sources`,

  institutional: `You are an Institutional Knowledge assistant. Your goal is to help users navigate organizational policies and procedures.
- Reference specific policies and guidelines
- Provide step-by-step procedures when applicable
- Clarify roles and responsibilities
- Point to relevant documentation
- When in doubt, recommend consulting official sources`,
};

interface RetrievedChunk {
  id: string;
  source_id: string;
  content: string;
  chunk_index: number;
  rank: number;
  source_name: string;
}

async function retrieveRelevantChunks(
  supabase: any,
  query: string,
  workspaceId: string,
  maxResults: number = 5
): Promise<RetrievedChunk[]> {
  console.log(`Retrieving chunks for query: "${query}" in workspace: ${workspaceId}`);
  
  // Get source IDs linked to this workspace
  const { data: workspaceSources, error: wsError } = await supabase
    .from("workspace_sources")
    .select("source_id")
    .eq("workspace_id", workspaceId)
    .eq("is_enabled", true);

  if (wsError || !workspaceSources?.length) {
    console.log("No workspace sources found:", wsError?.message);
    return [];
  }

  const sourceIds = workspaceSources.map((ws: { source_id: string }) => ws.source_id);
  console.log(`Found ${sourceIds.length} enabled sources`);

  // Use the search_chunks function for full-text search
  const { data: chunks, error: searchError } = await supabase
    .rpc("search_chunks", {
      search_query: query,
      source_ids: sourceIds,
      max_results: maxResults,
    });

  if (searchError) {
    console.error("Search error:", searchError);
    return [];
  }

  console.log(`Found ${chunks?.length || 0} relevant chunks`);
  return chunks || [];
}

function buildContextFromChunks(chunks: RetrievedChunk[]): string {
  if (!chunks.length) return "";

  let context = "\n\n## Retrieved Knowledge Context:\n";
  
  // Group chunks by source
  const bySource: Record<string, RetrievedChunk[]> = {};
  for (const chunk of chunks) {
    if (!bySource[chunk.source_name]) {
      bySource[chunk.source_name] = [];
    }
    bySource[chunk.source_name].push(chunk);
  }

  for (const [sourceName, sourceChunks] of Object.entries(bySource)) {
    context += `\n### Source: ${sourceName}\n`;
    for (const chunk of sourceChunks) {
      context += `\n[Chunk ${chunk.chunk_index + 1}]:\n${chunk.content}\n`;
    }
  }

  context += `\n---\nUse the above knowledge context to inform your response. Always cite sources by name when referencing information from them. If the user's question cannot be answered from the provided context, acknowledge this and provide general guidance.`;

  return context;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create Supabase client with user auth for RLS
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    // Create admin client for search function
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate user if auth header provided
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseUser.auth.getUser(token);
      if (!claimsError && claimsData?.user) {
        userId = claimsData.user.id;
      }
    }

    const { messages, workspaceId, mode = "study" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get the last user message for retrieval
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    const userQuery = lastUserMessage?.content || "";

    // Retrieve relevant chunks if workspace is provided
    let retrievedContext = "";
    let retrievedChunks: RetrievedChunk[] = [];
    
    if (workspaceId && userQuery) {
      console.log("Retrieving context for workspace:", workspaceId);
      retrievedChunks = await retrieveRelevantChunks(
        supabaseAdmin,
        userQuery,
        workspaceId,
        5
      );
      retrievedContext = buildContextFromChunks(retrievedChunks);
      console.log(`Built context with ${retrievedChunks.length} chunks`);
    }

    const systemPrompt = `${modePrompts[mode] || modePrompts.study}

You are a RAG (Retrieval-Augmented Generation) assistant for a knowledge workspace.
${retrievedContext}

Guidelines:
- Always be helpful, accurate, and cite sources when available
- Format responses using Markdown for better readability
- If you reference a source, format citations as: [Source: Source Name]
- If asked about something not in your knowledge sources, acknowledge the limitation
- Keep responses focused and relevant to the user's query`;

    console.log("Sending request to AI with context length:", retrievedContext.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the streaming response with source metadata in headers
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "X-Retrieved-Sources": JSON.stringify(
        retrievedChunks.map(c => ({
          name: c.source_name,
          chunkIndex: c.chunk_index,
        }))
      ),
    };

    return new Response(response.body, { headers: responseHeaders });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
