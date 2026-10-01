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
                roomName:
                  activeCall.room_name,
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
              roomName: `${result.appId}/${result.roomName}`,
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
    return `toutchbase-${boardId}-${crypto.randomUUID()}`;
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
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {callBusy
                  ? "Starting..."
                  : "🎥 Start call"}
              </button>
            )}
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