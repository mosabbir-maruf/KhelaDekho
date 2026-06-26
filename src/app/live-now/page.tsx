export const runtime = 'edge';

import LiveNowClient from './LiveNowClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <LiveNowClient />;
}
