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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    // Validate user if auth header provided
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
      if (!claimsError && claimsData?.user) {
        userId = claimsData.user.id;
      }
    }

    const { messages, workspaceId, mode = "study", sources = [] } = await req.json();

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

    // Build context from sources if provided
    let sourceContext = "";
    if (sources && sources.length > 0) {
      sourceContext = "\n\n## Available Knowledge Sources:\n";
      sources.forEach((source: { name: string; content?: string }, idx: number) => {
        sourceContext += `\n### Source ${idx + 1}: ${source.name}\n`;
        if (source.content) {
          sourceContext += `${source.content}\n`;
        }
      });
      sourceContext += "\n\nWhen answering, reference these sources by name and provide relevant excerpts as citations.";
    }

    const systemPrompt = `${modePrompts[mode] || modePrompts.study}

You are a RAG (Retrieval-Augmented Generation) assistant for a knowledge workspace.
${sourceContext}

Guidelines:
- Always be helpful, accurate, and cite sources when available
- Format responses using Markdown for better readability
- If you reference a source, format citations as: [Source Name, page X]
- If asked about something not in your knowledge sources, acknowledge the limitation
- Keep responses focused and relevant to the user's query`;

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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
