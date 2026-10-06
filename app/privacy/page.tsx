export const metadata = {
  title: "Privacy Policy | TouchBase",
  description: "Privacy Policy for the TouchBase app.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">TouchBase Privacy Policy</h1>

        <p className="mt-2 text-sm text-slate-500">
          Effective date: 6 October 2026
        </p>

        <div className="mt-8 space-y-7 leading-7">
          <section>
            <h2 className="text-xl font-semibold">1. About TouchBase</h2>
            <p className="mt-2">
              TouchBase is a productivity and collaboration application that
              allows users to create and manage boards, tasks, messages,
              calendar items, links, attachments, and related workspace
              information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information we collect</h2>
            <p className="mt-2">
              Depending on how you use TouchBase, we may process information
              such as your name, email address, account information, board and
              task content, messages, comments, calendar information, uploaded
              files and attachments, links, and other content you choose to
              provide through the app.
            </p>
            <p className="mt-2">
              We may also receive limited technical information needed to
              operate and secure the service, such as device, browser, app,
              network, diagnostic, and log information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. How we use information</h2>
            <p className="mt-2">We use information to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>provide and maintain TouchBase;</li>
              <li>authenticate users and manage accounts;</li>
              <li>store and display boards, tasks, messages, files, and other user content;</li>
              <li>send service-related and transactional communications;</li>
              <li>support collaboration and communication features;</li>
              <li>protect the security and reliability of the service;</li>
              <li>troubleshoot problems and improve app performance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Service providers and data sharing</h2>
            <p className="mt-2">
              TouchBase relies on third-party service providers to operate
              parts of the service, including hosting, authentication,
              database storage, transactional email, and communication
              features. These providers may process information only as
              necessary to provide their services to TouchBase.
            </p>
            <p className="mt-2">
              We may also disclose information where required by law, to
              protect users or the service, or in connection with a legitimate
              business transfer.
            </p>
            <p className="mt-2">TouchBase does not sell personal information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Data retention</h2>
            <p className="mt-2">
              We retain information for as long as reasonably necessary to
              provide the service, maintain accounts, meet legal obligations,
              resolve disputes, and protect the security of TouchBase. Users
              may request deletion of their account or personal information by
              contacting us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Security</h2>
            <p className="mt-2">
              We use reasonable technical and organisational measures designed
              to protect information. No online service can guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Children's privacy</h2>
            <p className="mt-2">
              TouchBase is not intended for children under 13 unless its use
              is specifically authorised and managed in compliance with
              applicable law. If we learn that personal information from a
              child has been collected unlawfully, we will take appropriate
              steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Your choices and rights</h2>
            <p className="mt-2">
              Depending on your location, you may have rights to access,
              correct, delete, restrict, or object to certain processing of
              your personal information. You may contact us to make a privacy
              request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. International processing</h2>
            <p className="mt-2">
              Some service providers may process information in countries
              other than your own. Where required, we take appropriate steps
              to protect personal information when it is transferred
              internationally.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Changes to this policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. The updated
              version will be posted on this page with a revised effective
              date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Contact</h2>
            <p className="mt-2">
              If you have questions or privacy requests relating to TouchBase,
              contact:
            </p>
            <p className="mt-2">
              <strong>Urban English / TouchBase</strong>
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
      </div>
    </main>
  );
}
