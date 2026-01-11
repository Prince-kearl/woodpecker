import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

const mockWorkspaces = [
  { id: "1", name: "ML Research Papers", color: "#00d4aa" },
  { id: "2", name: "Company Policies", color: "#a855f7" },
  { id: "3", name: "Exam Prep - CS201", color: "#f59e0b" },
];

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar workspaces={mockWorkspaces} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
