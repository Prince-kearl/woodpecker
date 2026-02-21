import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Globe, 
  Table2, 
  BookOpen, 
  MoreVertical,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Database,
  Link as LinkIcon,
  FileType,
  Trash2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Database as DB } from "@/integrations/supabase/types";
import { formatDistanceToNow, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useKnowledgeSourceMutations } from "@/hooks/useMutations";

type SourceType = DB["public"]["Enums"]["source_type"];
type ProcessingStatus = DB["public"]["Enums"]["processing_status"];

interface DocumentChunk {
  id: string;
  chunk_index: number;
  content: string;
  token_count: number | null;
}

interface SourceCardProps {
  id: string;
  name: string;
  sourceType: SourceType;
  status: ProcessingStatus;
  chunks: number;
  updatedAt: string;
  createdAt?: string;
  fileSize?: number | null;
  originalUrl?: string | null;
  mimeType?: string | null;
  errorMessage?: string | null;
  delay?: number;
  onDelete?: () => void;
}

const typeIcons: Record<SourceType, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  txt: FileText,
  csv: Table2,
  xlsx: Table2,
  pptx: FileText,
  epub: BookOpen,
  web: Globe,
  link: Globe,
};

const typeColors: Record<SourceType, string> = {
  pdf: "text-destructive bg-destructive/10",
  docx: "text-blue-500 bg-blue-500/10",
  txt: "text-muted-foreground bg-muted",
  csv: "text-amber-500 bg-amber-500/10",
  xlsx: "text-green-500 bg-green-500/10",
  pptx: "text-orange-500 bg-orange-500/10",
  epub: "text-purple-500 bg-purple-500/10",
  web: "text-primary bg-primary/10",
  link: "text-primary bg-primary/10",
};

const statusConfig: Record<ProcessingStatus, { icon: typeof Check; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  processing: { icon: Loader2, color: "text-amber-500", label: "Processing" },
  ready: { icon: Check, color: "text-green-500", label: "Ready" },
  error: { icon: AlertCircle, color: "text-destructive", label: "Error" },
};

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SourceCard({
  id,
  name,
  sourceType,
  status,
  chunks,
  updatedAt,
  createdAt,
  fileSize,
  originalUrl,
  mimeType,
  errorMessage,
  delay = 0,
  onDelete,
}: SourceCardProps) {
  const { toast } = useToast();
  const { deleteKnowledgeSource } = useKnowledgeSourceMutations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [chunkPreviews, setChunkPreviews] = useState<DocumentChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const TypeIcon = typeIcons[sourceType] || FileText;
  const statusInfo = statusConfig[status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const formattedDate = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });

  useEffect(() => {
    if (isExpanded && chunkPreviews.length === 0 && status === "ready") {
      fetchChunkPreviews();
    }
  }, [isExpanded]);

  const fetchChunkPreviews = async () => {
    setLoadingChunks(true);
    try {
      const { data, error } = await supabase
        .from("document_chunks")
        .select("id, chunk_index, content, token_count")
        .eq("source_id", id)
        .order("chunk_index", { ascending: true })
        .limit(5);

      if (error) throw error;
      setChunkPreviews(data || []);
    } catch (error) {
      console.error("Error fetching chunks:", error);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteKnowledgeSource(id);

      toast({
        title: "Source deleted",
        description: "The source and its chunks have been removed.",
      });

      onDelete?.();
    } catch (error) {
      console.error("Error deleting source:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the source.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "glass rounded-xl hover:border-primary/30 transition-all",
        isExpanded && "border-primary/20"
      )}
    >
      {/* Main Card Header */}
      <div 
        className="p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-lg", typeColors[sourceType] || "text-muted-foreground bg-muted")}>
            <TypeIcon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground truncate">{name}</h4>
              <div className={cn("flex items-center gap-1", statusInfo.color)}>
                <StatusIcon className={cn("w-3 h-3", status === "processing" && "animate-spin")} />
                <span className="text-xs">{statusInfo.label}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{chunks} chunks</span>
              <span>•</span>
              <span>Updated {formattedDate}</span>
              {fileSize && (
                <>
                  <span>•</span>
                  <span>{formatBytes(fileSize)}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Source
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Expanded Details Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border/50">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileType className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase tracking-wider">Type</span>
                  </div>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {sourceType}
                    {mimeType && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({mimeType.split('/').pop()})
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Database className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase tracking-wider">Size</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {formatBytes(fileSize)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase tracking-wider">Created</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {createdAt ? format(new Date(createdAt), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Database className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase tracking-wider">Chunks</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {chunks.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* URL if applicable */}
              {originalUrl && (
                <div className="py-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase tracking-wider">Source URL</span>
                  </div>
                  <a 
                    href={originalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {originalUrl}
                  </a>
                </div>
              )}

              {/* Error Message */}
              {status === "error" && errorMessage && (
                <div className="py-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-destructive mb-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase tracking-wider">Error</span>
                  </div>
                  <p className="text-sm text-destructive/80">{errorMessage}</p>
                </div>
              )}

              {/* Chunk Previews */}
              {status === "ready" && (
                <div className="pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-xs uppercase tracking-wider">Content Preview</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Showing first {Math.min(5, chunks)} of {chunks} chunks
                    </span>
                  </div>

                  {loadingChunks ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {chunkPreviews.map((chunk) => (
                          <div
                            key={chunk.id}
                            className="p-3 rounded-lg bg-secondary/30 border border-border/50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-primary">
                                Chunk #{chunk.chunk_index + 1}
                              </span>
                              {chunk.token_count && (
                                <span className="text-xs text-muted-foreground">
                                  ~{chunk.token_count} tokens
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {chunk.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
