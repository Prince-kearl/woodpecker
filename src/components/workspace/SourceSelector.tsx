import { motion } from "framer-motion";
import { FileText, Globe, Table2, BookOpen, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  name: string;
  type: "pdf" | "docx" | "web" | "spreadsheet" | "epub";
  chunks: number;
}

interface SourceSelectorProps {
  sources: Source[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const typeIcons = {
  pdf: FileText,
  docx: FileText,
  web: Globe,
  spreadsheet: Table2,
  epub: BookOpen,
};

const typeColors = {
  pdf: "text-destructive",
  docx: "text-info",
  web: "text-success",
  spreadsheet: "text-warning",
  epub: "text-accent",
};

export function SourceSelector({ sources, selectedIds, onToggle }: SourceSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground">Knowledge Sources</h3>
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} of {sources.length} sources selected
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Source
        </Button>
      </div>

      <div className="grid gap-2 max-h-[400px] overflow-auto pr-2">
        {sources.map((source, index) => {
          const isSelected = selectedIds.includes(source.id);
          const Icon = typeIcons[source.type];
          
          return (
            <motion.button
              key={source.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onToggle(source.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                isSelected 
                  ? "glass border-primary/50" 
                  : "bg-secondary/50 hover:bg-secondary border border-transparent"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                isSelected 
                  ? "bg-primary border-primary" 
                  : "border-muted-foreground"
              )}>
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              
              <Icon className={cn("w-4 h-4", typeColors[source.type])} />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {source.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {source.chunks} chunks
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
