import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Sliders, 
  Database, 
  Bell, 
  Shield, 
  Palette,
  Save,
  Camera,
  AlertCircle,
  Check,
  RotateCcw,
  Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

const settingsTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Sliders },
  { id: "retrieval", label: "Retrieval", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
];

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const { 
    settings, 
    loading, 
    saving, 
    error, 
    updateSetting, 
    saveSetting,
    saveAllSettings, 
    resetSettings, 
    hasChanges 
  } = useSettings();

  const handleSave = async () => {
    try {
      await saveAllSettings();
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error saving settings",
        description: error || "An error occurred while saving your settings.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to discard unsaved changes?")) {
      resetSettings();
      toast({
        title: "Changes discarded",
        description: "Settings have been reset to their last saved values.",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your account, preferences, and platform configuration
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-destructive/10 rounded-lg border border-destructive/30 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border p-1 h-auto flex-wrap gap-1 w-full justify-start">
            {settingsTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                )}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4 sm:p-6 space-y-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Profile Information</h2>
              
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {settings.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <button 
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
                    aria-label="Upload avatar"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate">{settings.name || "Your Name"}</h3>
                  <p className="text-sm text-muted-foreground truncate">{settings.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Full Name *</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => updateSetting("name", e.target.value)}
                    className="bg-background/50"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    disabled
                    className="bg-background/50 opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="organization" className="text-sm">Organization</Label>
                  <Input
                    id="organization"
                    value={settings.organization || ""}
                    onChange={(e) => updateSetting("organization", e.target.value)}
                    className="bg-background/50"
                    placeholder="Your Company"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm">Bio</Label>
                <Textarea
                  id="bio"
                  value={settings.bio || ""}
                  onChange={(e) => updateSetting("bio", e.target.value)}
                  className="bg-background/50 min-h-[100px] text-sm"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </motion.div>
          </TabsContent>

          {/* Workspace Preferences Tab */}
          <TabsContent value="workspace" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4 sm:p-6 space-y-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Workspace Preferences</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm">Default Assistant Mode</Label>
                  <Select
                    value={settings.defaultMode}
                    onValueChange={(value) => updateSetting("defaultMode", value as any)}
                  >
                    <SelectTrigger className="bg-background/50 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="study">Study Helper</SelectItem>
                      <SelectItem value="exam">Exam Prep</SelectItem>
                      <SelectItem value="retrieval">Information Retrieval</SelectItem>
                      <SelectItem value="institutional">Institutional Knowledge</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This mode will be selected by default when creating new workspaces
                  </p>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Auto-save Conversations</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically save chat history for each workspace
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoSaveEnabled}
                    onCheckedChange={(checked) => 
                      updateSetting("autoSaveEnabled", checked)
                    }
                    className="ml-4 flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Show Source Previews</Label>
                    <p className="text-xs text-muted-foreground">
                      Display document previews in source citations
                    </p>
                  </div>
                  <Switch
                    checked={settings.showSourcePreviews}
                    onCheckedChange={(checked) => 
                      updateSetting("showSourcePreviews", checked)
                    }
                    className="ml-4 flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Compact View</Label>
                    <p className="text-xs text-muted-foreground">
                      Use a more compact layout for workspace lists
                    </p>
                  </div>
                  <Switch
                    checked={settings.compactView}
                    onCheckedChange={(checked) => 
                      updateSetting("compactView", checked)
                    }
                    className="ml-4 flex-shrink-0"
                  />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Retrieval Configuration Tab */}
          <TabsContent value="retrieval" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4 sm:p-6 space-y-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Retrieval Configuration</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Fine-tune how the RAG system retrieves and processes information
              </p>

              <div className="space-y-6 sm:space-y-8">
                {/* Top-K Results */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Top-K Results</Label>
                      <p className="text-xs text-muted-foreground">
                        Number of relevant chunks to retrieve per query
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary">{settings.topK}</span>
                  </div>
                  <Slider
                    value={[settings.topK]}
                    onValueChange={([value]) => 
                      updateSetting("topK", value)
                    }
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Similarity Threshold */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Similarity Threshold</Label>
                      <p className="text-xs text-muted-foreground">
                        Minimum similarity score for retrieved results
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary">
                      {(settings.similarityThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.similarityThreshold * 100]}
                    onValueChange={([value]) => 
                      updateSetting("similarityThreshold", value / 100)
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Max Context Length */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Max Context Length</Label>
                      <p className="text-xs text-muted-foreground">
                        Maximum tokens to include in context window
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary">
                      {settings.maxContextLength.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={[settings.maxContextLength]}
                    onValueChange={([value]) => 
                      updateSetting("maxContextLength", value)
                    }
                    min={1000}
                    max={16000}
                    step={500}
                    className="w-full"
                  />
                </div>

                {/* Hybrid Search Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-border gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Hybrid Search</Label>
                    <p className="text-xs text-muted-foreground">
                      Combine vector and keyword search for better results
                    </p>
                  </div>
                  <Switch
                    checked={settings.hybridSearchEnabled}
                    onCheckedChange={(checked) => 
                      updateSetting("hybridSearchEnabled", checked)
                    }
                    className="flex-shrink-0"
                  />
                </div>

                {/* Keyword Weight - Only shown when hybrid search is enabled */}
                {settings.hybridSearchEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pl-4 border-l-2 border-primary/30"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Keyword Weight</Label>
                        <p className="text-xs text-muted-foreground">
                          Balance between keyword and semantic search
                        </p>
                      </div>
                      <span className="text-lg font-semibold text-primary">
                        {(settings.keywordWeight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={[settings.keywordWeight * 100]}
                      onValueChange={([value]) => 
                        updateSetting("keywordWeight", value / 100)
                      }
                      min={0}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </motion.div>
                )}

                {/* Reranker Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Enable Reranker</Label>
                    <p className="text-xs text-muted-foreground">
                      Use a cross-encoder model to rerank results for higher accuracy
                    </p>
                  </div>
                  <Switch
                    checked={settings.rerankerEnabled}
                    onCheckedChange={(checked) => 
                      updateSetting("rerankerEnabled", checked)
                    }
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4 sm:p-6 space-y-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-border gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Email Digest</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive a daily summary of your workspace activity
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailDigest}
                    onCheckedChange={(checked) => 
                      updateSetting("emailDigest", checked)
                    }
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-border gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Processing Complete</Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when document processing finishes
                    </p>
                  </div>
                  <Switch
                    checked={settings.processingComplete}
                    onCheckedChange={(checked) => 
                      updateSetting("processingComplete", checked)
                    }
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-border gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Weekly Insights</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive weekly analytics about your knowledge usage
                    </p>
                  </div>
                  <Switch
                    checked={settings.weeklyInsights}
                    onCheckedChange={(checked) => 
                      updateSetting("weeklyInsights", checked)
                    }
                    className="flex-shrink-0"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">System Updates</Label>
                    <p className="text-xs text-muted-foreground">
                      Important platform updates and announcements
                    </p>
                  </div>
                  <Switch
                    checked={settings.systemUpdates}
                    onCheckedChange={(checked) => 
                      updateSetting("systemUpdates", checked)
                    }
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4 sm:p-6 space-y-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Appearance</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm">Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => updateSetting("theme", value as any)}
                  >
                    <SelectTrigger className="bg-background/50 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Font Size</Label>
                  <Select
                    value={settings.fontSize}
                    onValueChange={(value) => updateSetting("fontSize", value as any)}
                  >
                    <SelectTrigger className="bg-background/50 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Enable Animations</Label>
                    <p className="text-xs text-muted-foreground">
                      Show smooth transitions and animations
                    </p>
                  </div>
                  <Switch
                    checked={settings.animationsEnabled}
                    onCheckedChange={(checked) => 
                      updateSetting("animationsEnabled", checked)
                    }
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4 sm:p-6 space-y-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Security Settings</h2>

              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                    💡 For security reasons, password changes and two-factor authentication must be configured through your email verification.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Email Address</Label>
                  <Input
                    type="email"
                    value={settings.email}
                    disabled
                    className="bg-background/50 opacity-50 cursor-not-allowed text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your verified email address associated with this account
                  </p>
                </div>

                <div className="pt-6 border-t border-border space-y-4">
                  <h3 className="font-medium text-foreground text-sm">Two-Factor Authentication</h3>
                  <p className="text-xs text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline" disabled className="w-full sm:w-auto text-sm">
                    Enable 2FA (Coming Soon)
                  </Button>
                </div>

                <div className="pt-6 border-t border-border space-y-4">
                  <h3 className="font-medium text-destructive text-sm">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                  <Button variant="destructive" disabled className="w-full sm:w-auto text-sm">
                    Delete Account (Contact Support)
                  </Button>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Save/Reset Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8 pt-6 border-t border-border"
        >
          <div className="flex-1">
            {hasChanges && (
              <p className="text-xs text-muted-foreground">
                You have unsaved changes
              </p>
            )}
            {!hasChanges && !saving && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                All changes saved
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="flex-1 sm:flex-initial"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Discard
            </Button>
            <Button 
              variant="glow" 
              size="lg" 
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex-1 sm:flex-initial"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">Saving</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
