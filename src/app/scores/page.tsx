import ScoresClient from "./ScoresClient";
import { getGoalScores, getGoalLiveScores, getGoalFixtures, getGoalResults } from "@/lib/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScoresPage(props: { searchParams?: Promise<{ date?: string }> }) {
  const searchParams = await props.searchParams;
  const date = searchParams?.date;

  const [allData, liveData, fixtureData, resultData] = await Promise.all([
    getGoalScores({ date }),
    getGoalLiveScores(date),
    getGoalFixtures(date),
    getGoalResults(date),
  ]);

  return (
    <ScoresClient
      initialAll={allData ?? undefined}
      initialLive={liveData ?? undefined}
      initialFixtures={fixtureData ?? undefined}
      initialResults={resultData ?? undefined}
      currentDate={date}
    />
  );
}
