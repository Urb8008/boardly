"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WALLPAPER_OPTIONS } from "@/lib/preferences/options";

type FontColor = "dark" | "slate" | "white" | "blue" | "indigo" | "purple" | "cyan" | "teal" | "green" | "lime" | "amber" | "orange" | "rose" | "pink";

const FONT_COLORS: Record<FontColor, string> = {
  dark: "#0f172a",
  slate: "#334155",
  white: "#f8fafc",
  blue: "#1d4ed8",
  indigo: "#4338ca",
  purple: "#7e22ce",
  cyan: "#0891b2",
  teal: "#0f766e",
  green: "#15803d",
  lime: "#4d7c0f",
  amber: "#b45309",
  orange: "#c2410c",
  rose: "#be123c",
  pink: "#be185d",
};

const FONT_PREFERENCE_CSS = `
  .touchbase-font-preferences .text-slate-950,
  .touchbase-font-preferences .text-slate-900,
  .touchbase-font-preferences .text-slate-800,
  .touchbase-font-preferences .text-slate-700,
  .touchbase-font-preferences .text-slate-600,
  .touchbase-font-preferences .text-slate-500,
  .touchbase-font-preferences .text-slate-400 {
    color: var(--tb-font-color) !important;
  }

  .touchbase-font-preferences .text-xs {
    font-size: calc(0.75rem * var(--tb-font-scale));
  }

  .touchbase-font-preferences .text-sm {
    font-size: calc(0.875rem * var(--tb-font-scale));
  }

  .touchbase-font-preferences .text-base {
    font-size: calc(1rem * var(--tb-font-scale));
  }

  .touchbase-font-preferences .text-lg {
    font-size: calc(1.125rem * var(--tb-font-scale));
  }

  .touchbase-font-preferences .text-xl {
    font-size: calc(1.25rem * var(--tb-font-scale));
  }

  .touchbase-font-preferences .text-2xl {
    font-size: calc(1.5rem * var(--tb-font-scale));
  }

  .touchbase-font-preferences .text-3xl {
    font-size: calc(1.875rem * var(--tb-font-scale));
  }

  .touchbase-font-preferences .text-4xl {
    font-size: calc(2.25rem * var(--tb-font-scale));
  }
`;

const WALLPAPER_STYLES: Record<string, string> = {
  default:
    "linear-gradient(135deg, #f8fafc, #e2e8f0)",
  ocean:
    "linear-gradient(135deg, #0ea5e9, #1e3a8a)",
  forest:
    "linear-gradient(135deg, #15803d, #052e16)",
  sunset:
    "linear-gradient(135deg, #fb7185, #f97316, #7c3aed)",
  midnight:
    "linear-gradient(135deg, #0f172a, #312e81)",
};

