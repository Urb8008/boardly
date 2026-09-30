"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

type BoardMembership = {
  board_id: number;
  role: string;
};

type BoardStats = {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
};

export default function BoardsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [boards, setBoards] =
    useState<Board[]>([]);

  const [boardStats, setBoardStats] =
    useState<Record<number, BoardStats>>({});

  const [boardRoles, setBoardRoles] =
    useState<Record<number, string>>({});

  const [userEmail, setUserEmail] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    isCreateModalOpen,
    setIsCreateModalOpen,
  ] = useState(false);

  const [
    newBoardName,
    setNewBoardName,
  ] = useState("");

  const [
    renameTarget,
    setRenameTarget,
  ] = useState<Board | null>(null);

  const [
    renameValue,
    setRenameValue,
  ] = useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<Board | null>(null);

  useEffect(() => {
    initializeDashboard();
  }, []);

  async function initializeDashboard() {
    setLoading(true);

    const user =
      await getCurrentUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setUserEmail(
      user.email || ""
    );

    await loadBoardsAndStats(
      user.id
    );

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

  async function loadBoardsAndStats(
    userId: string
  ) {
    // First load the boards this user
    // belongs to through board_members.
    const {
      data: membershipData,
      error: membershipError,
    } = await supabase
      .from("board_members")
      .select("board_id, role")
      .eq("user_id", userId);

    if (membershipError) {
      alert(
        `Error loading memberships: ${membershipError.message}`
      );
      return;
    }

    const memberships =
      (membershipData ||
        []) as BoardMembership[];

    const boardIds =
      memberships.map(
        (membership) =>
          membership.board_id
      );

    const roles: Record<
      number,
      string
    > = {};

    memberships.forEach(
      (membership) => {
        roles[
          membership.board_id
        ] = membership.role;
      }
    );

    setBoardRoles(roles);

    if (boardIds.length === 0) {
      setBoards([]);
      setBoardStats({});
      return;
    }

    // Load all boards the current
    // user is a member of.
    const {
      data: boardsData,
      error: boardsError,
    } = await supabase
      .from("boards")
      .select("*")
      .in("id", boardIds)
      .order("created_at", {
        ascending: false,
      });

    if (boardsError) {
      alert(
        `Error loading boards: ${boardsError.message}`
      );
      return;
    }

    // Load cards from all of those boards.
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

    (boardsData || []).forEach(
      (board) => {
        stats[board.id] = {
          total: 0,
          todo: 0,
          inProgress: 0,
          done: 0,
        };
      }
    );

    (cardsData || []).forEach(
      (card: Card) => {
        if (
          !card.board_id ||
          !stats[card.board_id]
        ) {
          return;
        }

        stats[
          card.board_id
        ].total += 1;

        if (
          card.status === "todo"
        ) {
          stats[
            card.board_id
          ].todo += 1;
        }

        if (
          card.status ===
          "in_progress"
        ) {
          stats[
            card.board_id
          ].inProgress += 1;
        }

        if (
          card.status === "done"
        ) {
          stats[
            card.board_id
          ].done += 1;
        }
      }
    );

    setBoards(
      boardsData || []
    );

    setBoardStats(stats);
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

    const user =
      await getCurrentUser();

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

    const {
      error: memberError,
    } = await supabase
      .from("board_members")
      .insert({
        board_id: board.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      await supabase
        .from("boards")
        .delete()
        .eq("id", board.id)
        .eq(
          "user_id",
          user.id
        );

      alert(
        `Error creating owner membership: ${memberError.message}`
      );
      return;
    }

    setBoards(
      (currentBoards) => [
        board,
        ...currentBoards,
      ]
    );

    setBoardRoles(
      (currentRoles) => ({
        ...currentRoles,
        [board.id]: "owner",
      })
    );

    setBoardStats(
      (currentStats) => ({
        ...currentStats,
        [board.id]: {
          total: 0,
          todo: 0,
          inProgress: 0,
          done: 0,
        },
      })
    );

    closeCreateModal();
  }

  function openRenameModal(
    board: Board
  ) {
    if (
      boardRoles[board.id] !==
      "owner"
    ) {
      return;
    }

    setRenameTarget(board);
    setRenameValue(
      board.name
    );
  }

  function closeRenameModal() {
    setRenameTarget(null);
    setRenameValue("");
  }

  async function saveRename() {
    if (!renameTarget)
      return;

    if (
      boardRoles[
        renameTarget.id
      ] !== "owner"
    ) {
      return;
    }

    const trimmedName =
      renameValue.trim();

    if (!trimmedName) return;

    const user =
      await getCurrentUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { error } =
      await supabase
        .from("boards")
        .update({
          name: trimmedName,
        })
        .eq(
          "id",
          renameTarget.id
        )
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      alert(
        `Error renaming board: ${error.message}`
      );
      return;
    }

    setBoards(
      (currentBoards) =>
        currentBoards.map(
          (board) =>
            board.id ===
            renameTarget.id
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
    if (!deleteTarget)
      return;

    if (
      boardRoles[
        deleteTarget.id
      ] !== "owner"
    ) {
      return;
    }

    const user =
      await getCurrentUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const {
      data: boardCards,
      error: cardLookupError,
    } = await supabase
      .from("cards")
      .select("id")
      .eq(
        "board_id",
        deleteTarget.id
      )
      .eq(
        "user_id",
        user.id
      );

    if (cardLookupError) {
      alert(
        `Error finding board cards: ${cardLookupError.message}`
      );
      return;
    }

    const cardIds =
      (boardCards || []).map(
        (card) => card.id
      );

    if (cardIds.length > 0) {
      const {
        error: checklistError,
      } = await supabase
        .from(
          "checklist_items"
        )
        .delete()
        .eq(
          "user_id",
          user.id
        )
        .in(
          "card_id",
          cardIds
        );

      if (checklistError) {
        alert(
          `Error deleting checklist items: ${checklistError.message}`
        );
        return;
      }

      const {
        error: commentsError,
      } = await supabase
        .from("comments")
        .delete()
        .eq(
          "user_id",
          user.id
        )
        .in(
          "card_id",
          cardIds
        );

      if (commentsError) {
        alert(
          `Error deleting comments: ${commentsError.message}`
        );
        return;
      }
    }

    const {
      error: cardsError,
    } = await supabase
      .from("cards")
      .delete()
      .eq(
        "board_id",
        deleteTarget.id
      )
      .eq(
        "user_id",
        user.id
      );

    if (cardsError) {
      alert(
        `Error deleting board cards: ${cardsError.message}`
      );
      return;
    }

    const {
      error: boardError,
    } = await supabase
      .from("boards")
      .delete()
      .eq(
        "id",
        deleteTarget.id
      )
      .eq(
        "user_id",
        user.id
      );

    if (boardError) {
      alert(
        `Error deleting board: ${boardError.message}`
      );
      return;
    }

    setBoards(
      (currentBoards) =>
        currentBoards.filter(
          (board) =>
            board.id !==
            deleteTarget.id
        )
    );

    setBoardStats(
      (currentStats) => {
        const updatedStats = {
          ...currentStats,
        };

        delete updatedStats[
          deleteTarget.id
        ];

        return updatedStats;
      }
    );

    setBoardRoles(
      (currentRoles) => {
        const updatedRoles = {
          ...currentRoles,
        };

        delete updatedRoles[
          deleteTarget.id
        ];

        return updatedRoles;
      }
    );

    setDeleteTarget(null);
  }

  function openBoard(
    boardId: number
  ) {
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

    router.push(
      "/auth/login"
    );
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
            <div className="text-lg font-bold text-slate-900">
              Boardly
            </div>

            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-slate-300" />

            <div className="mt-3 h-4 w-64 rounded bg-slate-200" />

            <div className="mt-8 h-11 w-36 rounded-lg bg-slate-300" />

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-48 rounded-2xl bg-slate-200" />
              <div className="h-48 rounded-2xl bg-slate-200" />
              <div className="h-48 rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-100">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
            <button
              onClick={() =>
                router.push(
                  "/protected/boards"
                )
              }
              className="text-lg font-bold text-slate-900"
            >
              Boardly
            </button>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-xs text-slate-400">
                  Signed in as
                </p>

                <p className="text-sm font-medium text-slate-700">
                  {userEmail}
                </p>
              </div>

              <button
                onClick={logout}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Log out
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Your boards
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Boards you own and
                boards shared with you.
              </p>
            </div>

            <button
              onClick={
                openCreateModal
              }
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              + Create Board
            </button>
          </div>

          {boards.length ===
          0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
                +
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No boards yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create a board or
                accept an invitation
                to a shared board.
              </p>

              <button
                onClick={
                  openCreateModal
                }
                className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create your first board
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {boards.map(
                (board) => {
                  const stats =
                    boardStats[
                      board.id
                    ] || {
                      total: 0,
                      todo: 0,
                      inProgress: 0,
                      done: 0,
                    };

                  const role =
                    boardRoles[
                      board.id
                    ];

                  const isOwner =
                    role ===
                    "owner";

                  return (
                    <div
                      key={
                        board.id
                      }
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <button
                        onClick={() =>
                          openBoard(
                            board.id
                          )
                        }
                        className="w-full p-6 text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                                Board
                              </p>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  isOwner
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-green-50 text-green-700"
                                }`}
                              >
                                {isOwner
                                  ? "Owner"
                                  : "Shared"}
                              </span>
                            </div>

                            <h2 className="mt-2 text-xl font-bold text-slate-900">
                              {
                                board.name
                              }
                            </h2>
                          </div>

                          <span className="text-lg text-slate-300 transition group-hover:text-slate-500">
                            →
                          </span>
                        </div>

                        <p className="mt-4 text-sm font-medium text-slate-700">
                          {
                            stats.total
                          }{" "}
                          {stats.total ===
                          1
                            ? "card"
                            : "cards"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            {
                              stats.todo
                            }{" "}
                            To Do
                          </span>

                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                            {
                              stats.inProgress
                            }{" "}
                            In Progress
                          </span>

                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                            {
                              stats.done
                            }{" "}
                            Done
                          </span>
                        </div>
                      </button>

                      {isOwner && (
                        <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-4">
                          <button
                            onClick={() =>
                              openRenameModal(
                                board
                              )
                            }
                            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                          >
                            Rename
                          </button>

                          <button
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
                      )}

                      {!isOwner && (
                        <div className="border-t border-slate-100 px-6 py-4">
                          <p className="text-sm text-slate-500">
                            Shared with
                            you
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </main>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Create board
              </h2>

              <button
                onClick={
                  closeCreateModal
                }
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-700">
              Board name
            </label>

            <input
              autoFocus
              value={
                newBoardName
              }
              onChange={(
                event
              ) =>
                setNewBoardName(
                  event.target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  createBoard();
                }
              }}
              placeholder="e.g. Website Project"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={
                  closeCreateModal
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={
                  createBoard
                }
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Create board
              </button>
            </div>
          </div>
        </div>
      )}

      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Rename board
              </h2>

              <button
                onClick={
                  closeRenameModal
                }
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-700">
              Board name
            </label>

            <input
              autoFocus
              value={
                renameValue
              }
              onChange={(
                event
              ) =>
                setRenameValue(
                  event.target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  saveRename();
                }
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={
                  closeRenameModal
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={
                  saveRename
                }
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">
              Delete board?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will permanently
              delete “
              {deleteTarget.name}”
              and everything inside
              it.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
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
                onClick={
                  confirmDeleteBoard
                }
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