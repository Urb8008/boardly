import MessengerClient from "./messenger-client";

export const instant = false;

export default async function MessengerPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const boardId = Number(id);

  return (
    <MessengerClient
      boardId={boardId}
    />
  );
}