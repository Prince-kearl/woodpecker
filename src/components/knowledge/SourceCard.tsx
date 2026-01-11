import { motion } from "framer-motion";
import { 
  FileText, 
  Globe, 
  Table2, 
  BookOpen, 
  MoreVertical,
  Check,
  Clock,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SourceCardProps {
  id: string;
  name: string;
  type: "pdf" | "docx" | "web" | "spreadsheet" | "epub";
  status: "ready" | "processing" | "error";
  chunks: number;
  lastUpdated: string;
  workspaces: string[];
  delay?: number;
}

const typeIcons = {
  pdf: FileText,
  docx: FileText,
  web: Globe,
  spreadsheet: Table2,
  epub: BookOpen,
};

const typeColors = {
  pdf: "text-destructive bg-destructive/10",
  docx: "text-info bg-info/10",
  web: "text-success bg-success/10",
  spreadsheet: "text-warning bg-warning/10",
  epub: "text-accent bg-accent/10",
};

const statusConfig = {
  ready: { icon: Check, color: "text-success", label: "Ready" },
  processing: { icon: Clock, color: "text-warning", label: "Processing" },
  error: { icon: AlertCircle, color: "text-destructive", label: "Error" },
};

export function SourceCard({
  name,
  type,
  status,
  chunks,
  lastUpdated,
  workspaces,
  delay = 0,
}: SourceCardProps) {
  const TypeIcon = typeIcons[type];
  const StatusIcon = statusConfig[status].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass rounded-xl p-5 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-lg", typeColors[type])}>
          <TypeIcon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">{name}</h4>
            <div className={cn("flex items-center gap-1", statusConfig[status].color)}>
              <StatusIcon className="w-3 h-3" />
              <span className="text-xs">{statusConfig[status].label}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{chunks} chunks</span>
            <span>•</span>
            <span>Updated {lastUpdated}</span>
          </div>

          {workspaces.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {workspaces.slice(0, 3).map((ws) => (
                <span 
                  key={ws}
                  className="px-2 py-1 bg-secondary rounded-md text-xs text-secondary-foreground"
                >
                  {ws}
                </span>
              ))}
              {workspaces.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{workspaces.length - 3} more
                </span>
              )}
            </div>
          )}
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
