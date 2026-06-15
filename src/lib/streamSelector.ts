import type { StreamSource } from "@/lib/api";

const IOS_DETECTION_PATTERNS = [
  /^iOS\s*[-–—]\s*Server/i,
  /^iOS\s*[-–—]/i,
  /^iPhone\s*[-–—]/i,
  /^iPad\s*[-–—]/i,
  /iOS\s*Server/i,
  /Apple\s*HLS/i,
];

const IOS_SERVER_NUMBER_RE = /server\s*(\d+)/i;
const IOS_FALLBACK_NUMBER_RE = /ios\s*\D*(\d+)/i;
const IOS_KEYWORD_RE = /\bios\b/;
const IPHONE_IPAD_RE = /ip(hone|ad)/;

export function isiOSServer(source: StreamSource): boolean {
  const name = source.name?.trim() ?? "";

  for (const pattern of IOS_DETECTION_PATTERNS) {
    if (pattern.test(name)) return true;
  }

  const combined = `${name}|${source.type ?? "".trim()}|${source.platform ?? "".trim()}`.toLowerCase();
  return IOS_KEYWORD_RE.test(combined) || IPHONE_IPAD_RE.test(combined);
}

function extractIOSServerNumber(source: StreamSource): number {
  const name = source.name?.trim() ?? "";
  const match = name.match(IOS_SERVER_NUMBER_RE);
  if (match) return parseInt(match[1], 10);
  const numMatch = name.match(IOS_FALLBACK_NUMBER_RE);
  if (numMatch) return parseInt(numMatch[1], 10);
  return Infinity;
}

export function sortSourcesIOSFirst(sources: StreamSource[]): StreamSource[] {
  if (!sources?.length) return sources;
  return [...sources].sort((a, b) => {
    const aIsIOS = isiOSServer(a);
    const bIsIOS = isiOSServer(b);
    if (aIsIOS !== bIsIOS) return aIsIOS ? -1 : 1;
    const aNum = extractIOSServerNumber(a);
    const bNum = extractIOSServerNumber(b);
    if (aNum !== bNum) return aNum - bNum;
    return a.index - b.index;
  });
}

export function getFallbackSource(
  sources: StreamSource[],
  triedIndex: number,
): { url: string; type: string; index: number } | null {
  const nextIdx = triedIndex + 1;
  if (nextIdx < sources.length) {
    return { url: sources[nextIdx].url, type: sources[nextIdx].type, index: nextIdx };
  }
  return null;
}
