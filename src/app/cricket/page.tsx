import { Suspense } from 'react';
import LiveMatchesClient from '../live-matches/LiveMatchesClient';

export const dynamic = 'force-dynamic';

export default function CricketPage() {
  return (
    <Suspense fallback={null}>
      <LiveMatchesClient initialVersion="v5" initialSport="cricket" />
    </Suspense>
  );
}
