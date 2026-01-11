import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Globe, 
  Table2, 
  BookOpen,
  Plus,
  Link as LinkIcon
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SourceCard } from "@/components/knowledge/SourceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sources = [
  {
    id: "1",
    name: "Attention Is All You Need.pdf",
    type: "pdf" as const,
    status: "ready" as const,
    chunks: 48,
    lastUpdated: "2 days ago",
    workspaces: ["ML Research Papers"],
  },
  {
    id: "2",
    name: "Employee Handbook 2024.docx",
    type: "docx" as const,
    status: "ready" as const,
    chunks: 156,
    lastUpdated: "1 week ago",
    workspaces: ["Company Policies", "HR Documentation"],
  },
  {
    id: "3",
    name: "https://react.dev/learn",
    type: "web" as const,
    status: "processing" as const,
    chunks: 0,
    lastUpdated: "Processing...",
    workspaces: [],
  },
  {
    id: "4",
    name: "Q4 Financial Report.xlsx",
    type: "spreadsheet" as const,
    status: "ready" as const,
    chunks: 89,
    lastUpdated: "3 days ago",
    workspaces: ["Financial Analysis"],
  },
  {
    id: "5",
    name: "Deep Learning - Ian Goodfellow.epub",
    type: "epub" as const,
    status: "ready" as const,
    chunks: 1247,
    lastUpdated: "2 weeks ago",
    workspaces: ["ML Research Papers", "CS201 Exam Prep"],
  },
  {
    id: "6",
    name: "API Documentation v3.pdf",
    type: "pdf" as const,
    status: "error" as const,
    chunks: 0,
    lastUpdated: "Failed",
    workspaces: [],
  },
];

const uploadOptions = [
  { icon: FileText, label: "Document", description: "PDF, DOCX, TXT" },
  { icon: Table2, label: "Spreadsheet", description: "Excel, CSV" },
  { icon: BookOpen, label: "Book", description: "EPUB format" },
  { icon: Globe, label: "Website", description: "URL or sitemap" },
  { icon: LinkIcon, label: "Link", description: "Online resources" },
];

export default function Knowledge() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filteredSources = sources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Knowledge Library</h1>
            <p className="text-muted-foreground mt-1">
              Manage your ingested documents and data sources
            </p>
          </div>
          <Button 
            variant="glow" 
            size="lg"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Content
          </Button>
        </motion.div>

        {/* Upload Options */}
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Add Knowledge Source</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {uploadOptions.map((option) => (
                <motion.button
                  key={option.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <option.icon className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: "Total Sources", value: sources.length },
            { label: "Ready", value: sources.filter(s => s.status === "ready").length },
            { label: "Processing", value: sources.filter(s => s.status === "processing").length },
            { label: "Total Chunks", value: sources.reduce((sum, s) => sum + s.chunks, 0).toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-lg p-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-4 mb-6"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Sources List */}
        <div className="grid gap-3">
          {filteredSources.map((source, index) => (
            <SourceCard key={source.id} {...source} delay={0.2 + index * 0.03} />
          ))}
        </div>

        {filteredSources.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No sources found matching your search.</p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
