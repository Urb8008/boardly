"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WALLPAPER_OPTIONS } from "@/lib/preferences/options";

type Wallpaper = string;

type AccentColor =
  | "blue"
  | "purple"
  | "green"
  | "orange"
  | "pink"
  | "blue-soft"
  | "purple-soft"
  | "green-soft"
  | "orange-soft"
  | "pink-soft";

type TabColor =
  | "slate"
  | "blue"
  | "green"
  | "amber"
  | "rose"
  | "slate-soft"
  | "blue-soft"
  | "green-soft"
  | "amber-soft"
  | "rose-soft";

const wallpapers: {
  value: Wallpaper;
  label: string;
  preview: string;
}[] = [
  {
    value: "default",
    label: "Default",
    preview:
      "linear-gradient(135deg, #f8fafc, #e2e8f0)",
  },
  {
    value: "ocean",
    label: "Ocean",
    preview:
      "linear-gradient(135deg, #0ea5e9, #1e3a8a)",
  },
  {
    value: "forest",
    label: "Forest",
    preview:
      "linear-gradient(135deg, #15803d, #052e16)",
  },
  {
    value: "sunset",
    label: "Sunset",
    preview:
      "linear-gradient(135deg, #fb7185, #f97316, #7c3aed)",
  },
  {
    value: "midnight",
    label: "Midnight",
    preview:
      "linear-gradient(135deg, #0f172a, #312e81)",
  },
  ...WALLPAPER_OPTIONS.map((item) => ({
    value: item.id,
    label: item.name,
    preview: `url("${item.image}") center / cover no-repeat`,
  })),
];

const accentColors: {
  value: AccentColor;
  label: string;
  color: string;
}[] = [
  {
    value: "blue",
    label: "Blue",
    color: "#2563eb",
  },
  {
    value: "purple",
    label: "Purple",
    color: "#7c3aed",
  },
  {
    value: "green",
    label: "Green",
    color: "#16a34a",
  },
  {
    value: "orange",
    label: "Orange",
    color: "#ea580c",
  },
  {
    value: "pink",
    label: "Pink",
    color: "#db2777",
  },
  {
    value: "blue-soft",
    label: "Blue glass",
    color: "rgba(37, 99, 235, 0.72)",
  },
  {
    value: "purple-soft",
    label: "Purple glass",
    color: "rgba(124, 58, 237, 0.72)",
  },
  {
    value: "green-soft",
    label: "Green glass",
    color: "rgba(22, 163, 74, 0.72)",
  },
  {
    value: "orange-soft",
    label: "Orange glass",
    color: "rgba(234, 88, 12, 0.72)",
  },
  {
    value: "pink-soft",
    label: "Pink glass",
    color: "rgba(219, 39, 119, 0.72)",
  },
];

const tabColors: {
  value: TabColor;
  label: string;
  color: string;
}[] = [
  {
    value: "slate",
    label: "Slate",
    color: "#475569",
  },
  {
    value: "blue",
    label: "Blue",
    color: "#2563eb",
  },
  {
    value: "green",
    label: "Green",
    color: "#16a34a",
  },
  {
    value: "amber",
    label: "Amber",
    color: "#d97706",
  },
  {
    value: "rose",
    label: "Rose",
    color: "#e11d48",
  },
  {
    value: "slate-soft",
    label: "Slate glass",
    color: "rgba(71, 85, 105, 0.72)",
  },
  {
    value: "blue-soft",
    label: "Blue glass",
    color: "rgba(37, 99, 235, 0.72)",
  },
  {
    value: "green-soft",
    label: "Green glass",
    color: "rgba(22, 163, 74, 0.72)",
  },
  {
    value: "amber-soft",
    label: "Amber glass",
    color: "rgba(217, 119, 6, 0.72)",
  },
  {
    value: "rose-soft",
    label: "Rose glass",
    color: "rgba(225, 29, 72, 0.72)",
  },
];

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

