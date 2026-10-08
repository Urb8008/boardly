"use client";

import {
  useEffect,
  useRef,
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

type BoardMessage = {
  id: number;
  board_id: number;
  user_id: string;
  sender_email: string | null;
  message: string;
  created_at: string;
};

type BoardCall = {
  id: string;
  board_id: number;
  started_by: string;
  started_by_email: string | null;
  room_name: string;
  active: boolean;
  created_at: string;
  ended_at: string | null;
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
  default: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
  ocean: "linear-gradient(135deg, #0ea5e9, #1e3a8a)",
  forest: "linear-gradient(135deg, #15803d, #052e16)",
  sunset: "linear-gradient(135deg, #fb7185, #f97316, #7c3aed)",
  midnight: "linear-gradient(135deg, #0f172a, #312e81)",
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

type JitsiApi = {
  dispose: () => void;
};

type JitsiConstructor = new (
  domain: string,
  options: {
    roomName: string;
    jwt: string;
    parentNode: HTMLElement;
    width: string;
    height: number;
    configOverwrite?: Record<string, unknown>;
  }
) => JitsiApi;

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiConstructor;
  }
}

export default function MessengerClient({
  boardId,
}: {
  boardId: number;
}) {
  const router = useRouter();

  const supabase =
    createClient();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const [
    board,
    setBoard,
  ] =
    useState<Board | null>(
      null
    );

  const [
    messages,
    setMessages,
  ] =
    useState<
      BoardMessage[]
    >([]);

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState<
      string | null
    >(null);

  const [
    currentUserEmail,
    setCurrentUserEmail,
  ] =
    useState("");

  const [
    newMessage,
    setNewMessage,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    activeCall,
    setActiveCall,
  ] =
    useState<BoardCall | null>(
      null
    );

  const [
    callOpen,
    setCallOpen,
  ] =
    useState(false);

  const [
    callBusy,
    setCallBusy,
  ] =
    useState(false);

  const [
    callError,
    setCallError,
  ] =
    useState("");



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
            rgba(248, 250, 252, 0.32),
            rgba(248, 250, 252, 0.32)
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
    ACCENT_COLORS[preferences.accent_color];

  const tabColor =
    TAB_COLORS[preferences.tab_color];

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

  const panelBackgroundSoft =
    `rgba(255, 255, 255, ${Math.max(
      0.08,
      panelAlpha * 0.78
    )})`;

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const videoContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const jitsiApiRef =
    useRef<JitsiApi | null>(
      null
    );

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
    initializeMessenger();

    const channel =
      supabase
        .channel(
          `board-messages-${boardId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "board_messages",
            filter:
              `board_id=eq.${boardId}`,
          },
          () => {
            void loadMessages();

            if (document.visibilityState === "visible") {
              void markChatRead();
            }
          }
        )
        .subscribe();

    const callChannel =
      supabase
        .channel(
          `board-calls-${boardId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "board_calls",
            filter:
              `board_id=eq.${boardId}`,
          },
          () => {
            loadActiveCall();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );

      supabase.removeChannel(
        callChannel
      );
    };
  }, [boardId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void markChatRead();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [boardId]);

  useEffect(() => {
    if (
      !callOpen ||
      !activeCall
    ) {
      disposeJitsi();
      return;
    }

    let cancelled = false;

    async function openJaasCall() {
      setCallError("");

      const roomName =
        activeCall?.room_name;

      if (!roomName) {
        setCallError(
          "No active video call found."
        );
        return;
      }

      try {
        const response =
          await fetch(
            "/api/jaas/token",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                boardId,
                roomName,
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Could not create video token."
          );
        }

        if (cancelled) {
          return;
        }

        await loadJaasScript(
          result.appId
        );

        if (
          cancelled ||
          !videoContainerRef.current ||
          !window.JitsiMeetExternalAPI
        ) {
          return;
        }

        disposeJitsi();

        jitsiApiRef.current =
          new window.JitsiMeetExternalAPI(
            "8x8.vc",
            {
              roomName: `${result.appId}/${roomName}`,
              jwt: result.token,
              parentNode:
                videoContainerRef.current,
              width: "100%",
              height: 620,
              configOverwrite: {
                prejoinPageEnabled:
                  false,
                disableDeepLinking:
                  true,
              },
            }
          );
      } catch (error) {
        if (!cancelled) {
          setCallError(
            error instanceof Error
              ? error.message
              : "Could not open video call."
          );
        }
      }
    }

    openJaasCall();

    return () => {
      cancelled = true;
      disposeJitsi();
    };
  }, [
    callOpen,
    activeCall?.id,
    boardId,
  ]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior:
            "smooth",
        }
      );
    }, 50);
  }

  async function initializeMessenger() {
    setLoading(true);

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

    setCurrentUserEmail(
      user.email || ""
    );

    await Promise.all([
      loadBoard(),
      loadMessages(),
      loadActiveCall(),
      loadPreferences(user.id),
    ]);

    await markChatRead(user.id);

    setLoading(false);
  }



  async function markChatRead(
    userId?: string
  ) {
    let resolvedUserId = userId || currentUserId;

    if (!resolvedUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      resolvedUserId = user?.id || null;
    }

    if (!resolvedUserId) return;

    const { error } = await supabase
      .from("board_message_reads")
      .upsert(
        {
          board_id: boardId,
          user_id: resolvedUserId,
          last_read_at: new Date().toISOString(),
        },
        {
          onConflict: "board_id,user_id",
        }
      );

    if (error) {
      console.error(
        "Error marking chat as read:",
        error.message
      );
    }
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
      wallpaper: data.wallpaper as Wallpaper,
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
    } =
      await supabase
        .from("boards")
        .select(
          "id, name, user_id"
        )
        .eq(
          "id",
          boardId
        )
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

  async function loadMessages() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "board_messages"
        )
        .select("*")
        .eq(
          "board_id",
          boardId
        )
        .order(
          "created_at",
          {
            ascending:
              true,
          }
        );

    if (error) {
      console.error(
        "Error loading messages:",
        error.message
      );

      return;
    }

    setMessages(
      data || []
    );
  }

  async function sendMessage() {
    const message =
      newMessage.trim();

    if (!message) {
      return;
    }

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

    setSending(true);
    setErrorMessage("");

    const {
      error,
    } =
      await supabase
        .from(
          "board_messages"
        )
        .insert({
          board_id:
            boardId,
          user_id:
            user.id,
          sender_email:
            user.email ||
            null,
          message,
        });

    if (error) {
      setErrorMessage(
        error.message
      );

      setSending(false);

      return;
    }

    setNewMessage("");

    await loadMessages();

    setSending(false);
  }

  async function deleteMessage(
    message:
      BoardMessage
  ) {
    if (
      message.user_id !==
      currentUserId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this message?"
      );

    if (!confirmed) {
      return;
    }

    const {
      error,
    } =
      await supabase
        .from(
          "board_messages"
        )
        .delete()
        .eq(
          "id",
          message.id
        )
        .eq(
          "user_id",
          currentUserId
        );

    if (error) {
      alert(
        `Error deleting message: ${error.message}`
      );

      return;
    }

    await loadMessages();
  }

  async function loadActiveCall() {
    const {
      data,
      error,
    } =
      await supabase
        .from("board_calls")
        .select("*")
        .eq(
          "board_id",
          boardId
        )
        .eq(
          "active",
          true
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(1)
        .maybeSingle();

    if (error) {
      console.error(
        "Error loading active call:",
        error.message
      );

      return;
    }

    setActiveCall(
      data || null
    );

    if (!data) {
      setCallOpen(false);
    }
  }

  async function postCallMessage(
    message: string
  ) {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } =
      await supabase
        .from(
          "board_messages"
        )
        .insert({
          board_id:
            boardId,
          user_id:
            user.id,
          sender_email:
            user.email ||
            null,
          message,
        });

    if (error) {
      console.error(
        "Unable to post call message:",
        error.message
      );
    }
  }

  function makeRoomName() {
    return `TouchBase-${boardId}-${crypto.randomUUID()}`;
  }

  async function startVideoCall() {
    setCallBusy(true);
    setCallError("");

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

      setCallBusy(false);
      return;
    }

    const {
      data: existingCall,
    } =
      await supabase
        .from("board_calls")
        .select("*")
        .eq(
          "board_id",
          boardId
        )
        .eq(
          "active",
          true
        )
        .limit(1)
        .maybeSingle();

    if (existingCall) {
      setActiveCall(
        existingCall
      );
      setCallOpen(true);
      setCallBusy(false);
      return;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("board_calls")
        .insert({
          board_id:
            boardId,
          started_by:
            user.id,
          started_by_email:
            user.email ||
            null,
          room_name:
            makeRoomName(),
          active: true,
        })
        .select()
        .single();

    if (error) {
      setCallError(
        error.message
      );

      await loadActiveCall();

      setCallBusy(false);
      return;
    }

    setActiveCall(
      data
    );
    setCallOpen(true);

    await postCallMessage(
      "🎥 Video call started. Open Messenger and select Join call."
    );

    setCallBusy(false);
  }

  function joinVideoCall() {
    if (!activeCall) {
      return;
    }

    setCallOpen(true);
  }

  async function endVideoCall() {
    if (!activeCall) {
      return;
    }

    const confirmed =
      window.confirm(
        "End this video call for everyone?"
      );

    if (!confirmed) {
      return;
    }

    setCallBusy(true);
    setCallError("");

    const {
      error,
    } =
      await supabase
        .from("board_calls")
        .update({
          active: false,
          ended_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          activeCall.id
        );

    if (error) {
      setCallError(
        error.message
      );
      setCallBusy(false);
      return;
    }

    await postCallMessage(
      "📴 Video call ended."
    );

    disposeJitsi();
    setActiveCall(null);
    setCallOpen(false);
    setCallBusy(false);
  }

  function closeVideoPanel() {
    disposeJitsi();
    setCallOpen(false);
  }

  function disposeJitsi() {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }

    if (videoContainerRef.current) {
      videoContainerRef.current.innerHTML =
        "";
    }
  }

  async function loadJaasScript(
    appId: string
  ) {
    if (window.JitsiMeetExternalAPI) {
      return;
    }

    const scriptId =
      "jaas-external-api";

    const existing =
      document.getElementById(
        scriptId
      ) as HTMLScriptElement | null;

    if (existing) {
      await new Promise<void>(
        (resolve, reject) => {
          if (
            window.JitsiMeetExternalAPI
          ) {
            resolve();
            return;
          }

          existing.addEventListener(
            "load",
            () => resolve(),
            { once: true }
          );

          existing.addEventListener(
            "error",
            () =>
              reject(
                new Error(
                  "Could not load JaaS."
                )
              ),
            { once: true }
          );
        }
      );

      return;
    }

    await new Promise<void>(
      (resolve, reject) => {
        const script =
          document.createElement(
            "script"
          );

        script.id = scriptId;
        script.src = `https://8x8.vc/${appId}/external_api.js`;
        script.async = true;
        script.onload = () =>
          resolve();
        script.onerror = () =>
          reject(
            new Error(
              "Could not load JaaS."
            )
          );

        document.body.appendChild(
          script
        );
      }
    );
  }

  function formatMessageTime(
    createdAt: string
  ) {
    const date =
      new Date(
        createdAt
      );

    return date.toLocaleString(
      undefined,
      {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute:
          "2-digit",
      }
    );
  }

  function getDisplayName(
    email:
      string | null
  ) {
    if (!email) {
      return "Member";
    }

    return email.split(
      "@"
    )[0];
  }

  if (loading) {
    return (
      <main
        className="min-h-screen p-8"
        style={wallpaperStyle}
      >
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-10 w-64 rounded bg-slate-300" />

          <div className="mt-8 h-[650px] rounded-3xl bg-slate-200" />
        </div>
      </main>
    );
  }

  return (
    <main
      className="touchbase-font-preferences flex min-h-screen flex-col"
      style={{ ...wallpaperStyle, ...fontPreferenceStyle }}
    >
        <style>{FONT_PREFERENCE_CSS}</style>
      <div className="hidden border-b border-white/30 bg-white/90 backdrop-blur md:block">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
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

          <div className="flex items-center gap-2">
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
                  `/protected/boards/${boardId}/calendar`
                )
              }
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-95"
              style={{ backgroundColor: tabColor }}
            >
              Calendar
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/protected/settings/preferences"
                )
              }
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-95"
              style={{ backgroundColor: tabColor }}
            >
              Preferences
            </button>

            {activeCall ? (
              <button
                type="button"
                onClick={
                  joinVideoCall
                }
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                🎥 Join call
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  startVideoCall
                }
                disabled={
                  callBusy
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {callBusy
                  ? "Starting..."
                  : "🎥 Start call"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 pb-28 sm:px-6 sm:py-8 md:pb-8">
        <div
          className="mb-5 rounded-2xl p-5 shadow-sm backdrop-blur"
          style={{
            backgroundColor:
              panelBackgroundColor,
          }}
        >
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
            Messenger
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {board?.name ||
              "Board"}{" "}
            · Team conversation
          </p>

          <div className="mt-4 md:hidden">
            {activeCall ? (
              <button
                type="button"
                onClick={joinVideoCall}
                className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                🎥 Join video call
              </button>
            ) : (
              <button
                type="button"
                onClick={startVideoCall}
                disabled={callBusy}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {callBusy
                  ? "Starting..."
                  : "🎥 Start video call"}
              </button>
            )}
          </div>
        </div>

        {callError && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {callError}
          </div>
        )}

        {activeCall && (
          <div className="mb-5 overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-green-50 px-5 py-4">
              <div>
                <p className="font-semibold text-green-900">
                  🎥 Video call active
                </p>

                <p className="mt-1 text-xs text-green-700">
                  Started by{" "}
                  {getDisplayName(
                    activeCall.started_by_email
                  )}
                  {" · "}
                  {formatMessageTime(
                    activeCall.created_at
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {!callOpen && (
                  <button
                    type="button"
                    onClick={
                      joinVideoCall
                    }
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Join call
                  </button>
                )}

                {callOpen && (
                  <button
                    type="button"
                    onClick={
                      closeVideoPanel
                    }
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Hide video
                  </button>
                )}

                {(activeCall.started_by ===
                  currentUserId ||
                  board?.user_id ===
                    currentUserId) && (
                  <button
                    type="button"
                    onClick={
                      endVideoCall
                    }
                    disabled={
                      callBusy
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    End call
                  </button>
                )}
              </div>
            </div>

            {callOpen && (
              <div className="bg-slate-950 p-2">
                <div
                  ref={
                    videoContainerRef
                  }
                  className="min-h-[620px] w-full overflow-hidden rounded-xl bg-black"
                />
              </div>
            )}
          </div>
        )}

        <div
          className="flex min-h-[650px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/50 shadow-xl backdrop-blur-md"
          style={{
            backgroundColor:
              panelBackgroundColor,
          }}
        >
          <div
            className="border-b border-slate-200/70 px-6 py-4 backdrop-blur-sm"
            style={{
              backgroundColor:
                panelBackgroundSoft,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Board chat
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Messages are
                  visible to board
                  members.
                </p>
              </div>

              <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                ● Live
              </div>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto p-6"
            style={{
              backgroundColor:
                panelBackgroundSoft,
            }}
          >
            {messages.length ===
            0 ? (
              <div className="flex h-full min-h-80 items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl">
                    💬
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-800">
                    No messages yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Start the
                    conversation with
                    your board members.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map(
                  (
                    message
                  ) => {
                    const isMine =
                      message.user_id ===
                      currentUserId;

                    return (
                      <div
                        key={
                          message.id
                        }
                        className={`flex ${
                          isMine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[78%] ${
                            isMine
                              ? "items-end"
                              : "items-start"
                          } flex flex-col`}
                        >
                          <div className="mb-1 flex items-center gap-2 px-1">
                            <span className="text-xs font-medium text-slate-500">
                              {isMine
                                ? "You"
                                : getDisplayName(
                                    message.sender_email
                                  )}
                            </span>

                            <span className="text-[11px] text-slate-400">
                              {formatMessageTime(
                                message.created_at
                              )}
                            </span>
                          </div>

                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                              isMine
                                ? "rounded-br-md text-white"
                                : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                            }`}
                            style={
                              isMine
                                ? { backgroundColor: accentColor }
                                : undefined
                            }
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {
                                message.message
                              }
                            </p>
                          </div>

                          {isMine && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteMessage(
                                  message
                                )
                              }
                              className="mt-1 px-1 text-xs text-slate-400 hover:text-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}

                <div
                  ref={
                    messagesEndRef
                  }
                />
              </div>
            )}
          </div>

          <div
            className="border-t border-slate-200/80 p-4 backdrop-blur-sm"
            style={{
              backgroundColor:
                panelBackgroundColor,
            }}
          >
            {errorMessage && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {
                  errorMessage
                }
              </p>
            )}

            <div className="flex items-end gap-3">
              <textarea
                value={
                  newMessage
                }
                onChange={(
                  event
                ) =>
                  setNewMessage(
                    event.target.value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    sendMessage();
                  }
                }}
                rows={2}
                placeholder="Write a message..."
                className="max-h-36 flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={
                  sendMessage
                }
                disabled={
                  sending ||
                  !newMessage.trim()
                }
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {sending
                  ? "Sending..."
                  : "Send"}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Enter to send ·
              Shift + Enter for a
              new line
            </p>

            {currentUserEmail && (
              <p className="mt-1 text-xs text-slate-400">
                Signed in as{" "}
                {
                  currentUserEmail
                }
              </p>
            )}
          </div>
        </div>
      </div>


      {mobileMoreOpen && (
        <div className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:hidden">
          <div className="grid gap-2">
            {activeCall ? (
              <button type="button" onClick={() => { setMobileMoreOpen(false); joinVideoCall(); }} className="rounded-xl bg-green-600 px-4 py-3 text-left text-sm font-semibold text-white">🎥 Join call</button>
            ) : (
              <button type="button" onClick={() => { setMobileMoreOpen(false); startVideoCall(); }} disabled={callBusy} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: accentColor }}>{callBusy ? "Starting..." : "🎥 Start call"}</button>
            )}
            <button type="button" onClick={() => router.push("/protected/boards")} className="rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800">All boards</button>
            <button type="button" onClick={() => router.push("/protected/settings/preferences")} className="rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800">Preferences</button>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          <button type="button" onClick={() => router.push(`/protected/boards/${boardId}`)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><span className="text-lg">▦</span><span>Board</span></button>
          <button type="button" onClick={() => router.push(`/protected/boards/${boardId}/calendar`)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><span className="text-lg">▣</span><span>Calendar</span></button>
          <button type="button" onClick={() => setMobileMoreOpen(false)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-white" style={{ backgroundColor: accentColor }}><span className="text-lg">✉</span><span>Chat</span></button>
          <button type="button" onClick={() => setMobileMoreOpen((current) => !current)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><span className="text-lg">•••</span><span>More</span></button>
        </div>
      </div>

    </main>
  );
}