import { Suspense } from 'react';
import LiveMatchesClient from '../live-matches/LiveMatchesClient';

export default function FightPage() {
  return (
    <Suspense fallback={null}>
      <LiveMatchesClient initialVersion="v5" initialSport="fight" lockedVersion="v5" />
    </Suspense>
  );
}
