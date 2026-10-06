export const metadata = {
  title: "Delete Account | TouchBase",
  description: "Request deletion of your TouchBase account and associated data.",
};

export default function DeleteAccountPage() {
  const subject = encodeURIComponent("TouchBase account deletion request");
  const body = encodeURIComponent(
    "Please delete my TouchBase account and associated data.\n\n" +
      "TouchBase account email: \n\n" +
      "I understand that account deletion is permanent."
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Delete your TouchBase account</h1>

        <p className="mt-4 leading-7 text-slate-700">
          You can request permanent deletion of your TouchBase account and the
          personal data associated with it.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">How to request deletion</h2>

          <ol className="mt-3 list-decimal space-y-2 pl-6 leading-7 text-slate-700">
            <li>
              Send an email from the email address associated with your
              TouchBase account.
            </li>
            <li>
              Use the subject line <strong>TouchBase account deletion request</strong>.
            </li>
            <li>
              Include the email address used for your TouchBase account.
            </li>
          </ol>

          <a
            href={`mailto:urbanenglish.zaragoza@gmail.com?subject=${subject}&body=${body}`}
            className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Request account deletion
          </a>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">What will be deleted</h2>

          <p className="mt-3 leading-7 text-slate-700">
            After we verify the request, we will delete the TouchBase account
            and personal data associated with that account, including account
            information and user-created TouchBase content that is linked to
            the account, except where information must be retained for a
            legitimate legal, security, fraud-prevention, or regulatory reason.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Processing time</h2>

          <p className="mt-3 leading-7 text-slate-700">
            We aim to process verified account deletion requests as soon as
            reasonably possible. If we need additional information to verify
            account ownership, we will contact you using the account email
            address.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Important</h2>

          <p className="mt-3 leading-7 text-slate-700">
            Account deletion is permanent. Once the account and associated data
            have been deleted, they may not be recoverable.
          </p>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-xl font-semibold">Contact</h2>

          <p className="mt-3 text-slate-700">
            Urban English / TouchBase
            <br />
            Email:{" "}
            <a
              href="mailto:urbanenglish.zaragoza@gmail.com"
              className="text-blue-600 underline"
            >
              urbanenglish.zaragoza@gmail.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
