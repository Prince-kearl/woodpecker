import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

function isLovableDomain(): boolean {
  const hostname = window.location.hostname;
  return hostname.includes("lovable.app") || hostname.includes("lovableproject.com");
}

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (isLovableDomain()) {
    // Use Lovable's managed OAuth bridge
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    return { error: result.error ?? null };
  }

  // On custom domains (Vercel, etc.), use direct Supabase OAuth
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      skipBrowserRedirect: true,
    },
  });

  if (error) return { error };

  if (data?.url) {
    const oauthUrl = new URL(data.url);
    const allowedHosts = ["accounts.google.com"];
    if (!allowedHosts.some((host) => oauthUrl.hostname === host)) {
      return { error: new Error("Invalid OAuth redirect URL") };
    }
    window.location.href = data.url;
  }

  return { error: null };
}
