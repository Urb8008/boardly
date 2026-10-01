"use client";

import { useEffect, useState } from "react";
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
  status: string;
  board_id: number;
  user_id: string;
};

type BoardStats = {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
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
      .select("wallpaper, accent_color")
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
        "id, status, board_id, user_id"
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
        className="min-h-screen"
        style={wallpaperStyle}
      >
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
          <div className="rounded-3xl border border-white/40 bg-slate-100/42 p-6 shadow-xl backdrop-blur-md sm:p-8">
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
              <div className="mt-10 rounded-2xl border border-dashed border-white/45 bg-slate-100/50 p-10 text-center shadow-sm backdrop-blur-md">
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
                      className="group overflow-hidden rounded-2xl border border-white/45 bg-slate-100/58 shadow-md backdrop-blur-md transition hover:-translate-y-1 hover:bg-slate-100/68 hover:shadow-xl"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openBoard(board.id)
                        }
                        className="w-full p-6 text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className="text-xs font-semibold uppercase tracking-wide"
                                style={{
                                  color:
                                    accentColor,
                                }}
                              >
                                Board
                              </p>

                              {isOwner ? (
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                  Owner
                                </span>
                              ) : (
                                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                                  Shared
                                </span>
                              )}
                            </div>

                            <h2 className="mt-2 text-xl font-bold text-slate-900">
                              {board.name}
                            </h2>
                          </div>

                          <span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600">
                            â†’
                          </span>
                        </div>

                        <p className="mt-5 text-sm font-medium text-slate-700">
                          {stats.total}{" "}
                          {stats.total === 1
                            ? "card"
                            : "cards"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            {stats.todo} To Do
                          </span>

                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                            {
                              stats.inProgress
                            }{" "}
                            In Progress
                          </span>

                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                            {stats.done} Done
                          </span>
                        </div>
                      </button>

                      <div className="border-t border-slate-100 px-6 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Links
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              openLinkModal(
                                board
                              )
                            }
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                            style={{ backgroundColor: accentColor }}
                          >
                            + Add link
                          </button>
                        </div>

                        {links.length ===
                        0 ? (
                          <p className="mt-3 text-xs text-slate-400">
                            No links yet.
                          </p>
                        ) : (
                          <div className="mt-3 flex flex-col gap-2">
                            {links
                              .slice(0, 3)
                              .map(
                                (
                                  link
                                ) => (
                                  <div
                                    key={
                                      link.id
                                    }
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <a
                                      href={
                                        link.url
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="min-w-0 flex-1 truncate text-sm font-medium text-blue-700 hover:underline"
                                      title={
                                        link.url
                                      }
                                    >
                                      🔗{" "}
                                      {getLinkLabel(
                                        link
                                      )}
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
                                        className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700"
                                        title="Delete link"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                )
                              )}

                            {links.length >
                              3 && (
                              <p className="text-xs text-slate-400">
                                +
                                {links.length -
                                  3}{" "}
                                more
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 px-6 py-4">
                        {isOwner ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openRenameModal(
                                  board
                                )
                              }
                              className="rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:brightness-110"
                              style={{ backgroundColor: accentColor }}
                            >
                              Rename
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget(
                                  board
                                )
                              }
                              className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-slate-400">
                            Shared with you
                          </p>
                        )}
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
