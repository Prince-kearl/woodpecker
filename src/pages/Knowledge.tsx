import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Globe, 
  Table2, 
  BookOpen,
  Link as LinkIcon,
  X
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SourceCard } from "@/components/knowledge/SourceCard";
import { FileUploadZone } from "@/components/upload/FileUploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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

const uploadTabs = [
  { id: "files", label: "Files", icon: FileText },
  { id: "website", label: "Website", icon: Globe },
  { id: "link", label: "Link", icon: LinkIcon },
];

export default function Knowledge() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTab, setUploadTab] = useState("files");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const filteredSources = sources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilesUploaded = (files: File[]) => {
    console.log("Files uploaded:", files);
  };

  const handleWebsiteSubmit = () => {
    if (!websiteUrl.trim()) return;
    toast({
      title: "Website queued for ingestion",
      description: `${websiteUrl} will be processed shortly.`,
    });
    setWebsiteUrl("");
    setShowUploadModal(false);
  };

  const handleLinkSubmit = () => {
    if (!linkUrl.trim()) return;
    toast({
      title: "Link added",
      description: `${linkUrl} will be processed shortly.`,
    });
    setLinkUrl("");
    setShowUploadModal(false);
  };

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

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass rounded-xl p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Add Knowledge Source</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowUploadModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Tabs value={uploadTab} onValueChange={setUploadTab}>
                <TabsList className="mb-6 bg-secondary/50">
                  {uploadTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="files" className="mt-0">
                  <FileUploadZone onFilesUploaded={handleFilesUploaded} />
                </TabsContent>

                <TabsContent value="website" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
                      <Globe className="w-10 h-10 text-primary" />
                      <div>
                        <h4 className="font-medium text-foreground">Ingest Website</h4>
                        <p className="text-sm text-muted-foreground">
                          Crawl and ingest content from a website URL or sitemap
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website-url">Website URL</Label>
                      <Input
                        id="website-url"
                        type="url"
                        placeholder="https://example.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="bg-background/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the root URL to crawl the entire site, or a specific page URL
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="crawl-subpages" 
                          className="rounded border-border bg-background"
                        />
                        <Label htmlFor="crawl-subpages" className="text-sm font-normal">
                          Crawl subpages
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="follow-sitemap" 
                          className="rounded border-border bg-background"
                        />
                        <Label htmlFor="follow-sitemap" className="text-sm font-normal">
                          Follow sitemap
                        </Label>
                      </div>
                    </div>

                    <Button 
                      variant="glow" 
                      onClick={handleWebsiteSubmit}
                      disabled={!websiteUrl.trim()}
                    >
                      Start Ingestion
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="link" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
                      <LinkIcon className="w-10 h-10 text-primary" />
                      <div>
                        <h4 className="font-medium text-foreground">Add Online Resource</h4>
                        <p className="text-sm text-muted-foreground">
                          Link to online documents, articles, or resources
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resource-link">Resource URL</Label>
                      <Input
                        id="resource-link"
                        type="url"
                        placeholder="https://example.com/document.pdf"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="bg-background/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Supports PDF, Word documents, and other online resources
                      </p>
                    </div>

                    <Button 
                      variant="glow" 
                      onClick={handleLinkSubmit}
                      disabled={!linkUrl.trim()}
                    >
                      Add Resource
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

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
