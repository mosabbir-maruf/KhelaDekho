"use client";

import { useParams } from "next/navigation";
import MatchDetailClient from "./MatchDetailClient";

export default function MatchDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const matchId = params?.matchId as string;

  return <MatchDetailClient slug={slug} matchId={matchId} />;
}
