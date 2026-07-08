import { Suspense } from 'react';
import LiveMatchesClient from '../live-matches/LiveMatchesClient';

export default function BasketballPage() {
  return (
    <Suspense fallback={null}>
      <LiveMatchesClient initialVersion="v5" initialSport="basketball" lockedVersion="v5" />
    </Suspense>
  );
}
