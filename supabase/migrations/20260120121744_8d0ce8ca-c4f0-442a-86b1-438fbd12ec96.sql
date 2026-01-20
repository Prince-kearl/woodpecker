-- Drop and recreate search_chunks with fallback to ILIKE when full-text search returns no results
CREATE OR REPLACE FUNCTION public.search_chunks(
  search_query text, 
  source_ids uuid[], 
  max_results integer DEFAULT 5
)
RETURNS TABLE(
  id uuid, 
  source_id uuid, 
  content text, 
  chunk_index integer, 
  rank real, 
  source_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_count integer;
BEGIN
  -- First try full-text search with websearch_to_tsquery
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
  
  -- Check if we got any results
  GET DIAGNOSTICS result_count = ROW_COUNT;
  
  -- If no results from full-text search, fall back to plainto_tsquery (more lenient)
  IF result_count = 0 THEN
    RETURN QUERY
    SELECT 
      dc.id,
      dc.source_id,
      dc.content,
      dc.chunk_index,
      ts_rank(dc.search_vector, plainto_tsquery('english', search_query)) as rank,
      ks.name as source_name
    FROM document_chunks dc
    JOIN knowledge_sources ks ON ks.id = dc.source_id
    WHERE dc.source_id = ANY(source_ids)
      AND dc.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT max_results;
    
    GET DIAGNOSTICS result_count = ROW_COUNT;
  END IF;
  
  -- If still no results, fall back to ILIKE pattern matching on individual words
  IF result_count = 0 THEN
    RETURN QUERY
    SELECT 
      dc.id,
      dc.source_id,
      dc.content,
      dc.chunk_index,
      1.0::real as rank,
      ks.name as source_name
    FROM document_chunks dc
    JOIN knowledge_sources ks ON ks.id = dc.source_id
    WHERE dc.source_id = ANY(source_ids)
      AND (
        dc.content ILIKE '%' || (string_to_array(search_query, ' '))[1] || '%'
        OR dc.content ILIKE '%' || (string_to_array(search_query, ' '))[2] || '%'
        OR dc.content ILIKE '%' || (string_to_array(search_query, ' '))[3] || '%'
      )
    ORDER BY 
      CASE 
        WHEN dc.content ILIKE '%' || search_query || '%' THEN 3
        WHEN dc.content ILIKE '%' || (string_to_array(search_query, ' '))[1] || '%' THEN 2
        ELSE 1
      END DESC,
      dc.chunk_index ASC
    LIMIT max_results;
  END IF;
  
  RETURN;
END;
$function$;