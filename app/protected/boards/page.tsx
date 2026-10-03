"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WALLPAPER_OPTIONS } from "@/lib/preferences/options";

type BoardTileColor =
  | "slate"
  | "blue"
  | "green"
  | "amber"
  | "rose";

type Board = {
  id: number;
  name: string;
  user_id: string;
  board_color: BoardTileColor | null;
  board_opacity: number | null;
};

type Priority =
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | null;

type Card = {
  id: number;
  status: string;
  board_id: number;
  user_id: string;
  priority: Priority;
};

type BoardStats = {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  highestPriority: Priority;
};

type BoardLink = {
  id: number;
  board_id: number;
  user_id: string;
  label: string | null;
  url: string;
  created_at: string;
};

type Wallpaper = string;

type FontColor =
  | "dark"
  | "slate"
  | "white"
  | "blue"
  | "green"
  | "amber"
  | "rose";


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

type UserPreferences = {
  wallpaper: Wallpaper;
  accent_color: AccentColor;
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
  green: "#15803d",
  amber: "#b45309",
  rose: "#be123c",
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

const BOARD_TILE_COLORS: Record<
  BoardTileColor,
  [number, number, number]
> = {
  slate: [100, 116, 139],
  blue: [59, 130, 246],
  green: [34, 197, 94],
  amber: [245, 158, 11],
  rose: [244, 63, 94],
};

const BOARD_TILE_OPTIONS: {
  id: BoardTileColor;
  name: string;
  swatch: string;
}[] = [
  {
    id: "slate",
    name: "Slate",
    swatch: "#64748b",
  },
  {
    id: "blue",
    name: "Blue",
    swatch: "#3b82f6",
  },
  {
    id: "green",
    name: "Green",
    swatch: "#22c55e",
  },
  {
    id: "amber",
    name: "Amber",
    swatch: "#f59e0b",
  },
  {
    id: "rose",
    name: "Rose",
    swatch: "#f43f5e",
  },
];


function getPriorityRank(
  priority: Priority
) {
  switch (priority) {
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function getPriorityPillStyle(
  priority: Priority
): React.CSSProperties | undefined {
  switch (priority) {
    case "low":
      return {
        background:
          "rgba(148, 163, 184, 0.22)",
        borderColor:
          "rgba(148, 163, 184, 0.55)",
      };

    case "medium":
      return {
        background:
          "rgba(59, 130, 246, 0.20)",
        borderColor:
          "rgba(59, 130, 246, 0.55)",
      };

    case "high":
      return {
        background:
          "rgba(249, 115, 22, 0.22)",
        borderColor:
          "rgba(249, 115, 22, 0.58)",
      };

    case "urgent":
      return {
        background:
          "rgba(239, 68, 68, 0.24)",
        borderColor:
          "rgba(239, 68, 68, 0.62)",
      };

    default:
      return undefined;
  }
}

function getBoardCardBackground(
  board: Board
) {
  const color =
    board.board_color || "slate";

  const opacity =
    typeof board.board_opacity === "number"
      ? Math.min(
          100,
          Math.max(
            0,
            board.board_opacity
          )
        )
      : 35;

  const [r, g, b] =
    BOARD_TILE_COLORS[color];

  const alpha =
    0.08 +
    (opacity / 100) * 0.7;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function BoardsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [boards, setBoards] = useState<Board[]>([]);

  const [boardStats, setBoardStats] = useState<
    Record<number, BoardStats>
  >({});

  const [boardLinks, setBoardLinks] = useState<
    Record<number, BoardLink[]>
  >({});

  const [linkTarget, setLinkTarget] =
    useState<Board | null>(null);

  const [linkLabel, setLinkLabel] =
    useState("");

  const [linkUrl, setLinkUrl] =
    useState("");

  const [linkError, setLinkError] =
    useState("");

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [userEmail, setUserEmail] = useState("");

  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [newBoardName, setNewBoardName] =
    useState("");

  const [renameTarget, setRenameTarget] =
    useState<Board | null>(null);

  const [renameValue, setRenameValue] =
    useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<Board | null>(null);

  const [preferences, setPreferences] =
    useState<UserPreferences>({
      wallpaper: "default",
      accent_color: "blue",
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
          backgroundImage: `url("${natureWallpaper.image}")`,
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

  const panelAlpha =
    0.12 +
    (Math.min(
      100,
      Math.max(0, preferences.panel_opacity)
    ) /
      100) *
      0.7;

  const panelBackgroundColor =
    `rgba(255, 255, 255, ${panelAlpha})`;

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
    initializeDashboard();
  }, []);

  async function initializeDashboard() {
    setLoading(true);

    const user = await getCurrentUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setCurrentUserId(user.id);
    setUserEmail(user.email || "");

    await Promise.all([
      loadBoardsAndStats(),
      loadPreferences(user.id),
    ]);

    setLoading(false);
  }

  async function getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  }

  async function loadPreferences(userId: string) {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("wallpaper, accent_color, panel_opacity, font_color, font_size")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(
        "Error loading preferences:",
        error
      );
      return;
    }

    if (!data) return;

    setPreferences({
      wallpaper:
        (data.wallpaper as Wallpaper) || "default",

      accent_color:
        (data.accent_color as AccentColor) || "blue",

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

  async function loadBoardsAndStats() {
    const {
      data: boardsData,
      error: boardsError,
    } = await supabase
      .from("boards")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (boardsError) {
      alert(
        `Error loading boards: ${boardsError.message}`
      );
      return;
    }

    const availableBoards =
      (boardsData || []) as Board[];

    if (availableBoards.length === 0) {
      setBoards([]);
      setBoardStats({});
      setBoardLinks({});
      return;
    }

    const boardIds = availableBoards.map(
      (board) => board.id
    );

    const {
      data: cardsData,
      error: cardsError,
    } = await supabase
      .from("cards")
      .select(
        "id, status, board_id, user_id, priority"
      )
      .in("board_id", boardIds);

    if (cardsError) {
      alert(
        `Error loading card totals: ${cardsError.message}`
      );
      return;
    }

    const stats: Record<
      number,
      BoardStats
    > = {};

    availableBoards.forEach((board) => {
      stats[board.id] = {
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        highestPriority: null,
      };
    });

    (cardsData || []).forEach(
      (card: Card) => {
        if (
          !card.board_id ||
          !stats[card.board_id]
        ) {
          return;
        }

        stats[card.board_id].total += 1;

        if (
          getPriorityRank(card.priority) >
          getPriorityRank(
            stats[card.board_id]
              .highestPriority
          )
        ) {
          stats[
            card.board_id
          ].highestPriority =
            card.priority;
        }

        if (card.status === "todo") {
          stats[card.board_id].todo += 1;
        }

        if (
          card.status === "in_progress"
        ) {
          stats[
            card.board_id
          ].inProgress += 1;
        }

        if (card.status === "done") {
          stats[card.board_id].done += 1;
        }
      }
    );

    const {
      data: linksData,
      error: linksError,
    } = await supabase
      .from("board_links")
      .select("*")
      .in("board_id", boardIds)
      .order("created_at", {
        ascending: true,
      });

    if (linksError) {
      console.error(
        "Error loading board links:",
        linksError.message
      );
    }

    const linksByBoard: Record<
      number,
      BoardLink[]
    > = {};

    availableBoards.forEach(
      (board) => {
        linksByBoard[board.id] = [];
      }
    );

    (linksData || []).forEach(
      (link: BoardLink) => {
        if (
          linksByBoard[
            link.board_id
          ]
        ) {
          linksByBoard[
            link.board_id
          ].push(link);
        }
      }
    );

    setBoards(availableBoards);
    setBoardStats(stats);
    setBoardLinks(linksByBoard);
  }

  function openCreateModal() {
    setNewBoardName("");
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
    setNewBoardName("");
  }

  async function createBoard() {
    const trimmedName =
      newBoardName.trim();

    if (!trimmedName) return;

    const user = await getCurrentUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const {
      data: board,
      error: boardError,
    } = await supabase
      .from("boards")
      .insert({
        name: trimmedName,
        user_id: user.id,
        board_color: "slate",
        board_opacity: 35,
      })
      .select()
      .single();

    if (boardError) {
      alert(
        `Error creating board: ${boardError.message}`
      );
      return;
    }

    const { error: memberError } =
      await supabase
        .from("board_members")
        .insert({
          board_id: board.id,
          user_id: user.id,
          role: "owner",
          email: user.email ?? null,
        });

    if (memberError) {
      await supabase
        .from("boards")
        .delete()
        .eq("id", board.id)
        .eq("user_id", user.id);

      alert(
        `Error creating owner membership: ${memberError.message}`
      );
      return;
    }

    setBoards((currentBoards) => [
      board,
      ...currentBoards,
    ]);

    setBoardStats((currentStats) => ({
      ...currentStats,
      [board.id]: {
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        highestPriority: null,
      },
    }));

    setBoardLinks((currentLinks) => ({
      ...currentLinks,
      [board.id]: [],
    }));

    closeCreateModal();
  }

  function openRenameModal(board: Board) {
    if (
      board.user_id !== currentUserId
    ) {
      return;
    }

    setRenameTarget(board);
    setRenameValue(board.name);
  }

  function closeRenameModal() {
    setRenameTarget(null);
    setRenameValue("");
  }

  async function saveRename() {
    if (!renameTarget) return;

    const trimmedName =
      renameValue.trim();

    if (!trimmedName) return;

    const user = await getCurrentUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (
      renameTarget.user_id !== user.id
    ) {
      alert(
        "Only the board owner can rename this board."
      );

      closeRenameModal();
      return;
    }

    const { error } = await supabase
      .from("boards")
      .update({
        name: trimmedName,
      })
      .eq("id", renameTarget.id)
      .eq("user_id", user.id);

    if (error) {
      alert(
        `Error renaming board: ${error.message}`
      );
      return;
    }

    setBoards((currentBoards) =>
      currentBoards.map((board) =>
        board.id === renameTarget.id
          ? {
              ...board,
              name: trimmedName,
            }
          : board
      )
    );

    closeRenameModal();
  }

  async function confirmDeleteBoard() {
    if (!deleteTarget) return;

    const user = await getCurrentUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (
      deleteTarget.user_id !== user.id
    ) {
      alert(
        "Only the board owner can delete this board."
      );

      setDeleteTarget(null);
      return;
    }

    const { error: boardError } =
      await supabase
        .from("boards")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("user_id", user.id);

    if (boardError) {
      alert(
        `Error deleting board: ${boardError.message}`
      );
      return;
    }

    setBoards((currentBoards) =>
      currentBoards.filter(
        (board) =>
          board.id !== deleteTarget.id
      )
    );

    setBoardStats((currentStats) => {
      const updatedStats = {
        ...currentStats,
      };

      delete updatedStats[
        deleteTarget.id
      ];

      return updatedStats;
    });

    setBoardLinks((currentLinks) => {
      const updatedLinks = {
        ...currentLinks,
      };

      delete updatedLinks[
        deleteTarget.id
      ];

      return updatedLinks;
    });

    setDeleteTarget(null);
  }

  function normalizeHttpUrl(
    value: string
  ) {
    const trimmed =
      value.trim();

    if (!trimmed) {
      return null;
    }

    const candidate =
      /^https?:\/\//i.test(
        trimmed
      )
        ? trimmed
        : `https://${trimmed}`;

    try {
      const parsed =
        new URL(candidate);

      if (
        parsed.protocol !== "http:" &&
        parsed.protocol !== "https:"
      ) {
        return null;
      }

      return parsed.toString();
    } catch {
      return null;
    }
  }

  function getLinkLabel(
    link: BoardLink
  ) {
    if (link.label?.trim()) {
      return link.label.trim();
    }

    try {
      return new URL(
        link.url
      ).hostname;
    } catch {
      return link.url;
    }
  }

  function getLinkIconUrl(
    url: string
  ) {
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(
      url
    )}&sz=64`;
  }

  function openLinkModal(
    board: Board
  ) {
    setLinkTarget(board);
    setLinkLabel("");
    setLinkUrl("");
    setLinkError("");
  }

  function closeLinkModal() {
    setLinkTarget(null);
    setLinkLabel("");
    setLinkUrl("");
    setLinkError("");
  }

  async function addBoardLink() {
    if (!linkTarget) return;

    const user =
      await getCurrentUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const normalizedUrl =
      normalizeHttpUrl(
        linkUrl
      );

    if (!normalizedUrl) {
      setLinkError(
        "Enter a valid web address."
      );
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("board_links")
      .insert({
        board_id:
          linkTarget.id,
        user_id:
          user.id,
        label:
          linkLabel.trim() ||
          null,
        url:
          normalizedUrl,
      })
      .select()
      .single();

    if (error) {
      setLinkError(
        error.message
      );
      return;
    }

    setBoardLinks(
      (currentLinks) => ({
        ...currentLinks,
        [linkTarget.id]: [
          ...(
            currentLinks[
              linkTarget.id
            ] || []
          ),
          data as BoardLink,
        ],
      })
    );

    closeLinkModal();
  }

  async function deleteBoardLink(
    link: BoardLink
  ) {
    const user =
      await getCurrentUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (
      link.user_id !== user.id
    ) {
      alert(
        "You can only delete links that you added."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${getLinkLabel(
          link
        )}?`
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("board_links")
        .delete()
        .eq("id", link.id)
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      alert(
        `Error deleting link: ${error.message}`
      );
      return;
    }

    setBoardLinks(
      (currentLinks) => ({
        ...currentLinks,
        [link.board_id]:
          (
            currentLinks[
              link.board_id
            ] || []
          ).filter(
            (item) =>
              item.id !==
              link.id
          ),
      })
    );
  }

  function setBoardAppearanceLocal(
    boardId: number,
    updates: Partial<
      Pick<
        Board,
        "board_color" | "board_opacity"
      >
    >
  ) {
    setBoards((currentBoards) =>
      currentBoards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              ...updates,
            }
          : board
      )
    );
  }

  async function saveBoardAppearance(
    board: Board,
    updates: {
      board_color?: BoardTileColor;
      board_opacity?: number;
    }
  ) {
    if (
      board.user_id !== currentUserId
    ) {
      return;
    }

    const { error } = await supabase
      .from("boards")
      .update(updates)
      .eq("id", board.id)
      .eq(
        "user_id",
        board.user_id
      );

    if (error) {
      alert(
        `Error saving board appearance: ${error.message}`
      );

      await loadBoardsAndStats();
    }
  }

  function openBoard(boardId: number) {
    router.push(
      `/protected/boards/${boardId}`
    );
  }

  async function logout() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      alert(
        `Error logging out: ${error.message}`
      );
      return;
    }

    router.push("/auth/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main
        className="min-h-screen"
        style={wallpaperStyle}
      >
        <div className="border-b border-white/30 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
            <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />

            <div className="h-9 w-24 animate-pulse rounded bg-slate-200" />
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-8">
          <div className="animate-pulse rounded-3xl bg-white/70 p-8 shadow-sm backdrop-blur">
            <div className="h-8 w-48 rounded bg-slate-200" />

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="h-52 rounded-2xl bg-white/80" />
              <div className="h-52 rounded-2xl bg-white/80" />
              <div className="h-52 rounded-2xl bg-white/80" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main
        className="touchbase-font-preferences min-h-screen"
        style={{ ...wallpaperStyle, ...fontPreferenceStyle }}
      >
        <style>{FONT_PREFERENCE_CSS}</style>
        {/* TOP NAVIGATION */}

        <div className="border-b border-white/30 bg-white/90 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/protected/boards"
                )
              }
              className="text-lg font-bold text-slate-900"
            >
              TouchBase
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-xs text-slate-400">
                  Signed in as
                </p>

                <p className="text-sm font-medium text-slate-700">
                  {userEmail}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/protected/settings/preferences"
                  )
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                style={{ backgroundColor: accentColor }}
              >
                Preferences
              </button>

              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                style={{ backgroundColor: accentColor }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}

        <div className="mx-auto max-w-7xl p-6 sm:p-8">
          <div
            className="overflow-visible rounded-3xl border border-white/40 p-6 shadow-xl backdrop-blur-md sm:p-8"
            style={{
              backgroundColor: panelBackgroundColor,
            }}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Your boards
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                  Create boards and
                  collaborate on boards
                  shared with you.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{
                  backgroundColor:
                    accentColor,
                }}
              >
                + Create Board
              </button>
            </div>

            {boards.length === 0 ? (
              <div
                className="mt-10 rounded-2xl border border-dashed border-white/45 p-10 text-center shadow-sm backdrop-blur-md"
                style={{
                  backgroundColor: panelBackgroundColor,
                }}
              >
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white"
                  style={{
                    backgroundColor:
                      accentColor,
                  }}
                >
                  +
                </div>

                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  No boards yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create your first board
                  and start organizing
                  tasks.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                  style={{
                    backgroundColor:
                      accentColor,
                  }}
                >
                  Create your first board
                </button>
              </div>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {boards.map((board) => {
                  const stats =
                    boardStats[
                      board.id
                    ] || {
                      total: 0,
                      todo: 0,
                      inProgress: 0,
                      done: 0,
                      highestPriority: null,
                    };

                  const isOwner =
                    board.user_id ===
                    currentUserId;

                  const links =
                    boardLinks[
                      board.id
                    ] || [];

                  return (
                    <div
                      key={board.id}
                      className="group relative overflow-visible rounded-2xl border border-white/45 shadow-md backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl"
                      style={{
                        backgroundColor:
                          getBoardCardBackground(
                            board
                          ),
                      }}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openBoard(board.id)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.target !== event.currentTarget
                          ) {
                            return;
                          }

                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            openBoard(board.id);
                          }
                        }}
                        className="w-full cursor-pointer p-6 text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="text-xl font-bold text-slate-900">
                            {board.name}
                          </h2>

                          <div className="relative flex shrink-0 items-center gap-2">
                            <div className="group/count relative">
                              <button
                                type="button"
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition ${
                                  stats.highestPriority
                                    ? "border-current"
                                    : "border-white/70 bg-white/80 hover:bg-white"
                                }`}
                                style={
                                  getPriorityPillStyle(
                                    stats.highestPriority
                                  )
                                }
                                aria-label={`Show ${board.name} card totals`}
                              >
                                {stats.total}{" "}
                                {stats.total === 1
                                  ? "card"
                                  : "cards"}
                              </button>

                              <div
                                className="invisible absolute right-full top-0 z-[100] mr-2 min-w-max translate-x-1 rounded-2xl border border-white/70 bg-white/90 p-2 opacity-0 shadow-xl backdrop-blur-xl transition-all duration-150 group-hover/count:visible group-hover/count:translate-x-0 group-hover/count:opacity-100 group-focus-within/count:visible group-focus-within/count:translate-x-0 group-focus-within/count:opacity-100"
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                              >
                                <div className="flex flex-col items-start gap-2 text-xs">
                                  <span
                                    className={`rounded-full px-2.5 py-1 ${
                                      stats.todo > 0
                                        ? "font-semibold text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                    style={
                                      stats.todo > 0
                                        ? {
                                            backgroundColor:
                                              accentColor,
                                          }
                                        : undefined
                                    }
                                  >
                                    {stats.todo} To Do
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-1 ${
                                      stats.inProgress > 0
                                        ? "font-semibold text-white shadow-sm"
                                        : "bg-blue-50 text-blue-700"
                                    }`}
                                    style={
                                      stats.inProgress > 0
                                        ? {
                                            backgroundColor:
                                              accentColor,
                                          }
                                        : undefined
                                    }
                                  >
                                    {stats.inProgress} In Progress
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-1 ${
                                      stats.done > 0
                                        ? "font-semibold text-white shadow-sm"
                                        : "bg-green-50 text-green-700"
                                    }`}
                                    style={
                                      stats.done > 0
                                        ? {
                                            backgroundColor:
                                              accentColor,
                                          }
                                        : undefined
                                    }
                                  >
                                    {stats.done} Done
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="group/menu relative">
                              <button
                                type="button"
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/75 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:shadow-md"
                                aria-label={`Open ${board.name} menu`}
                              >
                              <span className="flex flex-col gap-[3px]">
                                <span className="h-[2px] w-4 rounded-full bg-current" />
                                <span className="h-[2px] w-4 rounded-full bg-current" />
                                <span className="h-[2px] w-4 rounded-full bg-current" />
                              </span>
                            </button>

                            <div
                              className="invisible absolute bottom-full right-0 z-[100] mb-2 min-w-max translate-y-1 rounded-2xl border border-white/70 bg-white/90 p-2 text-left opacity-0 shadow-xl backdrop-blur-xl transition-all duration-150 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100"
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                            >
                              <div className="flex flex-col items-start gap-2">
                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openRenameModal(
                                        board
                                      )
                                    }
                                    className="inline-flex w-auto items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                                    style={{
                                      backgroundColor:
                                        accentColor,
                                    }}
                                  >
                                    Rename board
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    openLinkModal(
                                      board
                                    )
                                  }
                                  className="inline-flex w-auto items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                                  style={{
                                    backgroundColor:
                                      accentColor,
                                  }}
                                >
                                  + Add link
                                </button>

                                {isOwner && (
                                  <div className="group/preferences relative">
                                    <button
                                      type="button"
                                      className="inline-flex w-auto items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                                      style={{
                                        backgroundColor:
                                          accentColor,
                                      }}
                                      aria-label={`Open ${board.name} preferences`}
                                    >
                                      Preferences
                                      <span aria-hidden="true">
                                        ◀
                                      </span>
                                    </button>

                                    <div
                                      className="invisible absolute right-full top-0 z-[120] mr-2 w-52 translate-x-1 rounded-2xl border border-white/70 bg-white/95 p-3 opacity-0 shadow-xl backdrop-blur-xl transition-all duration-150 group-hover/preferences:visible group-hover/preferences:translate-x-0 group-hover/preferences:opacity-100 group-focus-within/preferences:visible group-focus-within/preferences:translate-x-0 group-focus-within/preferences:opacity-100"
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                    >
                                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Board colour
                                      </p>

                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {BOARD_TILE_OPTIONS.map(
                                          (option) => (
                                            <button
                                              key={
                                                option.id
                                              }
                                              type="button"
                                              onClick={() => {
                                                setBoardAppearanceLocal(
                                                  board.id,
                                                  {
                                                    board_color:
                                                      option.id,
                                                  }
                                                );

                                                void saveBoardAppearance(
                                                  board,
                                                  {
                                                    board_color:
                                                      option.id,
                                                  }
                                                );
                                              }}
                                              className={`h-7 w-7 rounded-full border-2 shadow-sm transition hover:scale-110 ${
                                                (board.board_color ||
                                                  "slate") ===
                                                option.id
                                                  ? "border-slate-900"
                                                  : "border-white"
                                              }`}
                                              style={{
                                                backgroundColor:
                                                  option.swatch,
                                              }}
                                              title={
                                                option.name
                                              }
                                              aria-label={`Set ${board.name} colour to ${option.name}`}
                                            />
                                          )
                                        )}
                                      </div>

                                      <div className="mt-3 flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-semibold text-slate-500">
                                          Transparency
                                        </span>

                                        <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                          {typeof board.board_opacity ===
                                          "number"
                                            ? board.board_opacity
                                            : 35}
                                          %
                                        </span>
                                      </div>

                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={
                                          typeof board.board_opacity ===
                                          "number"
                                            ? board.board_opacity
                                            : 35
                                        }
                                        onClick={(event) =>
                                          event.stopPropagation()
                                        }
                                        onChange={(event) => {
                                          const nextOpacity =
                                            Number(
                                              event.target
                                                .value
                                            );

                                          setBoardAppearanceLocal(
                                            board.id,
                                            {
                                              board_opacity:
                                                nextOpacity,
                                            }
                                          );
                                        }}
                                        onPointerUp={(event) => {
                                          const nextOpacity =
                                            Number(
                                              event.currentTarget
                                                .value
                                            );

                                          void saveBoardAppearance(
                                            board,
                                            {
                                              board_opacity:
                                                nextOpacity,
                                            }
                                          );
                                        }}
                                        onKeyUp={(event) => {
                                          const nextOpacity =
                                            Number(
                                              event.currentTarget
                                                .value
                                            );

                                          void saveBoardAppearance(
                                            board,
                                            {
                                              board_opacity:
                                                nextOpacity,
                                            }
                                          );
                                        }}
                                        className="mt-2 w-full accent-blue-600"
                                      />
                                    </div>
                                  </div>
                                )}

                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteTarget(
                                        board
                                      )
                                    }
                                    className="inline-flex w-auto items-center rounded-lg bg-gradient-to-b from-red-400 via-red-500 to-red-700 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-md"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>

                              {links.length > 0 && (
                                <>
                                  <div className="my-2 border-t border-slate-200/80" />

                                  <p className="px-1 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                    Links
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    {links.map(
                                      (link) => (
                                        <div
                                          key={
                                            link.id
                                          }
                                          className="group/link relative"
                                        >
                                          <a
                                            href={
                                              link.url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                            title={getLinkLabel(
                                              link
                                            )}
                                          >
                                            <img
                                              src={getLinkIconUrl(
                                                link.url
                                              )}
                                              alt=""
                                              className="h-5 w-5 rounded-sm"
                                            />
                                            <span className="sr-only">
                                              {getLinkLabel(
                                                link
                                              )}
                                            </span>
                                          </a>

                                          {link.user_id ===
                                            currentUserId && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                deleteBoardLink(
                                                  link
                                                )
                                              }
                                              className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow group-hover/link:flex"
                                              title="Delete link"
                                            >
                                              ×
                                            </button>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                              </div>
                            </div>
                          </div>
                        </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE BOARD MODAL */}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Create board
              </h2>

              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                âœ•
              </button>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-700">
              Board name
            </label>

            <input
              autoFocus
              value={newBoardName}
              onChange={(event) =>
                setNewBoardName(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  createBoard();
                }
              }}
              placeholder="e.g. Website Project"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createBoard}
                className="rounded-lg px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                style={{
                  backgroundColor:
                    accentColor,
                }}
              >
                Create board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BOARD LINK MODAL */}

      {linkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add link
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {linkTarget.name}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeLinkModal
                }
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-700">
              Label
            </label>

            <input
              value={
                linkLabel
              }
              onChange={(event) =>
                setLinkLabel(
                  event.target.value
                )
              }
              placeholder="e.g. Google Drive"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <label className="mt-5 block text-sm font-medium text-slate-700">
              Web address
            </label>

            <input
              autoFocus
              value={
                linkUrl
              }
              onChange={(event) => {
                setLinkUrl(
                  event.target.value
                );
                setLinkError("");
              }}
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();
                  addBoardLink();
                }
              }}
              placeholder="https://example.com"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {linkError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {linkError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={
                  closeLinkModal
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  addBoardLink
                }
                className="rounded-lg px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                style={{
                  backgroundColor:
                    accentColor,
                }}
              >
                Add link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME BOARD MODAL */}

      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Rename board
              </h2>

              <button
                type="button"
                onClick={closeRenameModal}
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                âœ•
              </button>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-700">
              Board name
            </label>

            <input
              autoFocus
              value={renameValue}
              onChange={(event) =>
                setRenameValue(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  saveRename();
                }
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRenameModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveRename}
                className="rounded-lg px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                style={{
                  backgroundColor:
                    accentColor,
                }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE BOARD MODAL */}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">
              Delete board?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will permanently delete â€œ
              {deleteTarget.name}â€ and
              everything inside it.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteBoard}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Delete board
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
