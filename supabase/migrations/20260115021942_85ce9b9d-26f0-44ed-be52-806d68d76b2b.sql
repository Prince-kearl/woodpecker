-- Create storage bucket for knowledge documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-documents',
  'knowledge-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/csv', 'text/markdown', 'application/epub+zip']
);

-- RLS policy: Users can upload files to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Users can view their own files
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'knowledge-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Users can delete their own files
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);