function getPageWallpaperStyle(
  wallpaper: string
): React.CSSProperties {
  const natureWallpaper =
    WALLPAPER_OPTIONS.find(
      (option) =>
        option.id === wallpaper
    );

  if (natureWallpaper) {
    return {
      backgroundImage: `linear-gradient(
        rgba(248, 250, 252, 0.28),
        rgba(248, 250, 252, 0.28)
      ), url("${natureWallpaper.image}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
      backgroundColor: "#e2e8f0",
    };
  }

  return {
    backgroundImage:
      WALLPAPER_STYLES[wallpaper] ||
      WALLPAPER_STYLES.default,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  };
}



export default function AccountSettingsPage() {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState("");
  const activeUserIdRef = useRef<string | null>(null);
  const [wallpaper, setWallpaper] = useState("default");
  const [accentColor, setAccentColor] = useState("blue");
  const [tabColor, setTabColor] = useState("slate");
  const [panelOpacity, setPanelOpacity] = useState(50);
  const [fontColor, setFontColor] = useState<FontColor>("slate");
  const [fontSize, setFontSize] = useState(100);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState("");
  const [emailFeedback, setEmailFeedback] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [appearanceNotice, setAppearanceNotice] = useState("");
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [deletionFeedback, setDeletionFeedback] = useState("");
  const [deletionError, setDeletionError] = useState(false);

  useEffect(() => {
    let active = true;
    let requestVersion = 0;
    const supabase = createClient();

    async function showAccount(user: { id: string; email?: string } | null) {
      if (!active) return;

      if (!user) {
        requestVersion++;
        activeUserIdRef.current = null;
        setPasswordFeedback("");
        setEmailFeedback("");
        setDeletionFeedback("");
        setPassword("");
        setConfirmPassword("");
        setNewEmail("");
        router.replace("/auth/login?next=%2Fprotected%2Fsettings%2Faccount");
        return;
      }

      // Refresh preferences for returning users too; don't clear form messages
      // unless the actual authenticated user has changed.
      const switchedAccount = activeUserIdRef.current !== user.id;
      const version = ++requestVersion;
      activeUserIdRef.current = user.id;
      setCurrentEmail(user.email ?? "");
      if (switchedAccount) {
        setPassword("");
        setConfirmPassword("");
        setNewEmail("");
        setPasswordFeedback("");
        setEmailFeedback("");
        setPasswordError(false);
        setEmailError(false);
        setDeletionFeedback("");
        setDeletionError(false);
        setDeletionBusy(false);
        setPasswordBusy(false);
        setEmailBusy(false);
        setLoading(true);
      }
      setAppearanceNotice("");

      const { data: preferences, error } = await supabase
        .from("user_preferences")
        .select("wallpaper, accent_color, tab_color, panel_opacity, font_color, font_size")
        .eq("user_id", user.id)
        .maybeSingle();

      // An older account's preferences must never overwrite the new account.
      if (!active || version !== requestVersion || activeUserIdRef.current !== user.id) return;
      if (error) {
        console.error("Unable to load account appearance preferences", error);
        setAppearanceNotice("Couldn't load this account's appearance preferences. Check your connection and reopen the page.");
      } else {
        // Defaults are for users with no saved row, not shared global settings.
        setWallpaper(preferences?.wallpaper || "default");
        setAccentColor(preferences?.accent_color || "blue");
        setTabColor(preferences?.tab_color || "slate");
        setPanelOpacity(typeof preferences?.panel_opacity === "number" ? preferences.panel_opacity : 50);
        setFontColor(preferences?.font_color && preferences.font_color in FONT_COLORS ? preferences.font_color as FontColor : "slate");
        setFontSize(typeof preferences?.font_size === "number" ? preferences.font_size : 100);
        if (!preferences) {
          setAppearanceNotice("This account has no saved appearance preferences yet. Choose and save them in Preferences.");
        }
      }
      setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // Defer database work until after Supabase's auth callback completes.
        void Promise.resolve().then(() => showAccount(session?.user ?? null));
      }
    });

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        void showAccount(null);
      } else {
        void showAccount(data.user);
      }
    });

    // Reflect changes saved in Preferences in another tab or when returning
    // to this page. Refreshing never changes another user's saved settings.
    function refreshOnReturn() {
      if (document.visibilityState !== "visible") return;
      void supabase.auth.getUser().then(({ data, error }) => {
        if (!active) return;
        void showAccount(error ? null : data.user);
      });
    }
    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);

    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
      active = false;
      requestVersion++;
      subscription.unsubscribe();
    };
  }, [router]);

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordFeedback("");
    setPasswordError(false);
    if (password !== confirmPassword) {
      setPasswordError(true);
      setPasswordFeedback("The passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    const requestUserId = activeUserIdRef.current;
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (activeUserIdRef.current !== requestUserId) return;
    setPasswordBusy(false);
    if (error) {
      setPasswordError(true);
      setPasswordFeedback(error.message);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setPasswordFeedback("Your password has been updated.");
  }

  async function changeEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailFeedback("");
    setEmailError(false);
    const nextEmail = newEmail.trim().toLowerCase();
    if (!nextEmail || nextEmail === currentEmail.toLowerCase()) {
      setEmailError(true);
      setEmailFeedback("Enter a different email address.");
      return;
    }
    setEmailBusy(true);
    const requestUserId = activeUserIdRef.current;
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: nextEmail }, {
      emailRedirectTo: "https://touchbase.urbanenglish.es/protected/settings/account",
    });
    if (activeUserIdRef.current !== requestUserId) return;
    setEmailBusy(false);
    if (error) {
      setEmailError(true);
      setEmailFeedback(error.message);
      return;
    }
    setNewEmail("");
    setEmailFeedback("Email change requested. Follow the verification instructions sent by Supabase. Your login email changes only after the required confirmations are complete.");
  }

  async function requestAccountDeletion() {
    if (deletionBusy) return;
    const confirmed = window.confirm(
      "Send a request to delete your TouchBase account? This will notify the administrator. Your account and boards will NOT be deleted now."
    );
    if (!confirmed) return;

    setDeletionBusy(true);
    setDeletionFeedback("");
    setDeletionError(false);
    const requestUserId = activeUserIdRef.current;
    try {
      const response = await fetch("/api/request-account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({}),
      });
      const result: { error?: string } = await response.json();
      if (activeUserIdRef.current !== requestUserId) return;
      if (!response.ok) {
        setDeletionError(true);
        setDeletionFeedback(result.error || "Could not send your request. Please try again later.");
        return;
      }
      setDeletionFeedback("Your request has been sent to the administrator. Your account is still active until the request is reviewed.");
    } catch {
      if (activeUserIdRef.current !== requestUserId) return;
      setDeletionError(true);
      setDeletionFeedback("Could not send your request. Please check your connection and try again.");
    } finally {
      if (activeUserIdRef.current === requestUserId) setDeletionBusy(false);
    }
  }

  const accents: Record<string, string> = {
    blue: "#2563eb", purple: "#7c3aed", green: "#16a34a", orange: "#ea580c", pink: "#db2777",
    "blue-soft": "rgba(37, 99, 235, 0.72)", "purple-soft": "rgba(124, 58, 237, 0.72)",
    "green-soft": "rgba(22, 163, 74, 0.72)", "orange-soft": "rgba(234, 88, 12, 0.72)",
    "pink-soft": "rgba(219, 39, 119, 0.72)",
  };
  const tabs: Record<string, string> = {
    slate: "#475569", blue: "#2563eb", green: "#16a34a", amber: "#d97706", rose: "#e11d48",
    "slate-soft": "rgba(71, 85, 105, 0.72)", "blue-soft": "rgba(37, 99, 235, 0.72)",
    "green-soft": "rgba(22, 163, 74, 0.72)", "amber-soft": "rgba(217, 119, 6, 0.72)",
    "rose-soft": "rgba(225, 29, 72, 0.72)",
  };
  const accent = accents[accentColor] || accents.blue;
  const tab = tabs[tabColor] || tabs.slate;
  const panelAlpha = 0.12 + (Math.min(100, Math.max(0, panelOpacity)) / 100) * 0.7;
  const panelStyle: React.CSSProperties = { backgroundColor: `rgba(255, 255, 255, ${panelAlpha})` };
  const fontStyle = {
    "--tb-font-color": FONT_COLORS[fontColor],
    "--tb-font-scale": String(Math.min(130, Math.max(80, fontSize)) / 100),
  } as React.CSSProperties;
  const wallpaperStyle = getPageWallpaperStyle(wallpaper);

  if (loading) {
    return <main className="min-h-screen p-6 text-sm text-slate-600" style={wallpaperStyle}>Loading account settings...</main>;
  }

  return (
    <main className="touchbase-font-preferences min-h-screen px-4 py-8 text-slate-900 sm:px-6" style={{ ...wallpaperStyle, ...fontStyle }}>
      <style>{FONT_PREFERENCE_CSS}</style>
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-white/50 p-5 shadow-xl backdrop-blur-md" style={panelStyle}>
          <div>
            <p className="text-sm font-semibold" style={{ color: accent }}>TouchBase</p>
            <h1 className="mt-1 text-2xl font-bold">Account Settings</h1>
            <p className="mt-1 break-all text-sm text-slate-500">Signed in as {currentEmail}</p>
          </div>
          <button type="button" onClick={() => router.push("/protected/boards")} className="rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-110" style={{ backgroundColor: tab }}>Back to boards</button>
        </header>

        {appearanceNotice && (
          <div role="status" className="rounded-xl border border-white/50 p-4 text-sm shadow-sm backdrop-blur-md" style={panelStyle}>
            <p>{appearanceNotice}</p>
            <button type="button" onClick={() => router.push("/protected/settings/preferences")} className="mt-2 font-semibold underline">Open Preferences</button>
          </div>
        )}

        <section className="rounded-2xl border border-white/50 p-5 shadow-xl backdrop-blur-md sm:p-6" style={panelStyle}>
          <h2 className="text-lg font-bold">Change password</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a new password for your TouchBase login.</p>
          <form onSubmit={changePassword} className="mt-4 space-y-3">
            <label className="block text-sm font-medium" htmlFor="new-password">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
            <label className="block text-sm font-medium" htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
            {passwordFeedback && <p role="status" className={`text-sm ${passwordError ? "text-red-700" : "text-green-700"}`}>{passwordFeedback}</p>}
            <button type="submit" disabled={passwordBusy} className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50" style={{ backgroundColor: accent }}>{passwordBusy ? "Saving..." : "Save new password"}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/50 p-5 shadow-xl backdrop-blur-md sm:p-6" style={panelStyle}>
          <h2 className="text-lg font-bold">Change login email</h2>
          <p className="mt-1 text-sm text-slate-500">A verification email may be sent to your current and new addresses, depending on your Supabase authentication settings. Use your current email until the change is confirmed.</p>
          <form onSubmit={changeEmail} className="mt-4 space-y-3">
            <label className="block text-sm font-medium" htmlFor="new-email">New email address</label>
            <input id="new-email" type="email" autoComplete="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
            {emailFeedback && <p role="status" className={`text-sm ${emailError ? "text-red-700" : "text-green-700"}`}>{emailFeedback}</p>}
            <button type="submit" disabled={emailBusy} className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50" style={{ backgroundColor: accent }}>{emailBusy ? "Requesting..." : "Request email change"}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/50 p-5 shadow-xl backdrop-blur-md sm:p-6" style={panelStyle}>
          <h2 className="text-lg font-bold">Board ownership and account deletion</h2>
          <p className="mt-2 text-sm text-slate-600">You can request account deletion for administrator review. Sending a request does not delete or disable your account. If you own shared boards, transfer ownership to another existing member first.</p>
          {deletionFeedback && <p role="status" className={`mt-3 text-sm ${deletionError ? "text-red-700" : "text-green-700"}`}>{deletionFeedback}</p>}
          <button type="button" onClick={requestAccountDeletion} disabled={deletionBusy} className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">{deletionBusy ? "Sending request..." : "Request account deletion"}</button>
        </section>
      </div>
    </main>
  );
}