export default function PreferencesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [wallpaper, setWallpaper] =
    useState<Wallpaper>("default");

  const [accentColor, setAccentColor] =
    useState<AccentColor>("blue");

  const [tabColor, setTabColor] =
    useState<TabColor>("slate");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage(
        "Unable to load your account."
      );

      setLoading(false);

      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("user_preferences")
      .select(
        "wallpaper, accent_color, tab_color"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      setMessage(
        "Unable to load preferences."
      );

      setLoading(false);

      return;
    }

    if (data) {
      setWallpaper(
        data.wallpaper as Wallpaper
      );

      setAccentColor(
        data.accent_color as AccentColor
      );

      setTabColor(
        data.tab_color as TabColor
      );
    }

    setLoading(false);
  }

  async function savePreferences() {
    setSaving(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage(
        "Unable to find your account."
      );

      setSaving(false);

      return;
    }

    const { error } =
      await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            wallpaper,
            accent_color:
              accentColor,
            tab_color:
              tabColor,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

    if (error) {
      console.error(error);

      setMessage(
        "Unable to save preferences."
      );

      setSaving(false);

      return;
    }

    setMessage(
      "Preferences saved."
    );

    setSaving(false);
  }

  const selectedWallpaper =
    wallpapers.find(
      (item) =>
        item.value === wallpaper
    );

  const selectedAccent =
    accentColors.find(
      (item) =>
        item.value === accentColor
    );

  const selectedTab =
    tabColors.find(
      (item) =>
        item.value === tabColor
    );

  const pageWallpaperStyle =
    getPageWallpaperStyle(
      wallpaper
    );

  if (loading) {
    return (
      <div
        className="min-h-screen p-8"
        style={pageWallpaperStyle}
      >
        <div className="mx-auto max-w-5xl">
          <p className="text-slate-500">
            Loading preferences...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={pageWallpaperStyle}
    >
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 rounded-3xl border border-white/40 bg-white/82 p-6 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mb-4 inline-flex items-center rounded-xl border border-white/30 px-4 py-2.5 text-base font-bold text-white shadow-md transition hover:brightness-110 hover:shadow-lg"
            style={{ backgroundColor: selectedTab?.color || "#475569" }}
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            Preferences
          </h1>

          <p className="mt-2 text-slate-500">
            Personalise how TouchBase looks
            and feels.
          </p>
        </div>

        <div className="space-y-8">
          {/* WALLPAPER */}

          <section className="rounded-2xl border border-white/50 bg-white/82 p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-xl font-semibold text-slate-900">
              Wallpaper
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the background for
              your boards.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
              {wallpapers.map(
                (item) => {
                  const selected =
                    wallpaper ===
                    item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setWallpaper(
                          item.value
                        )
                      }
                      className={`rounded-xl border-2 p-2 text-left transition ${
                        selected
                          ? "border-blue-600"
                          : "border-transparent hover:border-slate-300"
                      }`}
                    >
                      <div
                        className="h-24 rounded-lg"
                        style={{
                          background:
                            item.preview,
                        }}
                      />

                      <div className="mt-2 text-sm font-medium text-slate-700">
                        {item.label}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* ACCENT COLOR */}

          <section className="rounded-2xl border border-white/50 bg-white/82 p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-xl font-semibold text-slate-900">
              Button colour
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose a solid colour or a softer transparent glass version for buttons and actions.
            </p>

            <div className="mt-5 flex flex-wrap gap-4">
              {accentColors.map(
                (item) => {
                  const selected =
                    accentColor ===
                    item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setAccentColor(
                          item.value
                        )
                      }
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                        selected
                          ? "border-slate-900 bg-white/90"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full"
                        style={{
                          backgroundColor:
                            item.color,
                        }}
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {item.label}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* TAB COLOR */}

          <section className="rounded-2xl border border-white/50 bg-white/82 p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-xl font-semibold text-slate-900">
              Column colour
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose a solid colour or a softer transparent glass colour for board column headings.
            </p>

            <div className="mt-5 flex flex-wrap gap-4">
              {tabColors.map(
                (item) => {
                  const selected =
                    tabColor ===
                    item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setTabColor(
                          item.value
                        )
                      }
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                        selected
                          ? "border-slate-900 bg-white/90"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-md"
                        style={{
                          backgroundColor:
                            item.color,
                        }}
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {item.label}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* PREVIEW */}

          <section className="rounded-2xl border border-white/50 bg-white/82 p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-xl font-semibold text-slate-900">
              Preview
            </h2>

            <div
              className="mt-5 min-h-[300px] rounded-2xl p-6"
              style={{
                background:
                  selectedWallpaper
                    ?.preview,
              }}
            >
              <div
                className="mb-5 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{
                  backgroundColor:
                    selectedAccent?.color,
                }}
              >
                New card
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  "To Do",
                  "In Progress",
                  "Done",
                ].map((title) => (
                  <div
                    key={title}
                    className="rounded-xl bg-white/82 p-4 shadow-sm backdrop-blur-md"
                  >
                    <div
                      className="mb-4 rounded-lg px-3 py-2 font-semibold text-white"
                      style={{
                        backgroundColor:
                          selectedTab?.color,
                      }}
                    >
                      {title}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      Example card
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SAVE */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {message && (
                <p className="text-sm font-medium text-slate-600">
                  {message}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  router.back()
                }
                className="rounded-xl border border-white/60 bg-white/88 px-5 py-3 font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
              >
                Back
              </button>

              <button
                type="button"
                onClick={
                  savePreferences
                }
                disabled={saving}
                className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save preferences"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
