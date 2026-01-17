-- Add full-text search vector column to document_chunks
ALTER TABLE public.document_chunks 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_chunk_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-update search vector
DROP TRIGGER IF EXISTS update_chunk_search_vector_trigger ON public.document_chunks;
CREATE TRIGGER update_chunk_search_vector_trigger
BEFORE INSERT OR UPDATE OF content ON public.document_chunks
FOR EACH ROW
EXECUTE FUNCTION public.update_chunk_search_vector();

-- Update existing chunks with search vectors
UPDATE public.document_chunks 
SET search_vector = to_tsvector('english', COALESCE(content, ''))
WHERE search_vector IS NULL;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_document_chunks_search 
ON public.document_chunks USING GIN(search_vector);

-- Create function to search chunks by relevance
CREATE OR REPLACE FUNCTION public.search_chunks(
  search_query text,
  source_ids uuid[],
  max_results int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  content text,
  chunk_index int,
  rank real,
  source_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.source_id,
    dc.content,
    dc.chunk_index,
    ts_rank(dc.search_vector, websearch_to_tsquery('english', search_query)) as rank,
    ks.name as source_name
  FROM document_chunks dc
  JOIN knowledge_sources ks ON ks.id = dc.source_id
  WHERE dc.source_id = ANY(source_ids)
    AND dc.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$;