
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { WALLPAPER_OPTIONS } from "@/lib/preferences/options";

type Board = {
  id: number;
  name: string;
  user_id: string;
};

type Card = {
  id: number;
  title: string;
  due_date: string | null;
  status: string;
  board_id: number;
};

type CalendarEvent = {
  id: number;
  board_id: number;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  created_at: string;
};

type CalendarItem = {
  id: string;
  type: "card" | "event";
  title: string;
  date: string;
  description?: string | null;
  status?: string;
  eventId?: number;
};

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

type UserPreferences = {
  wallpaper: Wallpaper;
  accent_color: AccentColor;
  tab_color: TabColor;
  panel_opacity: number;
  font_color: FontColor;
  font_size: number;
};

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
  .touchbase-font-preferences .text-slate-400,
  .touchbase-font-preferences .text-gray-950,
  .touchbase-font-preferences .text-gray-900,
  .touchbase-font-preferences .text-gray-800,
  .touchbase-font-preferences .text-gray-700,
  .touchbase-font-preferences .text-gray-600,
  .touchbase-font-preferences .text-gray-500 {
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

const ACCENT_COLORS: Record<AccentColor, string> = {
  blue: "#2563eb",
  purple: "#7c3aed",
  green: "#16a34a",
  orange: "#ea580c",
  pink: "#db2777",
  "blue-soft": "rgba(37, 99, 235, 0.72)",
  "purple-soft": "rgba(124, 58, 237, 0.72)",
  "green-soft": "rgba(22, 163, 74, 0.72)",
  "orange-soft": "rgba(234, 88, 12, 0.72)",
  "pink-soft": "rgba(219, 39, 119, 0.72)",
};

const TAB_COLORS: Record<TabColor, string> = {
  slate: "#475569",
  blue: "#2563eb",
  green: "#16a34a",
  amber: "#d97706",
  rose: "#e11d48",
  "slate-soft": "rgba(71, 85, 105, 0.72)",
  "blue-soft": "rgba(37, 99, 235, 0.72)",
  "green-soft": "rgba(22, 163, 74, 0.72)",
  "amber-soft": "rgba(217, 119, 6, 0.72)",
  "rose-soft": "rgba(225, 29, 72, 0.72)",
};

function getDateKey(
  year: number,
  month: number,
  day: number
) {
  const monthText = String(
    month + 1
  ).padStart(2, "0");

  const dayText = String(
    day
  ).padStart(2, "0");

  return `${year}-${monthText}-${dayText}`;
}

function formatMonthTitle(
  date: Date
) {
  return date.toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric",
    }
  );
}

