"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

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

export default function MessengerClient({
  boardId,
}: {
  boardId: number;
}) {
  const router = useRouter();

  const supabase =
    createClient();

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

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

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
            loadMessages();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [boardId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    ]);

    setLoading(false);
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
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-10 w-64 rounded bg-slate-300" />

          <div className="mt-8 h-[650px] rounded-3xl bg-slate-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <div className="border-b border-slate-200 bg-white">
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
            ToutchBase
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/protected/boards/${boardId}`
                )
              }
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
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
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
        <div className="mb-5">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/protected/boards/${boardId}`
              )
            }
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to board
          </button>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Messenger
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {board?.name ||
              "Board"}{" "}
            · Team conversation
          </p>
        </div>

        <div className="flex min-h-[650px] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
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

          <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6">
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
                                ? "rounded-br-md bg-blue-600 text-white"
                                : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                            }`}
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

          <div className="border-t border-slate-200 bg-white p-4">
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
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
    </main>
  );
}