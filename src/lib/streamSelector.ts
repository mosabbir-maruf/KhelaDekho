import type { StreamSource } from "@/lib/api";

export function getFallbackSource(
  sources: StreamSource[],
  triedIndex: number,
): { url: string; type: string; index: number } | null {
  for (let i = triedIndex + 1; i < sources.length; i++) {
    return { url: sources[i].url, type: sources[i].type, index: i };
  }
  return null;
}
