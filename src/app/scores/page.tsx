import { Suspense } from "react";
import ScoresClient from "./ScoresClient";

// Static shell: ScoresClient fetches on mount and polls, and reads the date
// from the URL client-side. Keeping this page static (no server function)
// avoids bundling the Next.js server runtime into the Cloudflare Worker.
export default function ScoresPage() {
  return (
    <Suspense fallback={null}>
      <ScoresClient />
    </Suspense>
  );
}
