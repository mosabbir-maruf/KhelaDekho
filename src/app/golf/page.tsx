import { Suspense } from 'react';
import LiveMatchesClient from '../live-matches/LiveMatchesClient';

export default function GolfPage() {
  return (
    <Suspense fallback={null}>
      <LiveMatchesClient initialVersion="v5" initialSport="golf" lockedVersion="v5" />
    </Suspense>
  );
}
