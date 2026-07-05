import PlayerDetailClient from "./PlayerDetailClient";
import { getGoalPlayerDetail } from "@/lib/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlayerDetailPage(props: {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { playerId } = await props.params;
  const { name } = await props.searchParams;
  const player = await getGoalPlayerDetail(playerId, name);

  return <PlayerDetailClient initialPlayer={player ?? undefined} playerName={name} />;
}
