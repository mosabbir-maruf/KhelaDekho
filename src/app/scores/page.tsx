import ScoresClient from "./ScoresClient";
import { getGoalScores } from "@/lib/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScoresPage(props: { searchParams?: Promise<{ date?: string }> }) {
  const searchParams = await props.searchParams;
  const date = searchParams?.date;

  // A single fetch returns every match with its status; live / fixtures /
  // results are derived client-side, so no extra round-trips are needed.
  const data = await getGoalScores({ date });

  return <ScoresClient initialData={data ?? undefined} currentDate={date} />;
}
