import CalendarClient from "./calendar-client";

export const instant = false;

export default async function CalendarPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const boardId = Number(id);

  return (
    <CalendarClient
      boardId={boardId}
    />
  );
}