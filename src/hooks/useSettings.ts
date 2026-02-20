import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserSettings {
  // Profile
  name: string;
  email: string;
  bio?: string;
  organization?: string;

  // Workspace preferences
  defaultMode: "study" | "exam" | "retrieval" | "institutional";
  autoSaveEnabled: boolean;
  showSourcePreviews: boolean;
  compactView: boolean;

  // Retrieval configuration
  topK: number;
  similarityThreshold: number;
  hybridSearchEnabled: boolean;
  keywordWeight: number;
  rerankerEnabled: boolean;
  maxContextLength: number;
  chunkOverlap: number;

  // Notifications
  emailDigest: boolean;
  processingComplete: boolean;
  weeklyInsights: boolean;
  systemUpdates: boolean;

  // Appearance
  theme: "dark" | "light" | "system";
  fontSize: "small" | "medium" | "large";
  animationsEnabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  name: "",
  email: "",
  bio: "",
  organization: "",
  defaultMode: "study",
  autoSaveEnabled: true,
  showSourcePreviews: true,
  compactView: false,
  topK: 5,
  similarityThreshold: 0.7,
  hybridSearchEnabled: true,
  keywordWeight: 0.3,
  rerankerEnabled: false,
  maxContextLength: 4000,
  chunkOverlap: 200,
  emailDigest: true,
  processingComplete: true,
  weeklyInsights: false,
  systemUpdates: true,
  theme: "dark",
  fontSize: "medium",
  animationsEnabled: true,
};

const STORAGE_KEY = "woodpecker_settings";

interface UseSettingsReturn {
  settings: UserSettings;
  originalSettings: UserSettings;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  saveSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  saveAllSettings: () => Promise<void>;
  resetSettings: () => void;
  hasChanges: boolean;
}

export function useSettings(): UseSettingsReturn {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount and when user changes
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load from localStorage first
        const stored = localStorage.getItem(STORAGE_KEY);
        const localSettings = stored ? JSON.parse(stored) : {};

        // Load user profile from auth
        const userSettings: UserSettings = {
          ...DEFAULT_SETTINGS,
          ...localSettings,
        };

        if (user) {
          userSettings.email = user.email || "";
          const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "";
          userSettings.name = displayName;
        }

        setSettings(userSettings);
        setOriginalSettings(userSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
        setSettings(DEFAULT_SETTINGS);
        setOriginalSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
      setError(null);
    },
    []
  );

  const validateSettings = (toValidate: Partial<UserSettings>): string | null => {
    if (toValidate.name !== undefined && !toValidate.name.trim()) {
      return "Name is required";
    }
    if (toValidate.email !== undefined && !toValidate.email.includes("@")) {
      return "Invalid email format";
    }
    if (toValidate.topK !== undefined && (toValidate.topK < 1 || toValidate.topK > 20)) {
      return "Top-K must be between 1 and 20";
    }
    if (
      toValidate.similarityThreshold !== undefined &&
      (toValidate.similarityThreshold < 0 || toValidate.similarityThreshold > 1)
    ) {
      return "Similarity threshold must be between 0 and 1";
    }
    if (
      toValidate.maxContextLength !== undefined &&
      (toValidate.maxContextLength < 1000 || toValidate.maxContextLength > 16000)
    ) {
      return "Max context length must be between 1000 and 16000";
    }
    return null;
  };

  const saveSetting = useCallback(
    async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      const validationError = validateSettings({ [key]: value });
      if (validationError) {
        setError(validationError);
        return;
      }

      setSaving(true);
      setError(null);
      try {
        const newSettings = { ...settings, [key]: value };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
        setOriginalSettings(newSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save setting");
      } finally {
        setSaving(false);
      }
    },
    [settings]
  );

  const saveAllSettings = useCallback(async () => {
    const validationError = validateSettings(settings);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setOriginalSettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const resetSettings = useCallback(() => {
    setSettings(originalSettings);
    setError(null);
  }, [originalSettings]);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  return {
    settings,
    originalSettings,
    loading,
    saving,
    error,
    updateSetting,
    saveSetting,
    saveAllSettings,
    resetSettings,
    hasChanges,
  };
}
