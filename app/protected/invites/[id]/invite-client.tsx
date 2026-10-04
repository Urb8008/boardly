"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Invite = {
  id: number;
  board_id: number;
  email: string;
  role: string;
  accepted: boolean;
};

export default function InviteClient({
  inviteId,
}: {
  inviteId: number;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [invite, setInvite] =
    useState<Invite | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [accepting, setAccepting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [signedInEmail, setSignedInEmail] =
    useState("");

  useEffect(() => {
    loadInvite();
  }, []);

  async function loadInvite() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const invitePath =
        `/protected/invites/${inviteId}`;

      router.replace(
        `/auth/login?next=${encodeURIComponent(
          invitePath
        )}`
      );

      return;
    }

    setSignedInEmail(user.email ?? "");

    const {
      data,
      error: inviteError,
    } = await supabase.rpc(
      "get_board_invite_for_current_user",
      {
        invite_id: inviteId,
      }
    );

    const inviteData =
      Array.isArray(data)
        ? data[0]
        : data;

    if (inviteError || !inviteData) {
      setError(
        inviteError?.message ||
          `Invite #${inviteId} could not be loaded for ${user.email ?? "this account"}. The invite may have already been accepted, the link may be incorrect, or it was sent to a different email address.`
      );

      setLoading(false);
      return;
    }

    setInvite(inviteData as Invite);
    setLoading(false);
  }

  async function signInWithAnotherAccount() {
    const invitePath = `/protected/invites/${inviteId}`;

    await supabase.auth.signOut();

    router.replace(
      `/auth/login?next=${encodeURIComponent(invitePath)}`
    );
  }

  async function acceptInvite() {
    if (!invite) return;

    setAccepting(true);
    setError("");
    setSuccess("");

    const { error } =
      await supabase.rpc(
        "accept_board_invite",
        {
          invite_id: invite.id,
        }
      );

    if (error) {
      setError(
        error.message ||
          "Unable to accept invite."
      );

      setAccepting(false);
      return;
    }

    setSuccess(
      "Invite accepted. Opening board..."
    );

    setTimeout(() => {
      router.replace(
        `/protected/boards/${invite.board_id}`
      );
    }, 700);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading invite...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            TouchBase
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Board invitation
          </p>
        </div>

        {error ? (
          <div className="mt-8">
            <div className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
              {error}
            </div>

            {signedInEmail && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-900">
                  Signed in as
                </p>
                <p className="mt-1 break-all">
                  {signedInEmail}
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  This email must exactly match the email address the invitation was sent to.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={signInWithAnotherAccount}
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Sign in with another account
            </button>

            <button
              type="button"
              onClick={() =>
                router.replace(
                  "/protected/boards"
                )
              }
              className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Go to boards
            </button>
          </div>
        ) : invite ? (
          <div className="mt-8">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                You have been invited to
                collaborate on a TouchBase
                board.
              </p>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Invite sent to
                </p>

                <p className="mt-1 break-all text-sm font-medium text-slate-800">
                  {invite.email}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Role
                </p>

                <p className="mt-1 text-sm font-medium capitalize text-slate-800">
                  {invite.role}
                </p>
              </div>
            </div>

            {success && (
              <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
                {success}
              </div>
            )}

            <button
              type="button"
              onClick={
                acceptInvite
              }
              disabled={
                accepting ||
                Boolean(success)
              }
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {accepting
                ? "Accepting..."
                : success
                  ? "Accepted"
                  : "Accept invite"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.replace(
                  "/protected/boards"
                )
              }
              disabled={accepting}
              className="mt-3 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            >
              Back to boards
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}