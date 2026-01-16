import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type SourceType = Database["public"]["Enums"]["source_type"];

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
  sourceId?: string;
}

interface UseFileUploadOptions {
  maxFileSize?: number; // in MB
  maxFiles?: number;
  onComplete?: (sourceIds: string[]) => void;
}

const mimeToSourceType: Record<string, SourceType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "text/markdown": "txt",
  "application/epub+zip": "epub",
};

const extToMimeType: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  epub: "application/epub+zip",
};

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { maxFileSize = 50, maxFiles = 10, onComplete } = options;
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const uploadFile = useCallback(async (fileEntry: UploadedFile): Promise<string | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileEntry.id
            ? { ...f, status: "error", error: "Please log in to upload files" }
            : f
        )
      );
      return null;
    }

    try {
      const ext = getFileExtension(fileEntry.file.name);
      const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const mimeType = fileEntry.file.type || extToMimeType[ext] || "application/octet-stream";

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("knowledge-documents")
        .upload(fileName, fileEntry.file, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Update progress to 100%
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileEntry.id ? { ...f, progress: 100, status: "processing" } : f
        )
      );

      // Determine source type
      const sourceType: SourceType = mimeToSourceType[mimeType] || "txt";

      // Create knowledge source record
      const { data: sourceData, error: dbError } = await supabase
        .from("knowledge_sources")
        .insert({
          user_id: user.id,
          name: fileEntry.file.name,
          source_type: sourceType,
          file_path: fileName,
          file_size: fileEntry.file.size,
          mime_type: mimeType,
          status: "pending",
        })
        .select("id")
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Trigger document processing in background
      supabase.functions.invoke("process-document", {
        body: { sourceId: sourceData.id },
      }).then(({ error }) => {
        if (error) {
          console.error("Document processing error:", error);
        }
      });

      // Mark as complete
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileEntry.id
            ? { ...f, status: "complete", sourceId: sourceData.id }
            : f
        )
      );

      return sourceData.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileEntry.id ? { ...f, status: "error", error: message } : f
        )
      );
      return null;
    }
  }, []);

  const processFiles = useCallback(
    async (files: FileList | File[], acceptedTypes: string[]) => {
      const fileArray = Array.from(files);
      const validFiles: UploadedFile[] = [];

      for (const file of fileArray) {
        if (uploadedFiles.length + validFiles.length >= maxFiles) {
          toast.error(`Maximum ${maxFiles} files allowed`);
          break;
        }

        const ext = "." + getFileExtension(file.name);
        if (!acceptedTypes.includes(ext)) {
          toast.error(`File type ${ext} not supported`);
          continue;
        }

        if (file.size > maxFileSize * 1024 * 1024) {
          validFiles.push({
            id: crypto.randomUUID(),
            file,
            progress: 0,
            status: "error",
            error: `File exceeds ${maxFileSize}MB limit`,
          });
          continue;
        }

        validFiles.push({
          id: crypto.randomUUID(),
          file,
          progress: 0,
          status: "uploading",
        });
      }

      if (validFiles.length === 0) return;

      setUploadedFiles((prev) => [...prev, ...validFiles]);
      setIsUploading(true);

      // Upload files concurrently
      const uploadPromises = validFiles
        .filter((f) => f.status === "uploading")
        .map((f) => uploadFile(f));

      const results = await Promise.all(uploadPromises);
      const successfulIds = results.filter((id): id is string => id !== null);

      setIsUploading(false);

      if (successfulIds.length > 0) {
        toast.success(`${successfulIds.length} file(s) uploaded successfully`);
        onComplete?.(successfulIds);
      }
    },
    [uploadedFiles, maxFiles, maxFileSize, uploadFile, onComplete]
  );

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  return {
    uploadedFiles,
    isUploading,
    processFiles,
    removeFile,
    clearFiles,
  };
}
