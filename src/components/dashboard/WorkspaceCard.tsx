import { motion } from "framer-motion";
import { MessageSquare, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface WorkspaceCardProps {
  id: string;
  name: string;
  description: string;
  sourceCount: number;
  queryCount: number;
  mode: "study" | "exam" | "retrieval" | "institutional";
  color: string;
  delay?: number;
}

const modeLabels = {
  study: "Study Helper",
  exam: "Exam Prep",
  retrieval: "Info Retrieval",
  institutional: "Institutional",
};

export function WorkspaceCard({ 
  id, 
  name, 
  description, 
  sourceCount, 
  queryCount, 
  mode,
  color,
  delay = 0 
}: WorkspaceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="glass rounded-xl overflow-hidden group"
    >
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
          <span 
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `${color}20`,
              color: color
            }}
          >
            {modeLabels[mode]}
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{sourceCount} sources</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>{queryCount} queries</span>
          </div>
        </div>

        <Link to={`/workspace/${id}`}>
          <Button 
            variant="ghost" 
            className="w-full justify-between group-hover:bg-secondary"
          >
            Open Workspace
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
