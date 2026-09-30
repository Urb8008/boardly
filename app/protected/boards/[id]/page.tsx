export const instant = false;

import BoardClient from "./board-client";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BoardClient boardId={Number(id)} />;
}