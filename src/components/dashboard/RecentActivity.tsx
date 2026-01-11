import { motion } from "framer-motion";
import { FileUp, MessageSquare, RefreshCw, Check } from "lucide-react";

interface Activity {
  id: string;
  type: "upload" | "query" | "update" | "complete";
  title: string;
  workspace?: string;
  timestamp: string;
}

const activities: Activity[] = [
  { id: "1", type: "query", title: "Asked about neural network architectures", workspace: "ML Research Papers", timestamp: "2 min ago" },
  { id: "2", type: "upload", title: "Uploaded 'Deep Learning Foundations.pdf'", timestamp: "15 min ago" },
  { id: "3", type: "complete", title: "Finished indexing 12 documents", workspace: "Company Policies", timestamp: "1 hour ago" },
  { id: "4", type: "update", title: "Updated sources for Exam Prep workspace", timestamp: "3 hours ago" },
  { id: "5", type: "query", title: "Retrieved policy information", workspace: "Company Policies", timestamp: "5 hours ago" },
];

const iconMap = {
  upload: FileUp,
  query: MessageSquare,
  update: RefreshCw,
  complete: Check,
};

const colorMap = {
  upload: "text-primary",
  query: "text-accent",
  update: "text-warning",
  complete: "text-success",
};

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className={`p-2 rounded-lg bg-secondary ${colorMap[activity.type]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{activity.title}</p>
                {activity.workspace && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    in {activity.workspace}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.timestamp}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
