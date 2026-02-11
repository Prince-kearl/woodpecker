import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Globe, 
  Link as LinkIcon,
  X,
  Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SourceCard } from "@/components/knowledge/SourceCard";
import { FileUploadZone } from "@/components/upload/FileUploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type KnowledgeSource = Database["public"]["Tables"]["knowledge_sources"]["Row"];

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
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawlSubpages, setCrawlSubpages] = useState(false);
  const [followSitemap, setFollowSitemap] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);

  const fetchSources = useCallback(async () => {
    const { data, error } = await supabase
      .from("knowledge_sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSources(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSources();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("knowledge-sources-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "knowledge_sources",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSources((prev) => [payload.new as KnowledgeSource, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setSources((prev) =>
              prev.map((s) =>
                s.id === (payload.new as KnowledgeSource).id
                  ? (payload.new as KnowledgeSource)
                  : s
              )
            );
          } else if (payload.eventType === "DELETE") {
            setSources((prev) =>
              prev.filter((s) => s.id !== (payload.old as KnowledgeSource).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSources]);

  const filteredSources = sources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilesUploaded = (sourceIds: string[]) => {
    console.log("Sources created:", sourceIds);
    setShowUploadModal(false);
  };

  const handleWebsiteSubmit = async () => {
    if (!websiteUrl.trim()) return;
    
    setIsIngesting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to add sources");
      }

      const { data, error } = await supabase.functions.invoke("ingest-website", {
        body: {
          url: websiteUrl,
          crawlSubpages,
          followSitemap,
          userId: user.id,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Website ingested successfully",
          description: `Created ${data.chunkCount} chunks from ${data.pageCount} page(s).`,
        });
      } else {
        throw new Error(data?.error || "Ingestion failed");
      }
    } catch (error) {
      console.error("Website ingestion error:", error);
      toast({
        title: "Ingestion failed",
        description: error instanceof Error ? error.message : "Failed to ingest website",
        variant: "destructive",
      });
    } finally {
      setIsIngesting(false);
      setWebsiteUrl("");
      setCrawlSubpages(false);
      setFollowSitemap(false);
      setShowUploadModal(false);
    }
  };

  const handleLinkSubmit = async () => {
    if (!linkUrl.trim()) return;
    
    setIsIngesting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to add sources");
      }

      const { data, error } = await supabase.functions.invoke("ingest-website", {
        body: {
          url: linkUrl,
          crawlSubpages: false,
          followSitemap: false,
          userId: user.id,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Resource added successfully",
          description: `Created ${data.chunkCount} chunks.`,
        });
      } else {
        throw new Error(data?.error || "Failed to add resource");
      }
    } catch (error) {
      console.error("Link ingestion error:", error);
      toast({
        title: "Failed to add resource",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsIngesting(false);
      setLinkUrl("");
      setShowUploadModal(false);
    }
  };

  const stats = [
    { label: "Total Sources", value: sources.length },
    { label: "Ready", value: sources.filter(s => s.status === "ready").length },
    { label: "Processing", value: sources.filter(s => s.status === "processing" || s.status === "pending").length },
    { label: "Total Chunks", value: sources.reduce((sum, s) => sum + s.chunk_count, 0).toLocaleString() },
  ];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Knowledge Library</h1>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
              onClick={() => setShowUploadModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl glass rounded-2xl p-6 relative"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4"
                  onClick={() => setShowUploadModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>

                <h2 className="text-2xl font-bold text-foreground mb-6">Add Knowledge</h2>

                <Tabs value={uploadTab} onValueChange={setUploadTab}>
                  <TabsList className="grid grid-cols-3 mb-6">
                    {uploadTabs.map((tab) => (
                      <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
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
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="crawl-subpages"
                            checked={crawlSubpages}
                            onChange={(e) => setCrawlSubpages(e.target.checked)}
                            className="rounded border-border"
                          />
                          <Label htmlFor="crawl-subpages" className="text-sm font-normal">
                            Crawl subpages
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="follow-sitemap"
                            checked={followSitemap}
                            onChange={(e) => setFollowSitemap(e.target.checked)}
                            className="rounded border-border"
                          />
                          <Label htmlFor="follow-sitemap" className="text-sm font-normal">
                            Follow sitemap
                          </Label>
                        </div>
                      </div>

                      <Button 
                        variant="glow" 
                        onClick={handleWebsiteSubmit}
                        disabled={!websiteUrl.trim() || isIngesting}
                      >
                        {isIngesting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Ingesting...
                          </>
                        ) : (
                          "Start Ingestion"
                        )}
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
                        disabled={!linkUrl.trim() || isIngesting}
                      >
                        {isIngesting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Resource"
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
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
          {stats.map((stat) => (
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
          className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6"
        >
          <div className="relative flex-1 min-w-[200px] max-w-md">
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredSources.map((source, index) => (
              <SourceCard 
                key={source.id} 
                id={source.id}
                name={source.name}
                sourceType={source.source_type}
                status={source.status}
                chunks={source.chunk_count}
                updatedAt={source.updated_at}
                createdAt={source.created_at}
                fileSize={source.file_size}
                originalUrl={source.original_url}
                mimeType={source.mime_type}
                errorMessage={source.error_message}
                delay={0.2 + index * 0.03} 
              />
            ))}
          </div>
        )}

        {!loading && filteredSources.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">
              {sources.length === 0 
                ? "No sources yet. Upload some documents to get started." 
                : "No sources found matching your search."}
            </p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
