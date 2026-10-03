"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WALLPAPER_OPTIONS } from "@/lib/preferences/options";

type Wallpaper = string;

type FontColor =
  | "dark"
  | "slate"
  | "white"
  | "blue"
  | "indigo"
  | "purple"
  | "cyan"
  | "teal"
  | "green"
  | "lime"
  | "amber"
  | "orange"
  | "rose"
  | "pink";


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


const fontColors: {
  value: FontColor;
  label: string;
  color: string;
}[] = [
  {
    value: "dark",
    label: "Dark",
    color: "#0f172a",
  },
  {
    value: "slate",
    label: "Slate",
    color: "#334155",
  },
  {
    value: "white",
    label: "White",
    color: "#f8fafc",
  },
  {
    value: "blue",
    label: "Blue",
    color: "#1d4ed8",
  },
  {
    value: "indigo",
    label: "Indigo",
    color: "#4338ca",
  },
  {
    value: "purple",
    label: "Purple",
    color: "#7e22ce",
  },
  {
    value: "cyan",
    label: "Cyan",
    color: "#0891b2",
  },
  {
    value: "teal",
    label: "Teal",
    color: "#0f766e",
  },
  {
    value: "green",
    label: "Green",
    color: "#15803d",
  },
  {
    value: "lime",
    label: "Lime",
    color: "#4d7c0f",
  },
  {
    value: "amber",
    label: "Amber",
    color: "#b45309",
  },
  {
    value: "orange",
    label: "Orange",
    color: "#c2410c",
  },
  {
    value: "rose",
    label: "Rose",
    color: "#be123c",
  },
  {
    value: "pink",
    label: "Pink",
    color: "#be185d",
  },
];

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

export default function PreferencesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [wallpaper, setWallpaper] =
    useState<Wallpaper>("default");

  const [accentColor, setAccentColor] =
    useState<AccentColor>("blue");

  const [tabColor, setTabColor] =
    useState<TabColor>("slate");

  const [panelOpacity, setPanelOpacity] =
    useState(50);

  const [fontColor, setFontColor] =
    useState<FontColor>("slate");

  const [fontSize, setFontSize] =
    useState(100);

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
        "wallpaper, accent_color, tab_color, panel_opacity, font_color, font_size"
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

      setPanelOpacity(
        typeof data.panel_opacity === "number"
          ? data.panel_opacity
          : 50
      );

      setFontColor(
        (data.font_color as FontColor) ||
          "slate"
      );

      setFontSize(
        typeof data.font_size === "number"
          ? data.font_size
          : 100
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
            panel_opacity:
              panelOpacity,
            font_color:
              fontColor,
            font_size:
              fontSize,
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

  const selectedFont =
    fontColors.find(
      (item) =>
        item.value === fontColor
    );

  const fontPreferenceStyle = {
    "--tb-font-color":
      FONT_COLORS[fontColor],
    "--tb-font-scale":
      String(
        Math.min(
          130,
          Math.max(
            80,
            fontSize
          )
        ) / 100
      ),
  } as React.CSSProperties;

  const pageWallpaperStyle =
    getPageWallpaperStyle(
      wallpaper
    );

  const panelAlpha =
    0.12 +
    (Math.min(
      100,
      Math.max(
        0,
        panelOpacity
      )
    ) /
      100) *
      0.7;

  const panelBackgroundColor =
    `rgba(255, 255, 255, ${panelAlpha})`;

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
      className="touchbase-font-preferences min-h-screen"
      style={{ ...pageWallpaperStyle, ...fontPreferenceStyle }}
    >
      <style>{FONT_PREFERENCE_CSS}</style>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div
          className="mb-8 rounded-3xl border border-white/40 p-6 shadow-xl backdrop-blur-md"
          style={{
            backgroundColor:
              panelBackgroundColor,
          }}
        >
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

          <section
            className="rounded-2xl border border-white/50 p-6 shadow-xl backdrop-blur-md"
            style={{
              backgroundColor:
                panelBackgroundColor,
            }}
          >
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

          <section
            className="rounded-2xl border border-white/50 p-6 shadow-xl backdrop-blur-md"
            style={{
              backgroundColor:
                panelBackgroundColor,
            }}
          >
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

          <section
            className="rounded-2xl border border-white/50 p-6 shadow-xl backdrop-blur-md"
            style={{
              backgroundColor:
                panelBackgroundColor,
            }}
          >
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

          {/* PANEL READABILITY */}

          <section
            className="rounded-2xl border border-white/50 p-6 shadow-xl backdrop-blur-md"
            style={{
              backgroundColor:
                panelBackgroundColor,
            }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Panel readability
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Adjust how much white appears behind the main glass panels.
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {panelOpacity}%
              </div>
            </div>

            <div className="mt-6">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={panelOpacity}
                onChange={(event) =>
                  setPanelOpacity(Number(event.target.value))
                }
                className="w-full cursor-pointer"
              />

              <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
                <span>Transparent</span>
                <span>Faded white</span>
              </div>
            </div>

            <div
              className="mt-6 rounded-2xl border border-white/60 p-5 shadow-sm backdrop-blur-md"
              style={{
                backgroundColor: `rgba(255, 255, 255, ${
                  0.12 + (panelOpacity / 100) * 0.7
                })`,
              }}
            >
              <p className="font-semibold text-slate-900">
                Readability preview
              </p>

              <p className="mt-1 text-sm text-slate-700">
                Move the slider to make glass panels clearer or more transparent.
              </p>
            </div>
          </section>

          {/* FONT APPEARANCE */}

          <section
            className="rounded-2xl border border-white/50 p-6 shadow-xl backdrop-blur-md"
            style={{
              backgroundColor:
                panelBackgroundColor,
            }}
          >
            <h2 className="text-xl font-semibold text-slate-900">
              Font appearance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the main text colour and adjust the text size across TouchBase.
            </p>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700">
                Font colour
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                {fontColors.map(
                  (item) => {
                    const selected =
                      fontColor ===
                      item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setFontColor(
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
                          className="h-6 w-6 rounded-full border border-slate-300"
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
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-700">
                  Font size
                </p>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {fontSize}%
                </span>
              </div>

              <input
                type="range"
                min="80"
                max="130"
                step="5"
                value={fontSize}
                onChange={(event) =>
                  setFontSize(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="mt-4 w-full cursor-pointer"
              />

              <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
                <span>Smaller</span>
                <span>Default</span>
                <span>Larger</span>
              </div>
            </div>

            <div
              className="mt-6 rounded-2xl border border-white/60 bg-white/75 p-5 shadow-sm backdrop-blur"
              style={{
                color:
                  selectedFont?.color,
              }}
            >
              <p
                className="font-semibold"
                style={{
                  fontSize: `${Math.round(
                    18 *
                      (fontSize / 100)
                  )}px`,
                }}
              >
                TouchBase font preview
              </p>

              <p
                className="mt-2"
                style={{
                  fontSize: `${Math.round(
                    14 *
                      (fontSize / 100)
                  )}px`,
                }}
              >
                This is how your main interface text will look.
              </p>
            </div>
          </section>

          {/* PREVIEW */}

          <section
            className="rounded-2xl border border-white/50 p-6 shadow-xl backdrop-blur-md"
            style={{
              backgroundColor:
                panelBackgroundColor,
            }}
          >
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
                    className="rounded-xl p-4 shadow-sm backdrop-blur-md"
                    style={{
                      backgroundColor:
                        panelBackgroundColor,
                    }}
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