function formatEventDate(
  date: string
) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CalendarClient({
  boardId,
}: {
  boardId: number;
}) {
  const router = useRouter();

  const supabase =
    createClient();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const [board, setBoard] =
    useState<Board | null>(null);

  const [cards, setCards] =
    useState<Card[]>([]);

  const [
    calendarEvents,
    setCalendarEvents,
  ] = useState<CalendarEvent[]>([]);

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<string | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [
    currentMonth,
    setCurrentMonth,
  ] = useState(() => {
    const today = new Date();

    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  });

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<string | null>(
    null
  );

  const [
    isEventModalOpen,
    setIsEventModalOpen,
  ] = useState(false);

  const [
    eventTitle,
    setEventTitle,
  ] = useState("");

  const [
    eventDescription,
    setEventDescription,
  ] = useState("");

  const [
    eventDate,
    setEventDate,
  ] = useState("");

  const [
    editingEvent,
    setEditingEvent,
  ] =
    useState<CalendarEvent | null>(
      null
    );

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<CalendarEvent | null>(
      null
    );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    preferences,
    setPreferences,
  ] = useState<UserPreferences>({
    wallpaper: "default",
    accent_color: "blue",
    tab_color: "slate",
    panel_opacity: 50,
    font_color: "slate",
    font_size: 100,
  });

  const natureWallpaper =
    WALLPAPER_OPTIONS.find(
      (option) =>
        option.id === preferences.wallpaper
    );

  const wallpaperStyle: React.CSSProperties =
    natureWallpaper
      ? {
          backgroundImage: `linear-gradient(
            rgba(248, 250, 252, 0.30),
            rgba(248, 250, 252, 0.30)
          ), url("${natureWallpaper.image}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          backgroundColor: "#e2e8f0",
        }
      : {
          backgroundImage:
            WALLPAPER_STYLES[
              preferences.wallpaper
            ] ||
            WALLPAPER_STYLES.default,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        };

  const accentColor =
    ACCENT_COLORS[
      preferences.accent_color
    ];

  const tabColor =
    TAB_COLORS[
      preferences.tab_color
    ];

  const panelAlpha =
    0.12 +
    (Math.min(
      100,
      Math.max(
        0,
        preferences.panel_opacity
      )
    ) /
      100) *
      0.7;

  const panelBackgroundColor =
    `rgba(255, 255, 255, ${panelAlpha})`;

  const mutedPanelBackgroundColor =
    `rgba(248, 250, 252, ${Math.max(
      0.08,
      panelAlpha * 0.72
    )})`;

  const fontPreferenceStyle = {
    "--tb-font-color":
      FONT_COLORS[preferences.font_color],
    "--tb-font-scale":
      String(
        Math.min(
          130,
          Math.max(
            80,
            preferences.font_size
          )
        ) / 100
      ),
  } as React.CSSProperties;

  useEffect(() => {
    initializeCalendar();
  }, []);

  async function initializeCalendar() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      router.push(
        "/auth/login"
      );

      return;
    }

    setCurrentUserId(
      user.id
    );

    await Promise.all([
      loadBoard(),
      loadCards(),
      loadCalendarEvents(),
      loadPreferences(user.id),
    ]);

    setLoading(false);
  }

  async function loadPreferences(
    userId: string
  ) {
    const { data, error } =
      await supabase
        .from("user_preferences")
        .select(
          "wallpaper, accent_color, tab_color, panel_opacity, font_color, font_size"
        )
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
      console.error(
        "Error loading preferences:",
        error.message
      );

      return;
    }

    if (!data) return;

    setPreferences({
      wallpaper:
        data.wallpaper as Wallpaper,
      accent_color:
        data.accent_color as AccentColor,
      tab_color:
        data.tab_color as TabColor,
      panel_opacity:
        typeof data.panel_opacity === "number"
          ? data.panel_opacity
          : 50,
      font_color:
        (data.font_color as FontColor) ||
        "slate",
      font_size:
        typeof data.font_size === "number"
          ? data.font_size
          : 100,
    });
  }

  async function loadBoard() {
    const {
      data,
      error,
    } = await supabase
      .from("boards")
      .select(
        "id, name, user_id"
      )
      .eq("id", boardId)
      .maybeSingle();

    if (error) {
      console.error(
        "Error loading board:",
        error.message
      );

      return;
    }

    if (data) {
      setBoard(data);
    }
  }

  async function loadCards() {
    const {
      data,
      error,
    } = await supabase
      .from("cards")
      .select(
        "id, title, due_date, status, board_id"
      )
      .eq(
        "board_id",
        boardId
      )
      .not(
        "due_date",
        "is",
        null
      )
      .order(
        "due_date",
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        "Error loading cards:",
        error.message
      );

      return;
    }

    setCards(
      data || []
    );
  }

  async function loadCalendarEvents() {
    const {
      data,
      error,
    } = await supabase
      .from(
        "calendar_events"
      )
      .select("*")
      .eq(
        "board_id",
        boardId
      )
      .order(
        "start_at",
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        "Error loading calendar events:",
        error.message
      );

      return;
    }

    setCalendarEvents(
      data || []
    );
  }

  const calendarItems =
    useMemo(() => {
      const cardItems:
        CalendarItem[] =
        cards
          .filter(
            (card) =>
              Boolean(
                card.due_date
              )
          )
          .map(
            (card) => ({
              id:
                `card-${card.id}`,
              type: "card",
              title:
                card.title,
              date:
                card.due_date as string,
              status:
                card.status,
            })
          );

      const eventItems:
        CalendarItem[] =
        calendarEvents.map(
          (event) => {
            const start =
              new Date(
                event.start_at
              );

            const date =
              getDateKey(
                start.getFullYear(),
                start.getMonth(),
                start.getDate()
              );

            return {
              id:
                `event-${event.id}`,
              type:
                "event",
              title:
                event.title,
              date,
              description:
                event.description,
              eventId:
                event.id,
            };
          }
        );

      return [
        ...cardItems,
        ...eventItems,
      ];
    }, [
      cards,
      calendarEvents,
    ]);

  const calendarDays =
    useMemo(() => {
      const year =
        currentMonth.getFullYear();

      const month =
        currentMonth.getMonth();

      const firstDay =
        new Date(
          year,
          month,
          1
        );

      const lastDay =
        new Date(
          year,
          month + 1,
          0
        );

      const startOffset =
        firstDay.getDay();

      const days: {
        date: Date;
        dateKey: string;
        isCurrentMonth: boolean;
      }[] = [];

      for (
        let index =
          startOffset - 1;
        index >= 0;
        index--
      ) {
        const date =
          new Date(
            year,
            month,
            -index
          );

        days.push({
          date,
          dateKey:
            getDateKey(
              date.getFullYear(),
              date.getMonth(),
              date.getDate()
            ),
          isCurrentMonth:
            false,
        });
      }

      for (
        let day = 1;
        day <=
        lastDay.getDate();
        day++
      ) {
        const date =
          new Date(
            year,
            month,
            day
          );

        days.push({
          date,
          dateKey:
            getDateKey(
              year,
              month,
              day
            ),
          isCurrentMonth:
            true,
        });
      }

      let nextDay = 1;

      while (
        days.length % 7 !==
        0
      ) {
        const date =
          new Date(
            year,
            month + 1,
            nextDay
          );

        days.push({
          date,
          dateKey:
            getDateKey(
              date.getFullYear(),
              date.getMonth(),
              date.getDate()
            ),
          isCurrentMonth:
            false,
        });

        nextDay++;
      }

      while (
        days.length < 42
      ) {
        const date =
          new Date(
            year,
            month + 1,
            nextDay
          );

        days.push({
          date,
          dateKey:
            getDateKey(
              date.getFullYear(),
              date.getMonth(),
              date.getDate()
            ),
          isCurrentMonth:
            false,
        });

        nextDay++;
      }

      return days;
    }, [currentMonth]);

  function getItemsForDate(
    dateKey: string
  ) {
    return calendarItems.filter(
      (item) =>
        item.date ===
        dateKey
    );
  }

  function previousMonth() {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() -
            1,
          1
        )
    );
  }

  function nextMonth() {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            1,
          1
        )
    );
  }

  function goToToday() {
    const today =
      new Date();

    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelectedDate(
      getDateKey(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
    );
  }

  function openAddEvent(
    date?: string
  ) {
    setEditingEvent(
      null
    );

    setEventTitle("");
    setEventDescription("");

    setEventDate(
      date ||
        selectedDate ||
        getDateKey(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate()
        )
    );

    setErrorMessage("");

    setIsEventModalOpen(
      true
    );
  }

  function openEditEvent(
    eventId: number
  ) {
    const event =
      calendarEvents.find(
        (item) =>
          item.id ===
          eventId
      );

    if (!event) return;

    const start =
      new Date(
        event.start_at
      );

    setEditingEvent(
      event
    );

    setEventTitle(
      event.title
    );

    setEventDescription(
      event.description ||
        ""
    );

    setEventDate(
      getDateKey(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      )
    );

    setErrorMessage("");

    setIsEventModalOpen(
      true
    );
  }

  function closeEventModal() {
    if (saving) return;

    setIsEventModalOpen(
      false
    );

    setEditingEvent(
      null
    );

    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setErrorMessage("");
  }

  async function saveEvent() {
    const title =
      eventTitle.trim();

    const description =
      eventDescription.trim();

    if (!title) {
      setErrorMessage(
        "Enter an event title."
      );

      return;
    }

    if (!eventDate) {
      setErrorMessage(
        "Choose a date."
      );

      return;
    }

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      router.push(
        "/auth/login"
      );

      return;
    }

    setSaving(true);
    setErrorMessage("");

    const startAt =
      new Date(
        `${eventDate}T12:00:00`
      ).toISOString();

    if (editingEvent) {
      const {
        error,
      } =
        await supabase
          .from(
            "calendar_events"
          )
          .update({
            title,
            description:
              description ||
              null,
            start_at:
              startAt,
            all_day: true,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            editingEvent.id
          )
          .eq(
            "board_id",
            boardId
          );

      if (error) {
        setErrorMessage(
          error.message
        );

        setSaving(false);
        return;
      }
    } else {
      const {
        error,
      } =
        await supabase
          .from(
            "calendar_events"
          )
          .insert({
            board_id:
              boardId,
            user_id:
              user.id,
            title,
            description:
              description ||
              null,
            start_at:
              startAt,
            end_at: null,
            all_day: true,
          });

      if (error) {
        setErrorMessage(
          error.message
        );

        setSaving(false);
        return;
      }
    }

    await loadCalendarEvents();

    setSaving(false);

    closeEventModal();
  }

  async function deleteEvent() {
    if (
      !deleteTarget
    ) {
      return;
    }

    const { error } =
      await supabase
        .from(
          "calendar_events"
        )
        .delete()
        .eq(
          "id",
          deleteTarget.id
        )
        .eq(
          "board_id",
          boardId
        );

    if (error) {
      alert(
        `Error deleting event: ${error.message}`
      );

      return;
    }

    setDeleteTarget(
      null
    );

    await loadCalendarEvents();
  }

  const selectedItems =
    selectedDate
      ? getItemsForDate(
          selectedDate
        )
      : [];

  const today =
    new Date();

  const todayKey =
    getDateKey(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

  if (loading) {
    return (
      <main
        className="min-h-screen p-8"
        style={wallpaperStyle}
      >
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-10 w-64 rounded bg-slate-300" />

          <div className="mt-8 h-[650px] rounded-3xl bg-slate-200" />
        </div>
      </main>
    );
  }

  return (
    <main
      className="touchbase-font-preferences min-h-screen"
      style={{ ...wallpaperStyle, ...fontPreferenceStyle }}
    >
        <style>{FONT_PREFERENCE_CSS}</style>
      <div className="hidden border-b border-white/40 bg-white/88 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/protected/boards"
              )
            }
            className="font-bold text-slate-900"
          >
            TouchBase
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/protected/boards/${boardId}`
                )
              }
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-95"
              style={{ backgroundColor: tabColor }}
            >
              Board
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/protected/boards"
                )
              }
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-95"
              style={{ backgroundColor: tabColor }}
            >
              All boards
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 pb-28 sm:px-6 sm:py-8 md:pb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/protected/boards/${boardId}`
                )
              }
              className="hidden items-center rounded-xl border border-white/30 px-4 py-2.5 text-base font-bold text-white shadow-md transition hover:brightness-110 hover:shadow-lg md:inline-flex"
            style={{ backgroundColor: tabColor }}
            >
              ← Back to board
            </button>

            <h1 className="text-2xl font-bold text-slate-900 md:mt-4 md:text-3xl">
              Calendar
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {board?.name ||
                "Board"}{" "}
              · Card due dates
              and events
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              openAddEvent()
            }
            className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95"
            style={{ backgroundColor: accentColor }}
          >
            + Add event
          </button>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
          <div
            className="overflow-hidden rounded-3xl border border-white/50 shadow-xl backdrop-blur-md"
            style={{
              backgroundColor:
                panelBackgroundColor,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={
                    previousMonth
                  }
                  className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={
                    nextMonth
                  }
                  className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200"
                >
                  →
                </button>

                <button
                  type="button"
                  onClick={
                    goToToday
                  }
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Today
                </button>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                {formatMonthTitle(
                  currentMonth
                )}
              </h2>
            </div>

            <div
              className="grid grid-cols-7 border-b border-slate-200/80"
              style={{
                backgroundColor:
                  panelBackgroundColor,
              }}
            >
              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map(
                (day) => (
                  <div
                    key={day}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map(
                (
                  day,
                  index
                ) => {
                  const items =
                    getItemsForDate(
                      day.dateKey
                    );

                  const isToday =
                    day.dateKey ===
                    todayKey;

                  const isSelected =
                    day.dateKey ===
                    selectedDate;

                  return (
                    <button
                      type="button"
                      key={`${day.dateKey}-${index}`}
                      onClick={() =>
                        setSelectedDate(
                          day.dateKey
                        )
                      }
                      onDoubleClick={() =>
                        openAddEvent(
                          day.dateKey
                        )
                      }
                      className={`min-h-32 border-b border-r border-slate-200 p-2 text-left transition ${
                        isSelected
                          ? "ring-2 ring-inset ring-blue-500"
                          : "hover:brightness-[1.03]"
                      }`}
                      style={{
                        backgroundColor:
                          day.isCurrentMonth
                            ? panelBackgroundColor
                            : mutedPanelBackgroundColor,
                      }}
                    >
                      <div className="flex justify-end">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                            isToday
                              ? "bg-blue-600 font-bold text-white"
                              : day.isCurrentMonth
                                ? "text-slate-700"
                                : "text-slate-400"
                          }`}
                        >
                          {day.date.getDate()}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1">
                        {items
                          .slice(
                            0,
                            3
                          )
                          .map(
                            (
                              item
                            ) => (
                              <div
                                key={
                                  item.id
                                }
                                className={`truncate rounded-md px-2 py-1 text-xs font-medium ${
                                  item.type ===
                                  "card"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-violet-50 text-violet-700"
                                }`}
                              >
                                {item.type ===
                                "card"
                                  ? "✓ "
                                  : "● "}
                                {
                                  item.title
                                }
                              </div>
                            )
                          )}

                        {items.length >
                          3 && (
                          <div className="px-1 text-xs font-medium text-slate-500">
                            +
                            {items.length -
                              3}{" "}
                            more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <aside
            className="rounded-3xl border border-white/50 p-5 shadow-xl backdrop-blur-md"
            style={{
              backgroundColor:
                panelBackgroundColor,
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">
                {selectedDate
                  ? formatEventDate(
                      selectedDate
                    )
                  : "Select a day"}
              </h2>

              {selectedDate && (
                <button
                  type="button"
                  onClick={() =>
                    openAddEvent(
                      selectedDate
                    )
                  }
                  className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  + Event
                </button>
              )}
            </div>

            {!selectedDate ? (
              <p className="mt-5 text-sm leading-6 text-slate-500">
                Click a date to see
                its cards and
                events.
              </p>
            ) : selectedItems.length ===
              0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">
                Nothing scheduled
                for this day.
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-3">
                {selectedItems.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.type ===
                              "card"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-violet-50 text-violet-700"
                            }`}
                          >
                            {item.type ===
                            "card"
                              ? "Card"
                              : "Event"}
                          </span>

                          <p className="mt-2 font-medium text-slate-900">
                            {
                              item.title
                            }
                          </p>

                          {item.description && (
                            <p className="mt-2 text-sm leading-5 text-slate-500">
                              {
                                item.description
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      {item.type ===
                        "event" &&
                        item.eventId && (
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditEvent(
                                  item.eventId as number
                                )
                              }
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const event =
                                  calendarEvents.find(
                                    (
                                      value
                                    ) =>
                                      value.id ===
                                      item.eventId
                                  );

                                if (
                                  event
                                ) {
                                  setDeleteTarget(
                                    event
                                  );
                                }
                              }}
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                    </div>
                  )
                )}
              </div>
            )}

            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-3 w-3 rounded bg-blue-100" />
                Card due date
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="h-3 w-3 rounded bg-violet-100" />
                Calendar event
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingEvent
                  ? "Edit event"
                  : "Add event"}
              </h2>

              <button
                type="button"
                onClick={
                  closeEventModal
                }
                disabled={saving}
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-700">
              Title
            </label>

            <input
              autoFocus
              value={
                eventTitle
              }
              onChange={(
                event
              ) =>
                setEventTitle(
                  event.target.value
                )
              }
              placeholder="Meeting, deadline, reminder..."
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <label className="mt-5 block text-sm font-medium text-slate-700">
              Date
            </label>

            <input
              type="date"
              value={
                eventDate
              }
              onChange={(
                event
              ) =>
                setEventDate(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <label className="mt-5 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              value={
                eventDescription
              }
              onChange={(
                event
              ) =>
                setEventDescription(
                  event.target.value
                )
              }
              rows={4}
              placeholder="Optional notes..."
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {errorMessage && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={
                  closeEventModal
                }
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  saveEvent
                }
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingEvent
                    ? "Save changes"
                    : "Add event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">
              Delete event?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will permanently
              delete “
              {deleteTarget.title}
              ”.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(
                    null
                  )
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  deleteEvent
                }
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {mobileMoreOpen && (
        <div className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:hidden">
          <div className="grid gap-2">
            <button type="button" onClick={() => router.push("/protected/boards")} className="rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800">All boards</button>
            <button type="button" onClick={() => router.push("/protected/settings/preferences")} className="rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800">Preferences</button>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          <button type="button" onClick={() => router.push(`/protected/boards/${boardId}`)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><span className="text-lg">▦</span><span>Board</span></button>
          <button type="button" onClick={() => setMobileMoreOpen(false)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-white" style={{ backgroundColor: accentColor }}><span className="text-lg">▣</span><span>Calendar</span></button>
          <button type="button" onClick={() => router.push(`/protected/boards/${boardId}/messenger`)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><span className="text-lg">✉</span><span>Chat</span></button>
          <button type="button" onClick={() => setMobileMoreOpen((current) => !current)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><span className="text-lg">•••</span><span>More</span></button>
        </div>
      </div>

    </main>
  );
}