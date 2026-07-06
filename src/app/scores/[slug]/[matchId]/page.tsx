export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import MatchDetailClient from "./MatchDetailClient";

export default async function MatchDetailPage(props: {
  params: Promise<{ slug: string; matchId: string }>;
}) {
  const { slug, matchId } = await props.params;
  return <MatchDetailClient slug={slug} matchId={matchId} />;
}
