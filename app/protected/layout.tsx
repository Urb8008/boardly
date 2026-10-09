import PushRegistration from "./push-registration";
import MobileNavigationEnhancer from "./mobile-navigation-enhancer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PushRegistration />
      <MobileNavigationEnhancer />
      {children}
    </>
  );
}
