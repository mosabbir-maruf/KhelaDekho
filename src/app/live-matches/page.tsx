import { Suspense } from 'react';
import LiveMatchesClient from './LiveMatchesClient';
import { DEFAULT_STREAM_VERSION } from '@/lib/config';

// Static shell: channels are fetched client-side. The active server can be
// overridden via the `?v=` URL param. Keeping this static avoids bundling the
// Next.js server runtime into the Cloudflare Worker.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <LiveMatchesClient initialVersion={DEFAULT_STREAM_VERSION} />
    </Suspense>
  );
}
