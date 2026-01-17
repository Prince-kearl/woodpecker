import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chunk settings
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!firecrawlApiKey) {
    console.error("FIRECRAWL_API_KEY not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { url, crawlSubpages, followSitemap, userId } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log(`Ingesting website: ${formattedUrl}, crawlSubpages: ${crawlSubpages}, followSitemap: ${followSitemap}`);

    // Extract domain name for the source name
    const urlObj = new URL(formattedUrl);
    const sourceName = urlObj.hostname;

    // Create knowledge source record
    const { data: source, error: insertError } = await supabase
      .from("knowledge_sources")
      .insert({
        name: sourceName,
        source_type: "website",
        file_path: formattedUrl,
        mime_type: "text/html",
        file_size: 0,
        user_id: userId,
        status: "processing",
      })
      .select()
      .single();

    if (insertError || !source) {
      console.error("Failed to create source:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create source record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Created source: ${source.id}`);

    try {
      let allContent = "";
      let pageCount = 0;

      if (crawlSubpages) {
        // Use crawl endpoint for multiple pages
        console.log("Starting website crawl...");
        
        const crawlResponse = await fetch("https://api.firecrawl.dev/v1/crawl", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            limit: 20, // Limit pages for now
            maxDepth: 2,
            scrapeOptions: {
              formats: ["markdown"],
              onlyMainContent: true,
            },
          }),
        });

        const crawlData = await crawlResponse.json();
        console.log("Crawl response:", JSON.stringify(crawlData).slice(0, 500));

        if (!crawlResponse.ok) {
          throw new Error(crawlData.error || `Crawl failed with status ${crawlResponse.status}`);
        }

        // For async crawl, we get a job ID - need to poll for results
        if (crawlData.id) {
          console.log(`Crawl job started: ${crawlData.id}`);
          
          // Poll for results (max 60 seconds)
          let attempts = 0;
          const maxAttempts = 30;
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlData.id}`, {
              headers: {
                "Authorization": `Bearer ${firecrawlApiKey}`,
              },
            });
            
            const statusData = await statusResponse.json();
            console.log(`Crawl status (attempt ${attempts + 1}): ${statusData.status}`);
            
            if (statusData.status === "completed") {
              if (statusData.data && Array.isArray(statusData.data)) {
                for (const page of statusData.data) {
                  if (page.markdown) {
                    allContent += `\n\n--- Page: ${page.metadata?.sourceURL || "Unknown"} ---\n\n`;
                    allContent += page.markdown;
                    pageCount++;
                  }
                }
              }
              break;
            } else if (statusData.status === "failed") {
              throw new Error("Crawl job failed");
            }
            
            attempts++;
          }
          
          if (attempts >= maxAttempts) {
            throw new Error("Crawl timed out");
          }
        }
      } else {
        // Single page scrape
        console.log("Scraping single page...");
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        const scrapeData = await scrapeResponse.json();
        console.log("Scrape response status:", scrapeResponse.status);

        if (!scrapeResponse.ok) {
          throw new Error(scrapeData.error || `Scrape failed with status ${scrapeResponse.status}`);
        }

        const markdown = scrapeData.data?.markdown || scrapeData.markdown;
        if (markdown) {
          allContent = markdown;
          pageCount = 1;
        }
      }

      if (!allContent || allContent.length < 10) {
        throw new Error("No content extracted from website");
      }

      console.log(`Extracted ${allContent.length} characters from ${pageCount} page(s)`);

      // Split into chunks
      const chunks = splitIntoChunks(allContent, CHUNK_SIZE, CHUNK_OVERLAP);
      console.log(`Created ${chunks.length} chunks`);

      // Insert chunks
      const chunkRecords = chunks.map((content, index) => ({
        source_id: source.id,
        content,
        chunk_index: index,
        token_count: Math.ceil(content.length / 4),
        metadata: {
          char_count: content.length,
          position: index + 1,
          total_chunks: chunks.length,
          page_count: pageCount,
        },
      }));

      const { error: chunkError } = await supabase
        .from("document_chunks")
        .insert(chunkRecords);

      if (chunkError) {
        throw new Error(`Failed to insert chunks: ${chunkError.message}`);
      }

      // Update source to ready
      await supabase
        .from("knowledge_sources")
        .update({
          status: "ready",
          chunk_count: chunks.length,
          file_size: allContent.length,
          last_processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", source.id);

      console.log(`Website ingestion complete: ${chunks.length} chunks from ${pageCount} page(s)`);

      return new Response(
        JSON.stringify({
          success: true,
          sourceId: source.id,
          chunkCount: chunks.length,
          pageCount,
          textLength: allContent.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (processingError) {
      console.error("Processing error:", processingError);

      await supabase
        .from("knowledge_sources")
        .update({
          status: "error",
          error_message: processingError instanceof Error
            ? processingError.message
            : "Unknown processing error",
        })
        .eq("id", source.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: processingError instanceof Error
            ? processingError.message
            : "Processing failed",
          sourceId: source.id,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Request error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
