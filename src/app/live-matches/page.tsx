export const runtime = 'edge';

import LiveMatchesClient from './LiveMatchesClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // Since we are running on Cloudflare Edge, local file reads/writes (fs) are not supported.
  // We default to "v4" as requested.
  const defaultVersion = "v4";

  return <LiveMatchesClient initialVersion={defaultVersion as any} />;
}

