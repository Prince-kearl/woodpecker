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
  Camera
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

  // Profile state
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    bio: "Knowledge enthusiast and lifelong learner.",
    organization: "Acme Corp",
  });

  // Workspace preferences
  const [workspacePrefs, setWorkspacePrefs] = useState({
    defaultMode: "study",
    autoSaveEnabled: true,
    showSourcePreviews: true,
    compactView: false,
    defaultWorkspace: "",
  });

  // Retrieval configuration
  const [retrievalConfig, setRetrievalConfig] = useState({
    topK: 5,
    similarityThreshold: 0.7,
    hybridSearchEnabled: true,
    keywordWeight: 0.3,
    rerankerEnabled: false,
    maxContextLength: 4000,
    chunkOverlap: 200,
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailDigest: true,
    processingComplete: true,
    weeklyInsights: false,
    systemUpdates: true,
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: "dark",
    fontSize: "medium",
    animationsEnabled: true,
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border p-1 h-auto flex-wrap gap-1">
            {settingsTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
              
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {profile.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={profile.organization}
                    onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="bg-background/50 min-h-[100px]"
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
              className="glass rounded-xl p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold text-foreground">Workspace Preferences</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Default Assistant Mode</Label>
                  <Select
                    value={workspacePrefs.defaultMode}
                    onValueChange={(value) => setWorkspacePrefs({ ...workspacePrefs, defaultMode: value })}
                  >
                    <SelectTrigger className="bg-background/50">
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
                  <div>
                    <Label className="text-base">Auto-save Conversations</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save chat history for each workspace
                    </p>
                  </div>
                  <Switch
                    checked={workspacePrefs.autoSaveEnabled}
                    onCheckedChange={(checked) => 
                      setWorkspacePrefs({ ...workspacePrefs, autoSaveEnabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <Label className="text-base">Show Source Previews</Label>
                    <p className="text-sm text-muted-foreground">
                      Display document previews in source citations
                    </p>
                  </div>
                  <Switch
                    checked={workspacePrefs.showSourcePreviews}
                    onCheckedChange={(checked) => 
                      setWorkspacePrefs({ ...workspacePrefs, showSourcePreviews: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base">Compact View</Label>
                    <p className="text-sm text-muted-foreground">
                      Use a more compact layout for workspace lists
                    </p>
                  </div>
                  <Switch
                    checked={workspacePrefs.compactView}
                    onCheckedChange={(checked) => 
                      setWorkspacePrefs({ ...workspacePrefs, compactView: checked })
                    }
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
              className="glass rounded-xl p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold text-foreground">Retrieval Configuration</h2>
              <p className="text-muted-foreground">
                Fine-tune how the RAG system retrieves and processes information
              </p>

              <div className="space-y-8">
                {/* Top-K Results */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Top-K Results</Label>
                      <p className="text-sm text-muted-foreground">
                        Number of relevant chunks to retrieve per query
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary">{retrievalConfig.topK}</span>
                  </div>
                  <Slider
                    value={[retrievalConfig.topK]}
                    onValueChange={([value]) => 
                      setRetrievalConfig({ ...retrievalConfig, topK: value })
                    }
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Similarity Threshold */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Similarity Threshold</Label>
                      <p className="text-sm text-muted-foreground">
                        Minimum similarity score for retrieved results
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary">
                      {(retrievalConfig.similarityThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[retrievalConfig.similarityThreshold * 100]}
                    onValueChange={([value]) => 
                      setRetrievalConfig({ ...retrievalConfig, similarityThreshold: value / 100 })
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Max Context Length */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Max Context Length</Label>
                      <p className="text-sm text-muted-foreground">
                        Maximum tokens to include in context window
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary">
                      {retrievalConfig.maxContextLength.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={[retrievalConfig.maxContextLength]}
                    onValueChange={([value]) => 
                      setRetrievalConfig({ ...retrievalConfig, maxContextLength: value })
                    }
                    min={1000}
                    max={16000}
                    step={500}
                    className="w-full"
                  />
                </div>

                {/* Hybrid Search Toggle */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <Label className="text-base">Hybrid Search</Label>
                    <p className="text-sm text-muted-foreground">
                      Combine vector and keyword search for better results
                    </p>
                  </div>
                  <Switch
                    checked={retrievalConfig.hybridSearchEnabled}
                    onCheckedChange={(checked) => 
                      setRetrievalConfig({ ...retrievalConfig, hybridSearchEnabled: checked })
                    }
                  />
                </div>

                {/* Keyword Weight - Only shown when hybrid search is enabled */}
                {retrievalConfig.hybridSearchEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pl-4 border-l-2 border-primary/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Keyword Weight</Label>
                        <p className="text-sm text-muted-foreground">
                          Balance between keyword and semantic search
                        </p>
                      </div>
                      <span className="text-lg font-semibold text-primary">
                        {(retrievalConfig.keywordWeight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={[retrievalConfig.keywordWeight * 100]}
                      onValueChange={([value]) => 
                        setRetrievalConfig({ ...retrievalConfig, keywordWeight: value / 100 })
                      }
                      min={0}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </motion.div>
                )}

                {/* Reranker Toggle */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base">Enable Reranker</Label>
                    <p className="text-sm text-muted-foreground">
                      Use a cross-encoder model to rerank results for higher accuracy
                    </p>
                  </div>
                  <Switch
                    checked={retrievalConfig.rerankerEnabled}
                    onCheckedChange={(checked) => 
                      setRetrievalConfig({ ...retrievalConfig, rerankerEnabled: checked })
                    }
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
              className="glass rounded-xl p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold text-foreground">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <Label className="text-base">Email Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a daily summary of your workspace activity
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailDigest}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, emailDigest: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <Label className="text-base">Processing Complete</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when document processing finishes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.processingComplete}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, processingComplete: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <Label className="text-base">Weekly Insights</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly analytics about your knowledge usage
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyInsights}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, weeklyInsights: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base">System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Important platform updates and announcements
                    </p>
                  </div>
                  <Switch
                    checked={notifications.systemUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, systemUpdates: checked })
                    }
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
              className="glass rounded-xl p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold text-foreground">Appearance</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={appearance.theme}
                    onValueChange={(value) => setAppearance({ ...appearance, theme: value })}
                  >
                    <SelectTrigger className="bg-background/50">
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
                  <Label>Font Size</Label>
                  <Select
                    value={appearance.fontSize}
                    onValueChange={(value) => setAppearance({ ...appearance, fontSize: value })}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="text-base">Enable Animations</Label>
                    <p className="text-sm text-muted-foreground">
                      Show smooth transitions and animations
                    </p>
                  </div>
                  <Switch
                    checked={appearance.animationsEnabled}
                    onCheckedChange={(checked) => 
                      setAppearance({ ...appearance, animationsEnabled: checked })
                    }
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
              className="glass rounded-xl p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold text-foreground">Security Settings</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    className="bg-background/50"
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      className="bg-background/50"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="bg-background/50"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <Button variant="outline" className="w-full md:w-auto">
                  Update Password
                </Button>

                <div className="pt-6 border-t border-border space-y-4">
                  <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>

                <div className="pt-6 border-t border-border space-y-4">
                  <h3 className="font-medium text-destructive">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end mt-8"
        >
          <Button variant="glow" size="lg" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
