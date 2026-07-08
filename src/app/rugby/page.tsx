import { Suspense } from 'react';
import LiveMatchesClient from '../live-matches/LiveMatchesClient';

export default function RugbyPage() {
  return (
    <Suspense fallback={null}>
      <LiveMatchesClient initialVersion="v5" initialSport="rugby" lockedVersion="v5" />
    </Suspense>
  );
}
