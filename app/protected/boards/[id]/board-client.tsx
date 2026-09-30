"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [board, setBoard] =
    useState<Board | null>(null);

  const [boardMembers, setBoardMembers] =
    useState<BoardMember[]>([]);

  const [cards, setCards] =
    useState<Card[]>([]);

  const [checklistItems, setChecklistItems] =
    useState<ChecklistItem[]>([]);

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    isCardModalOpen,
    setIsCardModalOpen,
  ] = useState(false);

  const [editingCard, setEditingCard] =
    useState<Card | null>(null);

  const [cardTitle, setCardTitle] =
    useState("");

  const [
    cardDescription,
    setCardDescription,
  ] = useState("");

  const [cardDueDate, setCardDueDate] =
    useState("");

  const [cardPriority, setCardPriority] =
    useState<Priority>("medium");

  const [newCardStatus, setNewCardStatus] =
    useState<CardStatus>("todo");

  const [
    deleteCardTarget,
    setDeleteCardTarget,
  ] = useState<Card | null>(null);

  const [
    modalChecklistItems,
    setModalChecklistItems,
  ] = useState<ModalChecklistItem[]>([]);

  const [
    newChecklistText,
    setNewChecklistText,
  ] = useState("");

  const [modalComments, setModalComments] =
    useState<Comment[]>([]);

  const [
    newCommentText,
    setNewCommentText,
  ] = useState("");

  const [
    isInviteModalOpen,
    setIsInviteModalOpen,
  ] = useState(false);

  const [inviteEmail, setInviteEmail] =
    useState("");

  const [
    isSendingInvite,
    setIsSendingInvite,
  ] = useState(false);

  const [inviteMessage, setInviteMessage] =
    useState("");

  const [inviteError, setInviteError] =
    useState("");

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

  const isOwner =
    board !== null &&
    currentUserId !== null &&
    board.user_id === currentUserId;

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

    const user = await getCurrentUser();

    if (!user) {
      setLoading(false);
      return;
    }

    await Promise.all([
      loadBoard(),
      loadCards(),
    ]);

    setLoading(false);
  }

  // -----------------------------------
  // LOAD BOARD
  // -----------------------------------

  async function loadBoard() {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();

    if (error) {
      alert(
        `Error loading board: ${error.message}`
      );
      return;
    }

    setBoard(data);
  }

  // -----------------------------------
  // LOAD MEMBERS
  // -----------------------------------

  async function loadBoardMembers() {
    setIsLoadingMembers(true);
    setMembersError("");

    const { data, error } = await supabase
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

    const confirmed = window.confirm(
      `Remove ${
        member.email || "this member"
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

    if (loadedCards.length === 0) {
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

    if (checklistResult.error) {
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
    const email = inviteEmail
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
      error: createInviteError,
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
      const response = await fetch(
        "/api/send-board-invite",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            inviteId: invite.id,
            boardName:
              board?.name ||
              "Boardly board",
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
  // CARD MODAL
  // -----------------------------------

  function openAddCardModal(
    status: CardStatus
  ) {
    setEditingCard(null);

    setCardTitle("");
    setCardDescription("");
    setCardDueDate("");
    setCardPriority("medium");

    setNewCardStatus(status);

    setModalChecklistItems([]);
    setNewChecklistText("");

    setModalComments([]);
    setNewCommentText("");

    setIsCardModalOpen(true);
  }

  function openEditCardModal(
    card: Card
  ) {
    setEditingCard(card);

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

    setIsCardModalOpen(true);
  }

  function closeCardModal() {
    setIsCardModalOpen(false);
    setEditingCard(null);

    setCardTitle("");
    setCardDescription("");
    setCardDueDate("");
    setCardPriority("medium");

    setModalChecklistItems([]);
    setNewChecklistText("");

    setModalComments([]);
    setNewCommentText("");
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
          (item, itemIndex) =>
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
            (_, itemIndex) =>
              itemIndex !== index
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
            item.id !== undefined
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
          (item) =>
            item.id
        );

    if (
      deletedIds.length > 0
    ) {
      const { error } =
        await supabase
          .from("checklist_items")
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
        modalChecklistItems[index];

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
              text: item.text,
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
              card_id: cardId,
              user_id:
                userId,
              text: item.text,
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
  // COMMENTS
  // -----------------------------------

  async function addComment() {
    if (!editingCard)
      return;

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
        user_id:
          user.id,
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
    const trimmedTitle =
      cardTitle.trim();

    const trimmedDescription =
      cardDescription.trim();

    if (!trimmedTitle) return;

    const user =
      await getCurrentUser();

    if (!user) return;

    try {
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

        await loadCards();

        closeCardModal();

        return;
      }

      const cardsInColumn =
        cards.filter(
          (card) =>
            card.status ===
            newCardStatus
        );

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
            cardsInColumn.length +
            1,

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

      await saveChecklist(
        data.id,
        user.id
      );

      await loadCards();

      closeCardModal();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      alert(
        `Error saving card: ${message}`
      );
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
          status:
            newStatus,
        })
        .eq(
          "id",
          cardId
        )
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

    const cardId = Number(
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

    return (
      <div
        key={card.id}
        draggable
        onDragStart={(event) =>
          handleDragStart(
            event,
            card.id
          )
        }
        className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium leading-6 text-slate-800">
            {card.title}
          </p>

          <button
            type="button"
            onClick={() =>
              openEditCardModal(
                card
              )
            }
            className="rounded-md px-2 py-1 text-sm text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
          >
            Edit
          </button>
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
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${checklist.percentage}%`,
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
            Drag to move
          </span>

          <button
            type="button"
            onClick={() =>
              setDeleteCardTarget(
                card
              )
            }
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
        onDragOver={
          allowDrop
        }
        onDrop={(event) =>
          handleDrop(
            event,
            status
          )
        }
        className="flex min-h-[420px] w-80 flex-col rounded-2xl bg-slate-200/80 p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">
              {title}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-600 transition hover:bg-white hover:text-slate-900"
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
      <main className="min-h-screen bg-slate-100">
        <div className="border-b border-slate-200 bg-white">
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
              Boardly
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/protected/boards"
                )
              }
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              All boards
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/protected/boards"
              )
            }
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to boards
          </button>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
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
                Drag cards between columns to update their status.
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
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Invite member
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-6 overflow-x-auto pb-8">
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
      </main>

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
                    People who currently have access to this board.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeMembersModal
                  }
                  disabled={
                    Boolean(
                      removingMemberId
                    )
                  }
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
                  disabled={
                    Boolean(
                      removingMemberId
                    )
                  }
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
                    Invite someone to collaborate on this board.
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
                value={
                  inviteEmail
                }
                onChange={(
                  event
                ) => {
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
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
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
                cardTitle
              }
              onChange={(event) =>
                setCardTitle(
                  event.target.value
                )
              }
              placeholder="Enter a task..."
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
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

            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Checklist
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {modalCompleted}/
                    {modalTotal} complete
                  </p>
                </div>

                {modalTotal > 0 && (
                  <span className="text-sm font-medium text-slate-600">
                    {
                      modalPercentage
                    }
                    %
                  </span>
                )}
              </div>

              {modalTotal > 0 && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${modalPercentage}%`,
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
                        {
                          item.text
                        }
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
                    No checklist items yet.
                  </div>
                )}
              </div>
            </div>

            {editingCard && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Comments
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {modalComments.length}{" "}
                    {modalComments.length ===
                    1
                      ? "comment"
                      : "comments"}
                  </p>
                </div>

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
                      No comments yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={
                  closeCardModal
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  saveCard
                }
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                {editingCard
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
              This will permanently delete “
              {deleteCardTarget.title}
              ”, including its checklist and comments.
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