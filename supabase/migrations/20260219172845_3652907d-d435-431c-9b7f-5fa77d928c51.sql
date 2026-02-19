
-- Fix search_chunks to validate user ownership of sources
CREATE OR REPLACE FUNCTION public.search_chunks(search_query text, source_ids uuid[], max_results integer DEFAULT 5)
 RETURNS TABLE(id uuid, source_id uuid, content text, chunk_index integer, rank real, source_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result_count integer;
  requesting_user_id uuid;
BEGIN
  -- Get the requesting user's ID
  requesting_user_id := auth.uid();
  
  -- If no authenticated user, return empty
  IF requesting_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Filter source_ids to only those owned by the requesting user
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
    AND ks.user_id = requesting_user_id
    AND dc.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT max_results;
  
  GET DIAGNOSTICS result_count = ROW_COUNT;
  
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
      AND ks.user_id = requesting_user_id
      AND dc.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT max_results;
    
    GET DIAGNOSTICS result_count = ROW_COUNT;
  END IF;
  
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
      AND ks.user_id = requesting_user_id
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

-- Remove email column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update the handle_new_user trigger to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;
