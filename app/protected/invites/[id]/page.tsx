import InviteClient from "./invite-client";

export const instant = false;

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <InviteClient
      inviteId={Number(id)}
    />
  );
}