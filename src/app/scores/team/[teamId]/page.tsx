import TeamDetailClient from "./TeamDetailClient";
import { getGoalTeamDetail } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamDetailPage(props: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { teamId } = await props.params;
  const { name } = await props.searchParams;
  const team = await getGoalTeamDetail(teamId, name);

  return <TeamDetailClient initialTeam={team ?? undefined} teamName={name} />;
}
