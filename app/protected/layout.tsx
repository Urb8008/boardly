import PushRegistration from "./push-registration";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PushRegistration />
      {children}
    </>
  );
}
