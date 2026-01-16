import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chunk settings
const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks

function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at a sentence or paragraph boundary
    if (end < text.length) {
      const slice = text.slice(start, end + 100);
      const sentenceEnd = slice.lastIndexOf('. ');
      const paragraphEnd = slice.lastIndexOf('\n\n');
      const lineEnd = slice.lastIndexOf('\n');
      
      if (paragraphEnd > chunkSize * 0.8) {
        end = start + paragraphEnd + 2;
      } else if (sentenceEnd > chunkSize * 0.8) {
        end = start + sentenceEnd + 2;
      } else if (lineEnd > chunkSize * 0.8) {
        end = start + lineEnd + 1;
      }
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start = end - overlap;
    if (start >= text.length) break;
  }
  
  return chunks;
}

async function extractTextFromFile(
  supabase: any,
  filePath: string,
  mimeType: string | null
): Promise<string> {
  console.log(`Extracting text from file: ${filePath}, mimeType: ${mimeType}`);
  
  const { data, error } = await supabase.storage
    .from("knowledge-documents")
    .download(filePath);
  
  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
  
  // Handle text-based files directly
  const textMimeTypes = [
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/json",
  ];
  
  if (textMimeTypes.some(t => mimeType?.includes(t)) || 
      filePath.endsWith('.txt') || 
      filePath.endsWith('.csv') || 
      filePath.endsWith('.md')) {
    const text = await data.text();
    console.log(`Extracted ${text.length} characters from text file`);
    return text;
  }
  
  // For PDF and other complex formats, use AI to extract text
  if (mimeType === "application/pdf" || filePath.endsWith('.pdf')) {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured for PDF processing");
    }
    
    // Convert to base64
    const arrayBuffer = await data.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    console.log("Sending PDF to AI for text extraction...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all the text content from this PDF document. Return only the extracted text, preserving the structure and formatting as much as possible. Do not add any commentary or explanation.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64}`,
                },
              },
            ],
          },
        ],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI extraction error:", errorText);
      throw new Error(`Failed to extract text from PDF: ${response.status}`);
    }
    
    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content || "";
    console.log(`Extracted ${extractedText.length} characters from PDF`);
    return extractedText;
  }
  
  // For DOCX, XLSX, PPTX - try to extract as text (basic support)
  // These would ideally use a dedicated parser, but for now we'll try basic extraction
  const text = await data.text();
  console.log(`Attempted text extraction: ${text.length} characters`);
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  // Use service role key for admin access
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { sourceId } = await req.json();
    
    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: "sourceId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing document: ${sourceId}`);

    // Get the knowledge source
    const { data: source, error: sourceError } = await supabase
      .from("knowledge_sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (sourceError || !source) {
      console.error("Source not found:", sourceError);
      return new Response(
        JSON.stringify({ error: "Source not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabase
      .from("knowledge_sources")
      .update({ status: "processing" })
      .eq("id", sourceId);

    console.log(`Source found: ${source.name}, type: ${source.source_type}`);

    try {
      // Extract text from the file
      const text = await extractTextFromFile(
        supabase,
        source.file_path,
        source.mime_type
      );

      if (!text || text.length === 0) {
        throw new Error("No text content extracted from document");
      }

      console.log(`Text extracted: ${text.length} characters`);

      // Split into chunks
      const chunks = splitIntoChunks(text, CHUNK_SIZE, CHUNK_OVERLAP);
      console.log(`Created ${chunks.length} chunks`);

      // Delete existing chunks for this source
      await supabase
        .from("document_chunks")
        .delete()
        .eq("source_id", sourceId);

      // Insert new chunks
      const chunkRecords = chunks.map((content, index) => ({
        source_id: sourceId,
        content,
        chunk_index: index,
        token_count: Math.ceil(content.length / 4), // Rough estimate
        metadata: {
          char_count: content.length,
          position: index + 1,
          total_chunks: chunks.length,
        },
      }));

      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(chunkRecords);

      if (insertError) {
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }

      // Update source status to ready
      await supabase
        .from("knowledge_sources")
        .update({
          status: "ready",
          chunk_count: chunks.length,
          last_processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", sourceId);

      console.log(`Document processed successfully: ${chunks.length} chunks created`);

      return new Response(
        JSON.stringify({
          success: true,
          sourceId,
          chunkCount: chunks.length,
          textLength: text.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (processingError) {
      console.error("Processing error:", processingError);
      
      // Update status to error
      await supabase
        .from("knowledge_sources")
        .update({
          status: "error",
          error_message: processingError instanceof Error 
            ? processingError.message 
            : "Unknown processing error",
        })
        .eq("id", sourceId);

      return new Response(
        JSON.stringify({
          error: processingError instanceof Error 
            ? processingError.message 
            : "Processing failed",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Request error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
