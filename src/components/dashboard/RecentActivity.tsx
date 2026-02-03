import { motion } from "framer-motion";
import { FileUp, MessageSquare, RefreshCw, Check, Loader2 } from "lucide-react";
import { useRecentActivity, type Activity } from "@/hooks/useRecentActivity";

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
  const { data: activities = [], isLoading } = useRecentActivity();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recent activity
        </p>
      ) : (
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
      )}
    </motion.div>
  );
}
