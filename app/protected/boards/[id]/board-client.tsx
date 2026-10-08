"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WALLPAPER_OPTIONS } from "@/lib/preferences/options";

type Board = {
  id: number;
  name: string;
  user_id: string;
};

type BoardMember = {
  id: number;
  board_id: number;
  user_id: string;
  role: string;
  email: string | null;
  created_at: string;
};

type Priority =
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | null;

type CardStatus =
  | "todo"
  | "in_progress"
  | "done";

type Card = {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  status: string;
  position: number;
  user_id: string;
  board_id: number;
};

type ChecklistItem = {
  id: number;
  card_id: number;
  user_id: string;
  text: string;
  completed: boolean;
  position: number;
};

type Comment = {
  id: number;
  created_at: string;
  card_id: number;
  user_id: string;
  text: string;
};

type CardAttachment = {
  id: number;
  card_id: number;
  board_id: number;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

type CardLink = {
  id: number;
  card_id: number;
  board_id: number;
  user_id: string;
  label: string | null;
  url: string;
  created_at: string;
};

type BoardLink = {
  id: number;
  board_id: number;
  user_id: string;
  label: string | null;
  url: string;
  created_at: string;
};

type PendingCardLink = {
  label: string;
  url: string;
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

const WALLPAPER_STYLES: Record<
  string,
  string
> = {
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

function getWallpaperBackground(
  wallpaper: string
) {
  const natureWallpaper =
    WALLPAPER_OPTIONS.find(
      (option) =>
        option.id === wallpaper
    );

  if (natureWallpaper) {
    return `url("${natureWallpaper.image}")`;
  }

  return (
    WALLPAPER_STYLES[wallpaper] ||
    WALLPAPER_STYLES.default
  );
}


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

const ACCENT_COLORS: Record<
  AccentColor,
  string
> = {
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

const TAB_COLORS: Record<
  TabColor,
  string
> = {
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

type ModalChecklistItem = {
  id?: number;
  text: string;
  completed: boolean;
  position: number;
};

export default function BoardClient({
  boardId,
}: {
  boardId: number;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<string | null>(null);

  const [board, setBoard] =
    useState<Board | null>(null);

  const [
    boardMembers,
    setBoardMembers,
  ] = useState<BoardMember[]>([]);

  const [cards, setCards] =
    useState<Card[]>([]);

  const [
    checklistItems,
    setChecklistItems,
  ] = useState<ChecklistItem[]>([]);

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [
    boardLinks,
    setBoardLinks,
  ] = useState<BoardLink[]>([]);

  const [
    boardLinkLabel,
    setBoardLinkLabel,
  ] = useState("");

  const [
    boardLinkUrl,
    setBoardLinkUrl,
  ] = useState("");

  const [
    boardLinkError,
    setBoardLinkError,
  ] = useState("");

  const [
    isAddingBoardLink,
    setIsAddingBoardLink,
  ] = useState(false);

  const [
    isAddingBoardApp,
    setIsAddingBoardApp,
  ] = useState(false);

  const [
    boardAppName,
    setBoardAppName,
  ] = useState("");

  const [
    boardAppLaunchUrl,
    setBoardAppLaunchUrl,
  ] = useState("");

  const [
    boardAppFallbackUrl,
    setBoardAppFallbackUrl,
  ] = useState("");

  const [
    boardAppError,
    setBoardAppError,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    isCardModalOpen,
    setIsCardModalOpen,
  ] = useState(false);

  const [
    editingCard,
    setEditingCard,
  ] = useState<Card | null>(null);

  const [cardTitle, setCardTitle] =
    useState("");

  const [
    cardDescription,
    setCardDescription,
  ] = useState("");

  const [
    cardDueDate,
    setCardDueDate,
  ] = useState("");

  const [
    cardPriority,
    setCardPriority,
  ] = useState<Priority>("medium");

  const [
    newCardStatus,
    setNewCardStatus,
  ] = useState<CardStatus>("todo");

  const [
    deleteCardTarget,
    setDeleteCardTarget,
  ] = useState<Card | null>(null);

  const [
    modalChecklistItems,
    setModalChecklistItems,
  ] =
    useState<ModalChecklistItem[]>([]);

  const [
    newChecklistText,
    setNewChecklistText,
  ] = useState("");

  const [
    modalComments,
    setModalComments,
  ] = useState<Comment[]>([]);

  const [
    newCommentText,
    setNewCommentText,
  ] = useState("");

  const [
    modalAttachments,
    setModalAttachments,
  ] = useState<CardAttachment[]>([]);

  const [
    modalCardLinks,
    setModalCardLinks,
  ] = useState<CardLink[]>([]);

  const [
    pendingCardLinks,
    setPendingCardLinks,
  ] = useState<PendingCardLink[]>([]);

  const [
    cardLinkLabel,
    setCardLinkLabel,
  ] = useState("");

  const [
    cardLinkUrl,
    setCardLinkUrl,
  ] = useState("");

  const [
    cardLinkError,
    setCardLinkError,
  ] = useState("");

  const [
    pendingAttachmentFiles,
    setPendingAttachmentFiles,
  ] = useState<File[]>([]);

  const [
    isDraggingAttachment,
    setIsDraggingAttachment,
  ] = useState(false);

  const [
    isUploadingAttachments,
    setIsUploadingAttachments,
  ] = useState(false);

  const [
    isSavingCard,
    setIsSavingCard,
  ] = useState(false);

  const [
    cardSaveError,
    setCardSaveError,
  ] = useState("");

  const attachmentInputRef =
    useRef<HTMLInputElement | null>(null);

  const MAX_ATTACHMENT_SIZE =
    20 * 1024 * 1024;

  const [
    isInviteModalOpen,
    setIsInviteModalOpen,
  ] = useState(false);

  const [
    inviteEmail,
    setInviteEmail,
  ] = useState("");

  const [
    isSendingInvite,
    setIsSendingInvite,
  ] = useState(false);

  const [
    inviteMessage,
    setInviteMessage,
  ] = useState("");

  const [
    inviteError,
    setInviteError,
  ] = useState("");

  const [
    isMembersModalOpen,
    setIsMembersModalOpen,
  ] = useState(false);

  const [
    isLoadingMembers,
    setIsLoadingMembers,
  ] = useState(false);

  const [
    removingMemberId,
    setRemovingMemberId,
  ] = useState<string | null>(null);

  const [
    membersError,
    setMembersError,
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

  const isOwner =
    board !== null &&
    currentUserId !== null &&
    board.user_id === currentUserId;

  const wallpaperBackground =
    getWallpaperBackground(
      preferences.wallpaper
    );

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
    initializeBoard();
  }, []);

  async function getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      router.push("/auth/login");
      return null;
    }

    setCurrentUserId(user.id);

    return user;
  }

  async function initializeBoard() {
    setLoading(true);

    const user =
      await getCurrentUser();

    if (!user) {
      setLoading(false);
      return;
    }

    await Promise.all([
      loadBoard(),
      loadCards(),
      loadBoardLinks(),
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

  // -----------------------------------
  // LOAD BOARD
  // -----------------------------------

  async function loadBoard() {
    const { data, error } =
      await supabase
        .from("boards")
        .select("*")
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

  // -----------------------------------
  // LOAD MEMBERS
  // -----------------------------------

  async function loadBoardMembers() {
    setIsLoadingMembers(true);
    setMembersError("");

    const { data, error } =
      await supabase
        .from("board_members")
        .select(
          "id, board_id, user_id, role, email, created_at"
        )
        .eq("board_id", boardId)
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      setMembersError(
        `Error loading members: ${error.message}`
      );

      setBoardMembers([]);
      setIsLoadingMembers(false);

      return;
    }

    setBoardMembers(data || []);
    setIsLoadingMembers(false);
  }

  async function openMembersModal() {
    setMembersError("");
    setIsMembersModalOpen(true);

    await loadBoardMembers();
  }

  function closeMembersModal() {
    if (removingMemberId) return;

    setIsMembersModalOpen(false);
    setMembersError("");
  }

  async function removeMember(
    member: BoardMember
  ) {
    if (!isOwner) return;

    if (member.role === "owner") {
      setMembersError(
        "The board owner cannot be removed."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Remove ${
          member.email ||
          "this member"
        } from the board?`
      );

    if (!confirmed) return;

    setRemovingMemberId(
      member.user_id
    );

    setMembersError("");

    const { error } =
      await supabase.rpc(
        "remove_board_member",
        {
          target_board_id:
            boardId,
          target_user_id:
            member.user_id,
        }
      );

    if (error) {
      setMembersError(
        `Error removing member: ${error.message}`
      );

      setRemovingMemberId(null);

      return;
    }

    await loadBoardMembers();

    setRemovingMemberId(null);
  }

  // -----------------------------------
  // LOAD CARDS / CHECKLISTS / COMMENTS
  // -----------------------------------

  async function loadCards() {
    const {
      data: cardData,
      error: cardError,
    } = await supabase
      .from("cards")
      .select("*")
      .eq("board_id", boardId)
      .order("position", {
        ascending: true,
      });

    if (cardError) {
      alert(
        `Error loading cards: ${cardError.message}`
      );

      return;
    }

    const loadedCards =
      cardData || [];

    setCards(loadedCards);

    if (
      loadedCards.length === 0
    ) {
      setChecklistItems([]);
      setComments([]);

      return;
    }

    const cardIds =
      loadedCards.map(
        (card) => card.id
      );

    const [
      checklistResult,
      commentsResult,
    ] = await Promise.all([
      supabase
        .from("checklist_items")
        .select("*")
        .in("card_id", cardIds)
        .order("position", {
          ascending: true,
        }),

      supabase
        .from("comments")
        .select("*")
        .in("card_id", cardIds)
        .order("created_at", {
          ascending: true,
        }),
    ]);

    if (
      checklistResult.error
    ) {
      alert(
        `Error loading checklists: ${checklistResult.error.message}`
      );

      return;
    }

    if (commentsResult.error) {
      alert(
        `Error loading comments: ${commentsResult.error.message}`
      );

      return;
    }

    setChecklistItems(
      checklistResult.data || []
    );

    setComments(
      commentsResult.data || []
    );
  }

  // -----------------------------------
  // INVITES
  // -----------------------------------

  function openInviteModal() {
    setInviteEmail("");
    setInviteMessage("");
    setInviteError("");

    setIsInviteModalOpen(true);
  }

  function closeInviteModal() {
    if (isSendingInvite) return;

    setIsInviteModalOpen(false);

    setInviteEmail("");
    setInviteMessage("");
    setInviteError("");
  }

  async function sendBoardInvite() {
    const email =
      inviteEmail
        .trim()
        .toLowerCase();

    if (!email) {
      setInviteError(
        "Enter an email address."
      );

      return;
    }

    const user =
      await getCurrentUser();

    if (!user) return;

    if (!isOwner) {
      setInviteError(
        "Only the board owner can invite members."
      );

      return;
    }

    setIsSendingInvite(true);
    setInviteMessage("");
    setInviteError("");

    const {
      data: invite,
      error:
        createInviteError,
    } = await supabase
      .from("board_invites")
      .insert({
        board_id: boardId,
        email,
        role: "member",
        invited_by: user.id,
        accepted: false,
      })
      .select()
      .single();

    if (createInviteError) {
      setIsSendingInvite(false);

      if (
        createInviteError.code ===
        "23505"
      ) {
        setInviteError(
          "That email already has a pending invite to this board."
        );

        return;
      }

      setInviteError(
        `Error creating invite: ${createInviteError.message}`
      );

      return;
    }

    try {
      const response =
        await fetch(
          "/api/send-board-invite",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
              inviteId:
                invite.id,
              boardName:
                board?.name ||
                "TouchBase board",
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setInviteError(
          result.error ||
            "Invite was created, but the email could not be sent."
        );

        return;
      }

      setInviteMessage(
        `Invite email sent to ${email}.`
      );

      setInviteEmail("");
    } catch {
      setInviteError(
        "Invite was created, but the email could not be sent."
      );
    } finally {
      setIsSendingInvite(false);
    }
  }

  // -----------------------------------
  // BOARD LINKS
  // -----------------------------------

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
        parsed.protocol !==
          "http:" &&
        parsed.protocol !==
          "https:"
      ) {
        return null;
      }

      return parsed.toString();
    } catch {
      return null;
    }
  }

  type BoardAppTarget = {
    appUrl: string;
    webUrl: string;
  };

  function normalizeAppLaunchUrl(
    value: string
  ) {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if (
      !/^[a-z][a-z0-9+.-]*:/i.test(
        trimmed
      )
    ) {
      return null;
    }

    const protocol =
      trimmed
        .split(":", 1)[0]
        .toLowerCase();

    if (
      ["http", "https", "javascript", "data", "file"].includes(
        protocol
      )
    ) {
      return null;
    }

    return trimmed;
  }

  function encodeBoardAppUrl(
    appUrl: string,
    webUrl: string
  ) {
    return `touchbase-app:${encodeURIComponent(
      JSON.stringify({
        appUrl,
        webUrl,
      })
    )}`;
  }

  function parseBoardAppUrl(
    url: string
  ): BoardAppTarget | null {
    const prefix = "touchbase-app:";

    if (!url.startsWith(prefix)) {
      return null;
    }

    try {
      const parsed = JSON.parse(
        decodeURIComponent(
          url.slice(prefix.length)
        )
      ) as Partial<BoardAppTarget>;

      if (
        typeof parsed.appUrl !== "string" ||
        typeof parsed.webUrl !== "string"
      ) {
        return null;
      }

      return {
        appUrl: parsed.appUrl,
        webUrl: parsed.webUrl,
      };
    } catch {
      return null;
    }
  }

  function getLinkLabel(
    label: string | null,
    url: string
  ) {
    const trimmed =
      label?.trim();

    if (trimmed) {
      return trimmed;
    }

    const appTarget =
      parseBoardAppUrl(url);

    const displayUrl =
      appTarget?.webUrl || url;

    try {
      return new URL(
        displayUrl
      ).hostname;
    } catch {
      return displayUrl;
    }
  }

  function getLinkIconUrl(
    url: string
  ) {
    const appTarget =
      parseBoardAppUrl(url);

    const iconUrl =
      appTarget?.webUrl || url;

    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(
      iconUrl
    )}&sz=64`;
  }

  function openBoardShortcut(
    link: BoardLink
  ) {
    const appTarget =
      parseBoardAppUrl(
        link.url
      );

    if (!appTarget) {
      window.open(
        link.url,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    let appOpened = false;

    const markAppOpened = () => {
      appOpened = true;
    };

    const handleVisibility = () => {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        appOpened = true;
      }
    };

    window.addEventListener(
      "blur",
      markAppOpened,
      { once: true }
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    window.location.href =
      appTarget.appUrl;

    window.setTimeout(() => {
      window.removeEventListener(
        "blur",
        markAppOpened
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      if (
        !appOpened &&
        document.visibilityState ===
          "visible"
      ) {
        window.location.href =
          appTarget.webUrl;
      }
    }, 1400);
  }

  async function loadBoardLinks() {
    const {
      data,
      error,
    } = await supabase
      .from("board_links")
      .select("*")
      .eq(
        "board_id",
        boardId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        "Error loading board links:",
        error.message
      );

      return;
    }

    setBoardLinks(
      data || []
    );
  }

  async function addBoardLink() {
    const url =
      normalizeHttpUrl(
        boardLinkUrl
      );

    if (!url) {
      setBoardLinkError(
        "Enter a valid web address."
      );

      return;
    }

    const user =
      await getCurrentUser();

    if (!user) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("board_links")
      .insert({
        board_id:
          boardId,
        user_id:
          user.id,
        label:
          boardLinkLabel.trim() ||
          null,
        url,
      });

    if (error) {
      setBoardLinkError(
        error.message
      );

      return;
    }

    setBoardLinkLabel("");
    setBoardLinkUrl("");
    setBoardLinkError("");
    setIsAddingBoardLink(
      false
    );

    await loadBoardLinks();
  }

  async function addBoardApp() {
    const name =
      boardAppName.trim();

    const appUrl =
      normalizeAppLaunchUrl(
        boardAppLaunchUrl
      );

    const webUrl =
      normalizeHttpUrl(
        boardAppFallbackUrl
      );

    if (!name) {
      setBoardAppError(
        "Enter an app name."
      );

      return;
    }

    if (!appUrl) {
      setBoardAppError(
        "Enter a valid desktop app URL, for example zoommtg:// or slack://."
      );

      return;
    }

    if (!webUrl) {
      setBoardAppError(
        "Enter a valid web fallback address."
      );

      return;
    }

    const user =
      await getCurrentUser();

    if (!user) {
      return;
    }

    const encodedUrl =
      encodeBoardAppUrl(
        appUrl,
        webUrl
      );

    const {
      error,
    } = await supabase
      .from("board_links")
      .insert({
        board_id:
          boardId,
        user_id:
          user.id,
        label:
          name,
        url:
          encodedUrl,
      });

    if (error) {
      setBoardAppError(
        error.message
      );

      return;
    }

    setBoardAppName("");
    setBoardAppLaunchUrl("");
    setBoardAppFallbackUrl("");
    setBoardAppError("");
    setIsAddingBoardApp(
      false
    );

    await loadBoardLinks();
  }

  async function deleteBoardLink(
    link: BoardLink
  ) {
    if (
      link.user_id !==
      currentUserId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${getLinkLabel(
          link.label,
          link.url
        )}?`
      );

    if (!confirmed) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("board_links")
      .delete()
      .eq(
        "id",
        link.id
      )
      .eq(
        "user_id",
        currentUserId
      );

    if (error) {
      alert(
        `Error deleting link: ${error.message}`
      );

      return;
    }

    setBoardLinks(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            link.id
        )
    );
  }

  // -----------------------------------
  // CARD MODAL
  // -----------------------------------

  function openAddCardModal(
    status: CardStatus
  ) {
    setEditingCard(null);
    setCardSaveError("");

    setCardTitle("");
    setCardDescription("");
    setCardDueDate("");
    setCardPriority("medium");

    setNewCardStatus(status);

    setModalChecklistItems([]);
    setNewChecklistText("");

    setModalComments([]);
    setNewCommentText("");

    setModalAttachments([]);
    setPendingAttachmentFiles([]);
    setIsDraggingAttachment(false);

    setModalCardLinks([]);
    setPendingCardLinks([]);
    setCardLinkLabel("");
    setCardLinkUrl("");
    setCardLinkError("");

    setIsCardModalOpen(true);
  }

  function openEditCardModal(
    card: Card
  ) {
    setEditingCard(card);
    setCardSaveError("");

    setCardTitle(card.title);

    setCardDescription(
      card.description || ""
    );

    setCardDueDate(
      card.due_date || ""
    );

    setCardPriority(
      card.priority || "medium"
    );

    setNewCardStatus(
      card.status as CardStatus
    );

    const cardChecklist =
      checklistItems
        .filter(
          (item) =>
            item.card_id ===
            card.id
        )
        .sort(
          (a, b) =>
            a.position -
            b.position
        )
        .map((item) => ({
          id: item.id,
          text: item.text,
          completed:
            item.completed,
          position:
            item.position,
        }));

    setModalChecklistItems(
      cardChecklist
    );

    setNewChecklistText("");

    const cardComments =
      comments
        .filter(
          (comment) =>
            comment.card_id ===
            card.id
        )
        .sort(
          (a, b) =>
            new Date(
              a.created_at
            ).getTime() -
            new Date(
              b.created_at
            ).getTime()
        );

    setModalComments(
      cardComments
    );

    setNewCommentText("");

    setModalAttachments([]);
    setPendingAttachmentFiles([]);
    setIsDraggingAttachment(false);

    setModalCardLinks([]);
    setPendingCardLinks([]);
    setCardLinkLabel("");
    setCardLinkUrl("");
    setCardLinkError("");

    loadCardAttachments(card.id);
    loadCardLinks(card.id);

    setIsCardModalOpen(true);
  }

  function closeCardModal() {
    if (isSavingCard) return;

    setIsCardModalOpen(false);
    setEditingCard(null);
    setCardSaveError("");

    setCardTitle("");
    setCardDescription("");
    setCardDueDate("");
    setCardPriority("medium");

    setModalChecklistItems([]);
    setNewChecklistText("");

    setModalComments([]);
    setNewCommentText("");

    setModalAttachments([]);
    setPendingAttachmentFiles([]);
    setIsDraggingAttachment(false);

    setModalCardLinks([]);
    setPendingCardLinks([]);
    setCardLinkLabel("");
    setCardLinkUrl("");
    setCardLinkError("");
  }

  // -----------------------------------
  // CHECKLIST
  // -----------------------------------

  function addChecklistItem() {
    const text =
      newChecklistText.trim();

    if (!text) return;

    setModalChecklistItems(
      (current) => [
        ...current,
        {
          text,
          completed: false,
          position:
            current.length + 1,
        },
      ]
    );

    setNewChecklistText("");
  }

  function toggleChecklistItem(
    index: number
  ) {
    setModalChecklistItems(
      (items) =>
        items.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex === index
              ? {
                  ...item,
                  completed:
                    !item.completed,
                }
              : item
        )
    );
  }

  function deleteChecklistItem(
    index: number
  ) {
    setModalChecklistItems(
      (items) =>
        items
          .filter(
            (
              _,
              itemIndex
            ) =>
              itemIndex !==
              index
          )
          .map(
            (
              item,
              newIndex
            ) => ({
              ...item,
              position:
                newIndex + 1,
            })
          )
    );
  }

  async function saveChecklist(
    cardId: number,
    userId: string
  ) {
    const existingItems =
      checklistItems.filter(
        (item) =>
          item.card_id ===
          cardId
      );

    const keptIds =
      modalChecklistItems
        .filter(
          (item) =>
            item.id !==
            undefined
        )
        .map(
          (item) =>
            item.id as number
        );

    const deletedIds =
      existingItems
        .filter(
          (item) =>
            !keptIds.includes(
              item.id
            )
        )
        .map(
          (item) => item.id
        );

    if (
      deletedIds.length > 0
    ) {
      const { error } =
        await supabase
          .from(
            "checklist_items"
          )
          .delete()
          .eq(
            "card_id",
            cardId
          )
          .in(
            "id",
            deletedIds
          );

      if (error) {
        throw new Error(
          error.message
        );
      }
    }

    for (
      let index = 0;
      index <
      modalChecklistItems.length;
      index++
    ) {
      const item =
        modalChecklistItems[
          index
        ];

      const position =
        index + 1;

      if (
        item.id !== undefined
      ) {
        const { error } =
          await supabase
            .from(
              "checklist_items"
            )
            .update({
              text:
                item.text,
              completed:
                item.completed,
              position,
            })
            .eq(
              "id",
              item.id
            )
            .eq(
              "card_id",
              cardId
            );

        if (error) {
          throw new Error(
            error.message
          );
        }
      } else {
        const { error } =
          await supabase
            .from(
              "checklist_items"
            )
            .insert({
              card_id:
                cardId,
              user_id:
                userId,
              text:
                item.text,
              completed:
                item.completed,
              position,
            });

        if (error) {
          throw new Error(
            error.message
          );
        }
      }
    }
  }

  // -----------------------------------
  // ATTACHMENTS
  // -----------------------------------

  async function loadCardAttachments(
    cardId: number
  ) {
    const { data, error } =
      await supabase
        .from("card_attachments")
        .select("*")
        .eq("card_id", cardId)
        .eq("board_id", boardId)
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      console.error(
        "Error loading attachments:",
        error.message
      );

      return;
    }

    setModalAttachments(
      data || []
    );
  }

  function formatFileSize(
    bytes: number | null
  ) {
    if (
      bytes === null ||
      bytes === undefined
    ) {
      return "";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function addPendingFiles(
    files: File[]
  ) {
    const validFiles =
      files.filter(
        (file) => {
          if (
            file.size >
            MAX_ATTACHMENT_SIZE
          ) {
            alert(
              `${file.name} is larger than 20 MB.`
            );

            return false;
          }

          return true;
        }
      );

    if (
      validFiles.length === 0
    ) {
      return;
    }

    setPendingAttachmentFiles(
      (current) => {
        const existingKeys =
          new Set(
            current.map(
              (file) =>
                `${file.name}-${file.size}-${file.lastModified}`
            )
          );

        const newFiles =
          validFiles.filter(
            (file) =>
              !existingKeys.has(
                `${file.name}-${file.size}-${file.lastModified}`
              )
          );

        return [
          ...current,
          ...newFiles,
        ];
      }
    );
  }

  function handleAttachmentDrop(
    event:
      React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setIsDraggingAttachment(
      false
    );

    addPendingFiles(
      Array.from(
        event.dataTransfer.files
      )
    );
  }

  function removePendingFile(
    index: number
  ) {
    setPendingAttachmentFiles(
      (current) =>
        current.filter(
          (_, fileIndex) =>
            fileIndex !== index
        )
    );
  }

  function sanitizeFileName(
    fileName: string
  ) {
    return fileName
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )
      .slice(0, 120);
  }

  async function uploadPendingFiles(
    cardId: number,
    userId: string
  ) {
    if (
      pendingAttachmentFiles.length ===
      0
    ) {
      return;
    }

    setIsUploadingAttachments(
      true
    );

    try {
      for (
        const file of
        pendingAttachmentFiles
      ) {
        const safeName =
          sanitizeFileName(
            file.name
          );

        const filePath =
          `${boardId}/${cardId}/${crypto.randomUUID()}-${safeName}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from(
            "card-attachments"
          )
          .upload(
            filePath,
            file,
            {
              cacheControl:
                "3600",
              upsert: false,
              contentType:
                file.type ||
                undefined,
            }
          );

        if (uploadError) {
          throw new Error(
            `Could not upload ${file.name}: ${uploadError.message}`
          );
        }

        const {
          error:
            attachmentError,
        } = await supabase
          .from(
            "card_attachments"
          )
          .insert({
            card_id: cardId,
            board_id:
              boardId,
            user_id:
              userId,
            file_name:
              file.name,
            file_path:
              filePath,
            file_type:
              file.type ||
              null,
            file_size:
              file.size,
          });

        if (
          attachmentError
        ) {
          await supabase.storage
            .from(
              "card-attachments"
            )
            .remove([
              filePath,
            ]);

          throw new Error(
            `Could not save ${file.name}: ${attachmentError.message}`
          );
        }
      }

      setPendingAttachmentFiles(
        []
      );

      await loadCardAttachments(
        cardId
      );
    } finally {
      setIsUploadingAttachments(
        false
      );
    }
  }

  async function openAttachment(
    attachment:
      CardAttachment
  ) {
    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          "card-attachments"
        )
        .createSignedUrl(
          attachment.file_path,
          60
        );

    if (
      error ||
      !data?.signedUrl
    ) {
      alert(
        `Could not open file: ${
          error?.message ||
          "Unknown error"
        }`
      );

      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function deleteAttachment(
    attachment:
      CardAttachment
  ) {
    if (
      attachment.user_id !==
      currentUserId
    ) {
      alert(
        "You can only delete files that you uploaded."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${attachment.file_name}?`
      );

    if (!confirmed) {
      return;
    }

    const {
      error: storageError,
    } =
      await supabase.storage
        .from(
          "card-attachments"
        )
        .remove([
          attachment.file_path,
        ]);

    if (storageError) {
      alert(
        `Could not delete file: ${storageError.message}`
      );

      return;
    }

    const {
      error: rowError,
    } =
      await supabase
        .from(
          "card_attachments"
        )
        .delete()
        .eq(
          "id",
          attachment.id
        )
        .eq(
          "user_id",
          currentUserId
        );

    if (rowError) {
      alert(
        `The file was removed from storage, but its attachment record could not be deleted: ${rowError.message}`
      );

      return;
    }

    setModalAttachments(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            attachment.id
        )
    );
  }

  // -----------------------------------
  // CARD LINKS
  // -----------------------------------

  async function loadCardLinks(
    cardId: number
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("card_links")
      .select("*")
      .eq(
        "card_id",
        cardId
      )
      .eq(
        "board_id",
        boardId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        "Error loading card links:",
        error.message
      );

      return;
    }

    setModalCardLinks(
      data || []
    );
  }

  function addPendingCardLink() {
    const url =
      normalizeHttpUrl(
        cardLinkUrl
      );

    if (!url) {
      setCardLinkError(
        "Enter a valid web address."
      );

      return;
    }

    setPendingCardLinks(
      (current) => [
        ...current,
        {
          label:
            cardLinkLabel.trim(),
          url,
        },
      ]
    );

    setCardLinkLabel("");
    setCardLinkUrl("");
    setCardLinkError("");
  }

  function removePendingCardLink(
    index: number
  ) {
    setPendingCardLinks(
      (current) =>
        current.filter(
          (_, linkIndex) =>
            linkIndex !== index
        )
    );
  }

  async function savePendingCardLinks(
    cardId: number,
    userId: string
  ) {
    if (
      pendingCardLinks.length ===
      0
    ) {
      return;
    }

    const rows =
      pendingCardLinks.map(
        (link) => ({
          card_id:
            cardId,
          board_id:
            boardId,
          user_id:
            userId,
          label:
            link.label ||
            null,
          url:
            link.url,
        })
      );

    const {
      error,
    } = await supabase
      .from("card_links")
      .insert(rows);

    if (error) {
      throw new Error(
        `Could not save link: ${error.message}`
      );
    }

    setPendingCardLinks(
      []
    );

    await loadCardLinks(
      cardId
    );
  }

  async function deleteCardLink(
    link: CardLink
  ) {
    if (
      link.user_id !==
      currentUserId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${getLinkLabel(
          link.label,
          link.url
        )}?`
      );

    if (!confirmed) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("card_links")
      .delete()
      .eq(
        "id",
        link.id
      )
      .eq(
        "user_id",
        currentUserId
      );

    if (error) {
      alert(
        `Error deleting link: ${error.message}`
      );

      return;
    }

    setModalCardLinks(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            link.id
        )
    );
  }

  // -----------------------------------
  // COMMENTS
  // -----------------------------------

  async function addComment() {
    if (!editingCard) return;

    const text =
      newCommentText.trim();

    if (!text) return;

    const user =
      await getCurrentUser();

    if (!user) return;

    const {
      data,
      error,
    } = await supabase
      .from("comments")
      .insert({
        card_id:
          editingCard.id,
        user_id: user.id,
        text,
      })
      .select()
      .single();

    if (error) {
      alert(
        `Error adding comment: ${error.message}`
      );

      return;
    }

    setModalComments(
      (current) => [
        ...current,
        data,
      ]
    );

    setComments(
      (current) => [
        ...current,
        data,
      ]
    );

    setNewCommentText("");
  }

  async function deleteComment(
    comment: Comment
  ) {
    const user =
      await getCurrentUser();

    if (!user) return;

    if (
      comment.user_id !==
      user.id
    ) {
      alert(
        "You can only delete your own comments."
      );

      return;
    }

    const { error } =
      await supabase
        .from("comments")
        .delete()
        .eq(
          "id",
          comment.id
        )
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      alert(
        `Error deleting comment: ${error.message}`
      );

      return;
    }

    setModalComments(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            comment.id
        )
    );

    setComments(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            comment.id
        )
    );
  }

  // -----------------------------------
  // SAVE CARD
  // -----------------------------------

  async function saveCard() {
    if (isSavingCard) return;

    const trimmedTitle =
      cardTitle.trim();

    const trimmedDescription =
      cardDescription.trim();

    setCardSaveError("");

    if (!trimmedTitle) {
      setCardSaveError(
        "Please enter a card title."
      );
      return;
    }

    setIsSavingCard(true);

    try {
      const user =
        await getCurrentUser();

      if (!user) {
        setCardSaveError(
          "Your session could not be confirmed. Please refresh the page and try again."
        );
        return;
      }

      if (editingCard) {
        const { error } =
          await supabase
            .from("cards")
            .update({
              title:
                trimmedTitle,
              description:
                trimmedDescription ||
                null,
              due_date:
                cardDueDate ||
                null,
              priority:
                cardPriority ||
                null,
              status:
                newCardStatus,
            })
            .eq(
              "id",
              editingCard.id
            )
            .eq(
              "board_id",
              boardId
            );

        if (error) {
          throw new Error(
            error.message
          );
        }

        await saveChecklist(
          editingCard.id,
          user.id
        );

        await uploadPendingFiles(
          editingCard.id,
          user.id
        );

        await savePendingCardLinks(
          editingCard.id,
          user.id
        );

        await loadCards();

        setIsSavingCard(false);
        closeCardModal();

        return;
      }

      const cardsInColumn =
        cards.filter(
          (card) =>
            card.status ===
            newCardStatus
        );

      const nextPosition =
        cardsInColumn.length === 0
          ? 1
          : Math.max(
              ...cardsInColumn.map(
                (card) =>
                  card.position || 0
              )
            ) + 1;

      const {
        data,
        error,
      } = await supabase
        .from("cards")
        .insert({
          title:
            trimmedTitle,
          description:
            trimmedDescription ||
            null,
          due_date:
            cardDueDate ||
            null,
          priority:
            cardPriority ||
            null,
          status:
            newCardStatus,
          position:
            nextPosition,
          user_id:
            user.id,
          board_id:
            boardId,
        })
        .select()
        .single();

      if (error) {
        throw new Error(
          error.message
        );
      }

      if (!data) {
        throw new Error(
          "The card was not returned after saving."
        );
      }

      await saveChecklist(
        data.id,
        user.id
      );

      await uploadPendingFiles(
        data.id,
        user.id
      );

      await savePendingCardLinks(
        data.id,
        user.id
      );

      await loadCards();

      setIsSavingCard(false);
      closeCardModal();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      setCardSaveError(
        `Could not save card: ${message}`
      );
    } finally {
      setIsSavingCard(false);
    }
  }

  // -----------------------------------
  // DELETE CARD
  // -----------------------------------

  async function confirmDeleteCard() {
    if (!deleteCardTarget) {
      return;
    }

    const cardId =
      deleteCardTarget.id;

    const {
      data:
        attachmentRows,
    } = await supabase
      .from(
        "card_attachments"
      )
      .select(
        "file_path"
      )
      .eq(
        "card_id",
        cardId
      )
      .eq(
        "board_id",
        boardId
      );

    const { error } =
      await supabase
        .from("cards")
        .delete()
        .eq("id", cardId)
        .eq(
          "board_id",
          boardId
        );

    if (error) {
      alert(
        `Error deleting card: ${error.message}`
      );

      return;
    }

    const attachmentPaths =
      (
        attachmentRows ||
        []
      )
        .map(
          (item) =>
            item.file_path
        )
        .filter(Boolean);

    if (
      attachmentPaths.length >
      0
    ) {
      const {
        error:
          storageCleanupError,
      } =
        await supabase.storage
          .from(
            "card-attachments"
          )
          .remove(
            attachmentPaths
          );

      if (
        storageCleanupError
      ) {
        console.error(
          "Attachment storage cleanup failed:",
          storageCleanupError.message
        );
      }
    }

    setCards(
      (currentCards) =>
        currentCards.filter(
          (card) =>
            card.id !==
            cardId
        )
    );

    setChecklistItems(
      (currentItems) =>
        currentItems.filter(
          (item) =>
            item.card_id !==
            cardId
        )
    );

    setComments(
      (currentComments) =>
        currentComments.filter(
          (comment) =>
            comment.card_id !==
            cardId
        )
    );

    setDeleteCardTarget(null);
  }

  // -----------------------------------
  // DRAG + DROP
  // -----------------------------------

  async function moveCard(
    cardId: number,
    newStatus: CardStatus
  ) {
    const { error } =
      await supabase
        .from("cards")
        .update({
          status: newStatus,
        })
        .eq("id", cardId)
        .eq(
          "board_id",
          boardId
        );

    if (error) {
      alert(
        `Error moving card: ${error.message}`
      );

      return;
    }

    setCards(
      (currentCards) =>
        currentCards.map(
          (card) =>
            card.id === cardId
              ? {
                  ...card,
                  status:
                    newStatus,
                }
              : card
        )
    );
  }

  function handleDragStart(
    event:
      React.DragEvent<HTMLDivElement>,
    cardId: number
  ) {
    event.dataTransfer.setData(
      "cardId",
      cardId.toString()
    );
  }

  function handleDrop(
    event:
      React.DragEvent<HTMLDivElement>,
    newStatus: CardStatus
  ) {
    event.preventDefault();

    const cardId =
      Number(
        event.dataTransfer.getData(
          "cardId"
        )
      );

    if (!cardId) return;

    moveCard(
      cardId,
      newStatus
    );
  }

  function allowDrop(
    event:
      React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
  }

  // -----------------------------------
  // DISPLAY HELPERS
  // -----------------------------------

  function formatDueDate(
    date: string
  ) {
    const parsed =
      new Date(
        `${date}T00:00:00`
      );

    return parsed.toLocaleDateString();
  }

  function formatCommentDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleString();
  }

  function isOverdue(
    card: Card
  ) {
    if (!card.due_date) {
      return false;
    }

    if (
      card.status === "done"
    ) {
      return false;
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const due =
      new Date(
        `${card.due_date}T00:00:00`
      );

    return due < today;
  }

  function getPriorityClasses(
    priority: Priority
  ) {
    switch (priority) {
      case "low":
        return "bg-slate-100 text-slate-700";

      case "medium":
        return "bg-blue-50 text-blue-700";

      case "high":
        return "bg-orange-50 text-orange-700";

      case "urgent":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  function getPriorityCardStyle(
    priority: Priority
  ) {
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
        return {
          background:
            "rgba(255, 255, 255, 0.24)",
          borderColor:
            "rgba(255, 255, 255, 0.50)",
        };
    }
  }

  function getPriorityModalStyle(
    priority: Priority
  ) {
    switch (priority) {
      case "low":
        return {
          background:
            "rgba(148, 163, 184, 0.74)",
          borderColor:
            "rgba(148, 163, 184, 0.88)",
        };

      case "medium":
        return {
          background:
            "rgba(59, 130, 246, 0.68)",
          borderColor:
            "rgba(59, 130, 246, 0.88)",
        };

      case "high":
        return {
          background:
            "rgba(249, 115, 22, 0.68)",
          borderColor:
            "rgba(249, 115, 22, 0.90)",
        };

      case "urgent":
        return {
          background:
            "rgba(239, 68, 68, 0.66)",
          borderColor:
            "rgba(239, 68, 68, 0.92)",
        };

      default:
        return {
          background:
            "rgba(255, 255, 255, 0.74)",
          borderColor:
            "rgba(255, 255, 255, 0.82)",
        };
    }
  }

  function getPriorityLabel(
    priority: Priority
  ) {
    switch (priority) {
      case "low":
        return "Low";

      case "medium":
        return "Medium";

      case "high":
        return "High";

      case "urgent":
        return "Urgent";

      default:
        return "No priority";
    }
  }

  function getCardChecklist(
    cardId: number
  ) {
    return checklistItems.filter(
      (item) =>
        item.card_id ===
        cardId
    );
  }

  function getChecklistProgress(
    cardId: number
  ) {
    const items =
      getCardChecklist(cardId);

    const total =
      items.length;

    const completed =
      items.filter(
        (item) =>
          item.completed
      ).length;

    const percentage =
      total === 0
        ? 0
        : Math.round(
            (completed /
              total) *
              100
          );

    return {
      total,
      completed,
      percentage,
    };
  }

  function getCommentCount(
    cardId: number
  ) {
    return comments.filter(
      (comment) =>
        comment.card_id ===
        cardId
    ).length;
  }

  // -----------------------------------
  // CARD UI
  // -----------------------------------

  function renderCard(
    card: Card
  ) {
    const overdue =
      isOverdue(card);

    const checklist =
      getChecklistProgress(
        card.id
      );

    const commentCount =
      getCommentCount(
        card.id
      );

    const priorityCardStyle =
      getPriorityCardStyle(
        card.priority
      );

    return (
      <div
        key={card.id}
        draggable
        role="button"
        tabIndex={0}
        onClick={(event) => {
          const target =
            event.target as HTMLElement;

          if (
            target.closest(
              "button, a, input, textarea, select, label"
            )
          ) {
            return;
          }

          openEditCardModal(
            card
          );
        }}
        onKeyDown={(event) => {
          const target =
            event.target as HTMLElement;

          if (
            target.closest(
              "button, a, input, textarea, select, label"
            )
          ) {
            return;
          }

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            openEditCardModal(
              card
            );
          }
        }}
        onDragStart={(event) =>
          handleDragStart(
            event,
            card.id
          )
        }
        className="group cursor-pointer rounded-xl border p-4 shadow-sm backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:brightness-110 hover:shadow-xl active:translate-y-0 active:scale-[0.99]"
        style={{
          background:
            priorityCardStyle.background,
          borderColor:
            priorityCardStyle.borderColor,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium leading-6 text-slate-800">
            {card.title}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {card.priority && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityClasses(
                card.priority
              )}`}
            >
              {getPriorityLabel(
                card.priority
              )}
            </span>
          )}

          {card.due_date && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                overdue
                  ? "bg-red-50 text-red-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {overdue
                ? "Overdue"
                : "Due"}{" "}
              {formatDueDate(
                card.due_date
              )}
            </span>
          )}
        </div>

        {card.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-500">
            {card.description}
          </p>
        )}

        {checklist.total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Checklist
              </span>

              <span>
                {
                  checklist.completed
                }
                /
                {
                  checklist.total
                }{" "}
                complete
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width:
                    `${checklist.percentage}%`,
                  backgroundColor:
                    accentColor,
                }}
              />
            </div>
          </div>
        )}

        {commentCount > 0 && (
          <div className="mt-3 text-xs font-medium text-slate-500">
            💬 {commentCount}{" "}
            {commentCount === 1
              ? "comment"
              : "comments"}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Drag to move · Click to edit
          </span>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteCardTarget(
                card
              );
            }}
            className="text-xs font-medium text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  const todoCards =
    cards.filter(
      (card) =>
        card.status ===
        "todo"
    );

  const progressCards =
    cards.filter(
      (card) =>
        card.status ===
        "in_progress"
    );

  const doneCards =
    cards.filter(
      (card) =>
        card.status ===
        "done"
    );

  function BoardColumn({
    title,
    status,
    cardsForColumn,
  }: {
    title: string;
    status: CardStatus;
    cardsForColumn: Card[];
  }) {
    return (
      <div
        onDragOver={allowDrop}
        onDrop={(event) =>
          handleDrop(
            event,
            status
          )
        }
        className="flex min-h-[420px] w-full flex-col rounded-2xl border border-white/50 p-4 shadow-lg backdrop-blur-md md:w-80 md:flex-none"
        style={{
          backgroundColor:
            panelBackgroundColor,
        }}
      >
        <div
          className="flex items-center justify-between rounded-xl px-3 py-3 text-white"
          style={{
            backgroundColor:
              tabColor,
          }}
        >
          <div>
            <h2 className="font-semibold text-white">
              {title}
            </h2>

            <p className="mt-1 text-xs text-white/80">
              {
                cardsForColumn.length
              }{" "}
              {cardsForColumn.length ===
              1
                ? "card"
                : "cards"}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              openAddCardModal(
                status
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-white transition hover:bg-white/20"
          >
            +
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {cardsForColumn.map(
            renderCard
          )}

          {cardsForColumn.length ===
            0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">
              No cards yet
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            openAddCardModal(
              status
            )
          }
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-white hover:text-slate-900"
        >
          + Add a card
        </button>
      </div>
    );
  }

  // -----------------------------------
  // LOADING
  // -----------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-8 w-52 rounded bg-slate-300" />

            <div className="mt-8 flex gap-6">
              <div className="h-96 w-80 rounded-2xl bg-slate-200" />
              <div className="h-96 w-80 rounded-2xl bg-slate-200" />
              <div className="h-96 w-80 rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const modalPriorityStyle =
    getPriorityModalStyle(
      cardPriority
    );

  const modalCompleted =
    modalChecklistItems.filter(
      (item) =>
        item.completed
    ).length;

  const modalTotal =
    modalChecklistItems.length;

  const modalPercentage =
    modalTotal === 0
      ? 0
      : Math.round(
          (modalCompleted /
            modalTotal) *
            100
        );

  return (
    <>
      <main
        className="touchbase-font-preferences min-h-screen"
        style={{
          ...fontPreferenceStyle,
          backgroundImage:
            wallpaperBackground,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <style>{FONT_PREFERENCE_CSS}</style>
        <div className="hidden border-b border-white/30 bg-white/90 backdrop-blur md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
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
                onClick={() =>
                  router.push(
                    `/protected/boards/${boardId}/calendar`
                  )
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                style={{ backgroundColor: accentColor }}
              >
                Calendar
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/protected/boards/${boardId}/messenger`
                  )
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                style={{ backgroundColor: accentColor }}
              >
                Messenger
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/protected/boards"
                  )
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                style={{ backgroundColor: accentColor }}
              >
                All boards
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-4 pb-28 sm:p-8 sm:pb-28 md:pb-8">
          <div
            className="rounded-3xl border border-white/40 p-6 shadow-xl backdrop-blur-md"
            style={{
              backgroundColor:
                panelBackgroundColor,
            }}
          >
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/protected/boards"
                )
              }
              className="hidden items-center rounded-xl border border-white/30 px-4 py-2.5 text-base font-bold text-white shadow-md transition hover:brightness-110 hover:shadow-lg md:inline-flex"
            style={{ backgroundColor: tabColor }}
            >
              ← Back to boards
            </button>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                    {board?.name ||
                      "Untitled board"}
                  </h1>

                  {isOwner ? (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      Owner
                    </span>
                  ) : (
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                      Shared
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Drag cards between
                  columns to update their
                  status.
                </p>
              </div>

              {isOwner && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      openMembersModal
                    }
                    className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
                  >
                    Manage members
                  </button>

                  <button
                    type="button"
                    onClick={
                      openInviteModal
                    }
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-95"
                    style={{
                      backgroundColor:
                        accentColor,
                    }}
                  >
                    Invite member
                  </button>
                </div>
              )}
            </div>

            <div
              className="mt-6 rounded-2xl border border-white/50 p-4 backdrop-blur-md"
              style={{
                backgroundColor:
                  panelBackgroundColor,
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Board links
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Quick links shared with this board.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBoardLink(
                        (current) =>
                          !current
                      );

                      setIsAddingBoardApp(
                        false
                      );

                      setBoardLinkError(
                        ""
                      );
                    }}
                    className="rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
                    style={{
                      backgroundColor:
                        accentColor,
                    }}
                  >
                    + Add link
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBoardApp(
                        (current) =>
                          !current
                      );

                      setIsAddingBoardLink(
                        false
                      );

                      setBoardAppError(
                        ""
                      );
                    }}
                    className="rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
                    style={{
                      backgroundColor:
                        accentColor,
                    }}
                  >
                    + Add app
                  </button>
                </div>
              </div>

              {isAddingBoardLink && (
                <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_2fr_auto]">
                  <input
                    value={
                      boardLinkLabel
                    }
                    onChange={(
                      event
                    ) =>
                      setBoardLinkLabel(
                        event.target.value
                      )
                    }
                    placeholder="Label (optional)"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <input
                    value={
                      boardLinkUrl
                    }
                    onChange={(
                      event
                    ) => {
                      setBoardLinkUrl(
                        event.target.value
                      );

                      setBoardLinkError(
                        ""
                      );
                    }}
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        event.preventDefault();
                        addBoardLink();
                      }
                    }}
                    placeholder="https://example.com"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={
                      addBoardLink
                    }
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:brightness-95"
                    style={{
                      backgroundColor:
                        accentColor,
                    }}
                  >
                    Add
                  </button>

                  {boardLinkError && (
                    <p className="text-sm text-red-600 md:col-span-3">
                      {
                        boardLinkError
                      }
                    </p>
                  )}
                </div>
              )}

              {isAddingBoardApp && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={
                        boardAppName
                      }
                      onChange={(
                        event
                      ) => {
                        setBoardAppName(
                          event.target.value
                        );

                        setBoardAppError(
                          ""
                        );
                      }}
                      placeholder="App name (e.g. Zoom)"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <input
                      value={
                        boardAppLaunchUrl
                      }
                      onChange={(
                        event
                      ) => {
                        setBoardAppLaunchUrl(
                          event.target.value
                        );

                        setBoardAppError(
                          ""
                        );
                      }}
                      placeholder="Desktop URL (e.g. zoommtg://)"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <input
                      value={
                        boardAppFallbackUrl
                      }
                      onChange={(
                        event
                      ) => {
                        setBoardAppFallbackUrl(
                          event.target.value
                        );

                        setBoardAppError(
                          ""
                        );
                      }}
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();
                          addBoardApp();
                        }
                      }}
                      placeholder="Web fallback (e.g. https://zoom.us)"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-2xl text-xs leading-5 text-slate-500">
                      The desktop URL should use the app's registered protocol,
                      such as zoommtg://, slack:// or msteams://. TouchBase will
                      try the installed app first and use the web address as a
                      fallback on both Windows and Mac.
                    </p>

                    <button
                      type="button"
                      onClick={
                        addBoardApp
                      }
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:brightness-95"
                      style={{
                        backgroundColor:
                          accentColor,
                      }}
                    >
                      Add app
                    </button>
                  </div>

                  {boardAppError && (
                    <p className="mt-3 text-sm text-red-600">
                      {
                        boardAppError
                      }
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                {boardLinks.map(
                  (link) => (
                    <div
                      key={
                        link.id
                      }
                      className="group/link relative"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openBoardShortcut(
                            link
                          )
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 bg-white/78 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                        title={
                          parseBoardAppUrl(
                            link.url
                          )
                            ? `${getLinkLabel(
                                link.label,
                                link.url
                              )} (open app)`
                            : getLinkLabel(
                                link.label,
                                link.url
                              )
                        }
                        aria-label={getLinkLabel(
                          link.label,
                          link.url
                        )}
                      >
                        <img
                          src={getLinkIconUrl(
                            link.url
                          )}
                          alt=""
                          className="h-6 w-6 rounded-sm object-contain"
                        />
                      </button>

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
                          aria-label={`Delete ${getLinkLabel(
                            link.label,
                            link.url
                          )}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                )}

                {boardLinks.length ===
                  0 && (
                  <p className="text-sm text-slate-400">
                    No board links yet.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 pb-4 md:mt-8 md:flex md:gap-6 md:overflow-x-auto md:pb-8">
              <BoardColumn
                title="To Do"
                status="todo"
                cardsForColumn={
                  todoCards
                }
              />

              <BoardColumn
                title="In Progress"
                status="in_progress"
                cardsForColumn={
                  progressCards
                }
              />

              <BoardColumn
                title="Done"
                status="done"
                cardsForColumn={
                  doneCards
                }
              />
            </div>
          </div>
        </div>
      </main>


      {/* MOBILE NAVIGATION */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          <button type="button" onClick={() => setMobileMoreOpen(false)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-white" style={{ backgroundColor: accentColor }}>
            <span className="text-lg">▦</span><span>Board</span>
          </button>
          <button type="button" onClick={() => router.push(`/protected/boards/${boardId}/calendar`)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
            <span className="text-lg">▣</span><span>Calendar</span>
          </button>
          <button type="button" onClick={() => router.push(`/protected/boards/${boardId}/messenger`)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
            <span className="text-lg">✉</span><span>Chat</span>
          </button>
          <button type="button" onClick={() => setMobileMoreOpen((current) => !current)} className="flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
            <span className="text-lg">•••</span><span>More</span>
          </button>
        </div>
      </div>

      {mobileMoreOpen && (
        <div className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:hidden">
          <div className="grid gap-2">
            <button type="button" onClick={() => router.push("/protected/boards")} className="rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800">All boards</button>
            <button type="button" onClick={() => router.push("/protected/settings/preferences")} className="rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800">Preferences</button>
            {isOwner && (
              <>
                <button type="button" onClick={() => { setMobileMoreOpen(false); openMembersModal(); }} className="rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800">Manage members</button>
                <button type="button" onClick={() => { setMobileMoreOpen(false); openInviteModal(); }} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-white" style={{ backgroundColor: accentColor }}>Invite member</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL */}

      {isMembersModalOpen &&
        isOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Manage members
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    People who currently
                    have access to this
                    board.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeMembersModal
                  }
                  disabled={Boolean(
                    removingMemberId
                  )}
                  className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              {membersError && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {membersError}
                </p>
              )}

              <div className="mt-6">
                {isLoadingMembers ? (
                  <div className="rounded-xl border border-slate-200 p-5 text-center text-sm text-slate-500">
                    Loading members...
                  </div>
                ) : boardMembers.length ===
                  0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">
                    No members found.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {boardMembers.map(
                      (member) => (
                        <div
                          key={
                            member.id
                          }
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {member.email ||
                                "No email available"}
                            </p>

                            <div className="mt-1">
                              {member.role ===
                              "owner" ? (
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                  Owner
                                </span>
                              ) : (
                                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                                  Member
                                </span>
                              )}
                            </div>
                          </div>

                          {member.role !==
                            "owner" && (
                            <button
                              type="button"
                              onClick={() =>
                                removeMember(
                                  member
                                )
                              }
                              disabled={
                                removingMemberId ===
                                member.user_id
                              }
                              className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {removingMemberId ===
                              member.user_id
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={
                    closeMembersModal
                  }
                  disabled={Boolean(
                    removingMemberId
                  )}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      {/* INVITE MODAL */}

      {isInviteModalOpen &&
        isOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Invite member
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Invite someone to
                    collaborate on this
                    board.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeInviteModal
                  }
                  disabled={
                    isSendingInvite
                  }
                  className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              <label className="mt-6 block text-sm font-medium text-slate-700">
                Email address
              </label>

              <input
                type="email"
                autoFocus
                value={inviteEmail}
                onChange={(event) => {
                  setInviteEmail(
                    event.target.value
                  );

                  setInviteError("");
                  setInviteMessage("");
                }}
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    sendBoardInvite();
                  }
                }}
                placeholder="person@example.com"
                className="mt-2 w-full rounded-xl border border-white/55 bg-white/72 px-4 py-3 text-slate-900 shadow-sm backdrop-blur-md outline-none transition placeholder:text-slate-500 focus:border-white/90 focus:ring-2 focus:ring-white/35"
              />

              {inviteError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {inviteError}
                </p>
              )}

              {inviteMessage && (
                <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  {inviteMessage}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    closeInviteModal
                  }
                  disabled={
                    isSendingInvite
                  }
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    sendBoardInvite
                  }
                  disabled={
                    isSendingInvite ||
                    !inviteEmail.trim()
                  }
                  className="rounded-lg px-5 py-2 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor:
                      accentColor,
                  }}
                >
                  {isSendingInvite
                    ? "Sending..."
                    : "Send invite"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* CARD MODAL */}

      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-4">
          <div
            className="my-3 max-h-[calc(100vh-24px)] w-full max-w-2xl overflow-y-auto rounded-2xl border p-5 shadow-2xl backdrop-blur-xl sm:my-4 sm:max-h-[calc(100vh-32px)] sm:p-6"
            style={{
              background:
                modalPriorityStyle.background,
              borderColor:
                modalPriorityStyle.borderColor,
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCard
                  ? "Edit card"
                  : "Add card"}
              </h2>

              <button
                type="button"
                onClick={
                  closeCardModal
                }
                className="rounded-lg bg-white/35 px-3 py-1 text-slate-700 backdrop-blur transition hover:bg-white/55"
              >
                ✕
              </button>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-700">
              Title
            </label>

            <input
              autoFocus
              value={cardTitle}
              onChange={(event) =>
                setCardTitle(
                  event.target.value
                )
              }
              placeholder="Enter a task..."
              className="mt-2 w-full rounded-xl border border-white/55 bg-white/72 px-4 py-3 text-slate-900 shadow-sm backdrop-blur-md outline-none transition placeholder:text-slate-500 focus:border-white/90 focus:ring-2 focus:ring-white/35"
            />

            <label className="mt-5 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              value={
                cardDescription
              }
              onChange={(event) =>
                setCardDescription(
                  event.target.value
                )
              }
              placeholder="Add more details..."
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-white/55 bg-white/72 px-4 py-3 text-slate-900 shadow-sm backdrop-blur-md outline-none transition placeholder:text-slate-500 focus:border-white/90 focus:ring-2 focus:ring-white/35"
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Due date
                </label>

                <input
                  type="date"
                  value={
                    cardDueDate
                  }
                  onChange={(
                    event
                  ) =>
                    setCardDueDate(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-white/55 bg-white/72 px-4 py-3 text-slate-900 shadow-sm backdrop-blur-md outline-none transition placeholder:text-slate-500 focus:border-white/90 focus:ring-2 focus:ring-white/35"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Priority
                </label>

                <select
                  value={
                    cardPriority ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setCardPriority(
                      (event.target
                        .value ||
                        null) as Priority
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-white/55 bg-white/72 px-4 py-3 text-slate-900 shadow-sm backdrop-blur-md outline-none transition placeholder:text-slate-500 focus:border-white/90 focus:ring-2 focus:ring-white/35"
                >
                  <option value="">
                    No priority
                  </option>

                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>

                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </div>
            </div>

            {!editingCard && (
              <>
                <label className="mt-5 block text-sm font-medium text-slate-700">
                  Column
                </label>

                <select
                  value={
                    newCardStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setNewCardStatus(
                      event.target
                        .value as CardStatus
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-white/55 bg-white/72 px-4 py-3 text-slate-900 shadow-sm backdrop-blur-md outline-none"
                >
                  <option value="todo">
                    To Do
                  </option>

                  <option value="in_progress">
                    In Progress
                  </option>

                  <option value="done">
                    Done
                  </option>
                </select>
              </>
            )}

            <details className="mt-6 overflow-hidden rounded-2xl border border-white/35 bg-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-semibold text-slate-900 transition hover:bg-white/15">
                <span>Attachments</span>
                <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  {modalAttachments.length + pendingAttachmentFiles.length}{" "}
                  {(modalAttachments.length + pendingAttachmentFiles.length) === 1
                    ? "file"
                    : "files"}
                  <span aria-hidden="true">⌄</span>
                </span>
              </summary>

              <div className="border-t border-white/25 px-4 pb-5 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Drag documents here or click to choose files.
                    Maximum 20 MB per file.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      attachmentInputRef.current?.click()
                    }
                    className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                  >
                    Choose files
                  </button>
                </div>

              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  addPendingFiles(
                    Array.from(
                      event.target.files ||
                      []
                    )
                  );

                  event.currentTarget.value =
                    "";
                }}
              />

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDraggingAttachment(
                    true
                  );
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingAttachment(
                    true
                  );
                }}
                onDragLeave={(event) => {
                  event.preventDefault();

                  if (
                    event.currentTarget ===
                    event.target
                  ) {
                    setIsDraggingAttachment(
                      false
                    );
                  }
                }}
                onDrop={
                  handleAttachmentDrop
                }
                onClick={() =>
                  attachmentInputRef.current?.click()
                }
                className={`mt-4 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  isDraggingAttachment
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
                }`}
              >
                <div className="text-3xl">
                  📎
                </div>

                <p className="mt-2 text-sm font-medium text-slate-700">
                  Drop files here
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  PDF, Word, Excel, images and other documents
                </p>
              </div>

              {pendingAttachmentFiles.length >
                0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ready to upload
                  </p>

                  <div className="mt-2 flex flex-col gap-2">
                    {pendingAttachmentFiles.map(
                      (
                        file,
                        index
                      ) => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              📄{" "}
                              {
                                file.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatFileSize(
                                file.size
                              )}{" "}
                              · uploads when
                              you save the card
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              removePendingFile(
                                index
                              );
                            }}
                            className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {editingCard && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Attached files
                  </p>

                  <div className="mt-2 flex flex-col gap-2">
                    {modalAttachments.map(
                      (
                        attachment
                      ) => (
                        <div
                          key={
                            attachment.id
                          }
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openAttachment(
                                attachment
                              )
                            }
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-medium text-blue-700 hover:underline">
                              📎{" "}
                              {
                                attachment.file_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatFileSize(
                                attachment.file_size
                              ) ||
                                "File"}
                            </p>
                          </button>

                          {attachment.user_id ===
                            currentUserId && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteAttachment(
                                  attachment
                                )
                              }
                              className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )
                    )}

                    {modalAttachments.length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
                        No files attached
                        yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </details>

            <details className="mt-4 overflow-hidden rounded-2xl border border-white/35 bg-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-semibold text-slate-900 transition hover:bg-white/15">
                <span>Links</span>
                <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  {modalCardLinks.length + pendingCardLinks.length}{" "}
                  {(modalCardLinks.length + pendingCardLinks.length) === 1
                    ? "link"
                    : "links"}
                  <span aria-hidden="true">⌄</span>
                </span>
              </summary>

              <div className="border-t border-white/25 px-4 pb-5 pt-4">
                <p className="text-sm text-slate-500">
                  Add a website, Google Doc, Drive folder, meeting link or any web page.
                </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                <input
                  value={
                    cardLinkLabel
                  }
                  onChange={(
                    event
                  ) =>
                    setCardLinkLabel(
                      event.target.value
                    )
                  }
                  placeholder="Label (optional)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <input
                  value={
                    cardLinkUrl
                  }
                  onChange={(
                    event
                  ) => {
                    setCardLinkUrl(
                      event.target.value
                    );

                    setCardLinkError(
                      ""
                    );
                  }}
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        "Enter" &&
                      cardLinkUrl.trim()
                    ) {
                      event.preventDefault();
                      addPendingCardLink();
                    }
                  }}
                  placeholder="https://example.com"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={
                    addPendingCardLink
                  }
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Add link
                </button>
              </div>

              {cardLinkError && (
                <p className="mt-2 text-sm text-red-600">
                  {
                    cardLinkError
                  }
                </p>
              )}

              {pendingCardLinks.length >
                0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ready to save
                  </p>

                  <div className="mt-2 flex flex-col gap-2">
                    {pendingCardLinks.map(
                      (
                        link,
                        index
                      ) => (
                        <div
                          key={`${link.url}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3"
                        >
                          <a
                            href={
                              link.url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1 truncate text-sm font-medium text-blue-700 hover:underline"
                          >
                            🔗{" "}
                            {getLinkLabel(
                              link.label,
                              link.url
                            )}
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              removePendingCardLink(
                                index
                              )
                            }
                            className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {editingCard && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Saved links
                  </p>

                  <div className="mt-2 flex flex-col gap-2">
                    {modalCardLinks.map(
                      (link) => (
                        <div
                          key={
                            link.id
                          }
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
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
                              link.label,
                              link.url
                            )}
                          </a>

                          {link.user_id ===
                            currentUserId && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteCardLink(
                                  link
                                )
                              }
                              className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )
                    )}

                    {modalCardLinks.length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
                        No saved links yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </details>

            <details className="mt-4 overflow-hidden rounded-2xl border border-white/35 bg-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-semibold text-slate-900 transition hover:bg-white/15">
                <span>Checklist</span>
                <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  {modalCompleted}/{modalTotal} complete
                  <span aria-hidden="true">⌄</span>
                </span>
              </summary>

              <div className="border-t border-white/25 px-4 pb-5 pt-4">
              {modalTotal > 0 && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width:
                        `${modalPercentage}%`,
                      backgroundColor:
                        accentColor,
                    }}
                  />
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <input
                  value={
                    newChecklistText
                  }
                  onChange={(
                    event
                  ) =>
                    setNewChecklistText(
                      event.target.value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();

                      addChecklistItem();
                    }
                  }}
                  placeholder="Add a checklist item..."
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={
                    addChecklistItem
                  }
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Add
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {modalChecklistItems.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item.id ??
                        `new-${index}`
                      }
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <input
                        type="checkbox"
                        checked={
                          item.completed
                        }
                        onChange={() =>
                          toggleChecklistItem(
                            index
                          )
                        }
                        className="h-4 w-4"
                      />

                      <span
                        className={`flex-1 text-sm ${
                          item.completed
                            ? "text-slate-400 line-through"
                            : "text-slate-700"
                        }`}
                      >
                        {item.text}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          deleteChecklistItem(
                            index
                          )
                        }
                        className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )
                )}

                {modalChecklistItems.length ===
                  0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">
                    No checklist
                    items yet.
                  </div>
                )}
              </div>
              </div>
            </details>

            {editingCard && (
              <details className="mt-4 overflow-hidden rounded-2xl border border-white/35 bg-white/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-semibold text-slate-900 transition hover:bg-white/15">
                  <span>Comments</span>
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    {modalComments.length}{" "}
                    {modalComments.length === 1 ? "comment" : "comments"}
                    <span aria-hidden="true">⌄</span>
                  </span>
                </summary>

                <div className="border-t border-white/25 px-4 pb-5 pt-4">
                <div className="mt-4 flex gap-2">
                  <textarea
                    value={
                      newCommentText
                    }
                    onChange={(
                      event
                    ) =>
                      setNewCommentText(
                        event.target.value
                      )
                    }
                    placeholder="Write a comment..."
                    rows={2}
                    className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={
                      addComment
                    }
                    className="self-end rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Comment
                  </button>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  {modalComments.map(
                    (comment) => (
                      <div
                        key={
                          comment.id
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {
                              comment.text
                            }
                          </p>

                          {comment.user_id ===
                            currentUserId && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteComment(
                                  comment
                                )
                              }
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatCommentDate(
                            comment.created_at
                          )}
                        </p>
                      </div>
                    )
                  )}

                  {modalComments.length ===
                    0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">
                      No comments
                      yet.
                    </div>
                  )}
                </div>
                </div>
              </details>
            )}

            {cardSaveError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {cardSaveError}
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 border-t border-white/35 pt-5">
              <button
                type="button"
                onClick={
                  closeCardModal
                }
                disabled={
                  isSavingCard
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveCard}
                disabled={
                  isUploadingAttachments ||
                  isSavingCard
                }
                className="rounded-lg px-5 py-2 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor:
                    accentColor,
                }}
              >
                {isUploadingAttachments
                  ? "Uploading files..."
                  : isSavingCard
                    ? "Saving..."
                    : editingCard
                      ? "Save changes"
                      : "Add card"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CARD MODAL */}

      {deleteCardTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">
              Delete card?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will permanently
              delete “
              {
                deleteCardTarget.title
              }
              ”, including its
              checklist and comments.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteCardTarget(
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
                  confirmDeleteCard
                }
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}