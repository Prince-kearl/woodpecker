import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "study" | "exam" | "retrieval" | "institutional";

interface ModeSelectorProps {
  selected: Mode;
  onChange: (mode: Mode) => void;
}

const modes = [
  { 
    id: "study" as Mode, 
    icon: BookOpen, 
    label: "Study Helper", 
    description: "Explanations & summaries",
    color: "var(--mode-study)",
  },
  { 
    id: "exam" as Mode, 
    icon: GraduationCap, 
    label: "Exam Prep", 
    description: "Quizzes & flashcards",
    color: "var(--mode-exam)",
  },
  { 
    id: "retrieval" as Mode, 
    icon: Search, 
    label: "Info Retrieval", 
    description: "Facts & citations",
    color: "var(--mode-retrieval)",
  },
  { 
    id: "institutional" as Mode, 
    icon: Building2, 
    label: "Institutional", 
    description: "Policies & SOPs",
    color: "var(--mode-institutional)",
  },
];

export function ModeSelector({ selected, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {modes.map((mode) => {
        const isSelected = selected === mode.id;
        return (
          <motion.button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative p-4 rounded-xl text-left transition-all",
              isSelected 
                ? "glass border-2" 
                : "bg-secondary/50 hover:bg-secondary border-2 border-transparent"
            )}
            style={{
              borderColor: isSelected ? `hsl(${mode.color})` : undefined,
            }}
          >
            <mode.icon 
              className="w-5 h-5 mb-2" 
              style={{ color: isSelected ? `hsl(${mode.color})` : undefined }}
            />
            <p className={cn(
              "font-medium text-sm",
              isSelected ? "text-foreground" : "text-muted-foreground"
            )}>
              {mode.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode.description}
            </p>
            
            {isSelected && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute inset-0 rounded-xl"
                style={{
                  boxShadow: `0 0 30px hsl(${mode.color} / 0.2)`,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
