import MatchDetailClient from "./MatchDetailClient";
import { getGoalMatchDetail } from "@/lib/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MatchDetailPage(props: {
  params: Promise<{ slug: string; matchId: string }>;
}) {
  const { slug, matchId } = await props.params;
  const detail = await getGoalMatchDetail(matchId, slug);

  return <MatchDetailClient initialDetail={detail ?? undefined} slug={slug} matchId={matchId} />;
}
