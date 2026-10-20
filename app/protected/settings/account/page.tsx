"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState("");
  const [emailFeedback, setEmailFeedback] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        router.replace("/auth/login?next=%2Fprotected%2Fsettings%2Faccount");
        return;
      }
      setCurrentEmail(data.user.email ?? "");
      setLoading(false);
    });
    return () => { active = false; };
  }, [router]);

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordFeedback("");
    setPasswordError(false);
    if (password !== confirmPassword) {
      setPasswordError(true);
      setPasswordFeedback("The passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordBusy(false);
    if (error) {
      setPasswordError(true);
      setPasswordFeedback(error.message);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setPasswordFeedback("Your password has been updated.");
  }

  async function changeEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailFeedback("");
    setEmailError(false);
    const nextEmail = newEmail.trim().toLowerCase();
    if (!nextEmail || nextEmail === currentEmail.toLowerCase()) {
      setEmailError(true);
      setEmailFeedback("Enter a different email address.");
      return;
    }
    setEmailBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: nextEmail }, {
      emailRedirectTo: "https://touchbase.urbanenglish.es/protected/settings/account",
    });
    setEmailBusy(false);
    if (error) {
      setEmailError(true);
      setEmailFeedback(error.message);
      return;
    }
    setNewEmail("");
    setEmailFeedback("Email change requested. Follow the verification instructions sent by Supabase. Your login email changes only after the required confirmations are complete.");
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-50 p-6 text-sm text-slate-600">Loading account settings...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-700">TouchBase</p>
            <h1 className="mt-1 text-2xl font-bold">Account Settings</h1>
            <p className="mt-1 break-all text-sm text-slate-500">Signed in as {currentEmail}</p>
          </div>
          <button type="button" onClick={() => router.push("/protected/boards")} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100">Back to boards</button>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold">Change password</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a new password for your TouchBase login.</p>
          <form onSubmit={changePassword} className="mt-4 space-y-3">
            <label className="block text-sm font-medium" htmlFor="new-password">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            <label className="block text-sm font-medium" htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {passwordFeedback && <p role="status" className={`text-sm ${passwordError ? "text-red-700" : "text-green-700"}`}>{passwordFeedback}</p>}
            <button type="submit" disabled={passwordBusy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{passwordBusy ? "Saving..." : "Save new password"}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold">Change login email</h2>
          <p className="mt-1 text-sm text-slate-500">A verification email may be sent to your current and new addresses, depending on your Supabase authentication settings. Use your current email until the change is confirmed.</p>
          <form onSubmit={changeEmail} className="mt-4 space-y-3">
            <label className="block text-sm font-medium" htmlFor="new-email">New email address</label>
            <input id="new-email" type="email" autoComplete="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {emailFeedback && <p role="status" className={`text-sm ${emailError ? "text-red-700" : "text-green-700"}`}>{emailFeedback}</p>}
            <button type="submit" disabled={emailBusy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{emailBusy ? "Requesting..." : "Request email change"}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold">Board ownership and account deletion</h2>
          <p className="mt-2 text-sm text-slate-600">Ownership transfer and permanent account deletion are not available yet. Shared-board owners will be required to transfer ownership before deleting their account. This safeguard prevents accidental loss of other members' work.</p>
        </section>
      </div>
    </main>
  );
}
