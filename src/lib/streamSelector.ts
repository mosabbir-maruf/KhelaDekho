import type { StreamSource } from "@/lib/api";

export function getFallbackSource(
  sources: StreamSource[],
  triedIndex: number,
): { url: string; type: string; index: number } | null {
  const next = triedIndex + 1;
  if (next < sources.length) {
    return { url: sources[next].url, type: sources[next].type, index: next };
  }
  return null;
}
