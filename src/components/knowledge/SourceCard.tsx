import { motion } from "framer-motion";
import { 
  FileText, 
  Globe, 
  Table2, 
  BookOpen, 
  MoreVertical,
  Check,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type SourceType = Database["public"]["Enums"]["source_type"];
type ProcessingStatus = Database["public"]["Enums"]["processing_status"];

interface SourceCardProps {
  id: string;
  name: string;
  sourceType: SourceType;
  status: ProcessingStatus;
  chunks: number;
  updatedAt: string;
  delay?: number;
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

export function SourceCard({
  name,
  sourceType,
  status,
  chunks,
  updatedAt,
  delay = 0,
}: SourceCardProps) {
  const TypeIcon = typeIcons[sourceType] || FileText;
  const statusInfo = statusConfig[status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const formattedDate = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass rounded-xl p-5 hover:border-primary/30 transition-all group"
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
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
