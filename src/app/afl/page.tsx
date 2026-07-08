import { Suspense } from 'react';
import LiveMatchesClient from '../live-matches/LiveMatchesClient';

export default function AflPage() {
  return (
    <Suspense fallback={null}>
      <LiveMatchesClient initialVersion="v5" initialSport="afl" lockedVersion="v5" />
    </Suspense>
  );
}
