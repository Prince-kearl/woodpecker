import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  File, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  BookOpen,
  Table2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFileUpload } from "@/hooks/useFileUpload";

interface FileUploadZoneProps {
  onFilesUploaded?: (sourceIds: string[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  className?: string;
}

const defaultAcceptedTypes = [
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
  ".epub",
  ".xlsx",
  ".xls",
  ".csv",
  ".pptx",
  ".ppt",
];

const fileTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  doc: FileText,
  txt: FileText,
  epub: BookOpen,
  xlsx: Table2,
  xls: Table2,
  csv: Table2,
  pptx: FileText,
  ppt: FileText,
};

export function FileUploadZone({
  onFilesUploaded,
  acceptedTypes = defaultAcceptedTypes,
  maxFileSize = 50,
  maxFiles = 10,
  className,
}: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    uploadedFiles, 
    isUploading, 
    processFiles, 
    removeFile, 
    clearFiles 
  } = useFileUpload({
    maxFileSize,
    maxFiles,
    onComplete: onFilesUploaded,
  });

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    return fileTypeIcons[ext] || File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files, acceptedTypes);
      }
    },
    [processFiles, acceptedTypes]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files, acceptedTypes);
        e.target.value = "";
      }
    },
    [processFiles, acceptedTypes]
  );

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        whileHover={{ scale: 1.01 }}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-colors",
          "bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            className="mb-4 rounded-full p-4 bg-secondary"
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
          </motion.div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Drag & drop files
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse from your computer
          </p>
          
          <div className="flex flex-wrap justify-center gap-2">
            {["PDF", "DOCX", "EPUB", "XLSX", "CSV", "TXT", "PPTX"].map((type) => (
              <span
                key={type}
                className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-muted-foreground"
              >
                {type}
              </span>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Max {maxFileSize}MB per file • Up to {maxFiles} files
          </p>
        </div>
      </motion.div>

      {/* Uploaded Files List */}
      <AnimatePresence mode="popLayout">
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadedFiles.map((file) => {
              const FileIcon = getFileIcon(file.file.name);
              
              return (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className={cn(
                    "relative rounded-lg border p-4",
                    file.status === "error" 
                      ? "border-destructive/50 bg-destructive/10" 
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* File Icon */}
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                      file.status === "error" ? "bg-destructive/20" : "bg-primary/10"
                    )}>
                      <FileIcon className={cn(
                        "w-5 h-5",
                        file.status === "error" ? "text-destructive" : "text-primary"
                      )} />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.file.name}
                        </p>
                        {file.status === "complete" && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                        {file.status === "error" && (
                          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.file.size)}
                        </span>
                        
                        {file.status === "uploading" && (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Uploading...
                          </span>
                        )}
                        {file.status === "processing" && (
                          <span className="text-xs text-amber-500 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Processing...
                          </span>
                        )}
                        {file.status === "complete" && (
                          <span className="text-xs text-green-500">Complete</span>
                        )}
                        {file.status === "error" && (
                          <span className="text-xs text-destructive">{file.error}</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {(file.status === "uploading" || file.status === "processing") && (
                        <div className="mt-2">
                          <Progress 
                            value={file.status === "processing" ? 100 : file.progress} 
                            className="h-1.5"
                          />
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      disabled={file.status === "uploading" || file.status === "processing"}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons when files are uploaded */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between pt-2"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFiles}
            className="text-muted-foreground"
            disabled={isUploading}
          >
            Clear all
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {uploadedFiles.filter((f) => f.status === "complete").length} of{" "}
              {uploadedFiles.length} complete
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
