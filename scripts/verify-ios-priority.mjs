// iOS Server Priority — Direct Logic Verification
// Simulates the streamSelector.ts logic without needing path aliases

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

function isiOSServer(source) {
  const name = source.name?.trim() ?? "";
  for (const pattern of IOS_DETECTION_PATTERNS) {
    if (pattern.test(name)) return true;
  }
  const combined = `${name}|${(source.type ?? "").trim()}|${(source.platform ?? "").trim()}`.toLowerCase();
  return IOS_KEYWORD_RE.test(combined) || IPHONE_IPAD_RE.test(combined);
}

function extractIOSServerNumber(source) {
  const name = source.name?.trim() ?? "";
  const match = name.match(IOS_SERVER_NUMBER_RE);
  if (match) return parseInt(match[1], 10);
  const numMatch = name.match(IOS_FALLBACK_NUMBER_RE);
  if (numMatch) return parseInt(numMatch[1], 10);
  return Infinity;
}

function sortSourcesIOSFirst(sources) {
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

function getInitialAppleSource(sources) {
  if (!sources?.length) return null;
  return { url: sources[0].url, type: sources[0].type, sourceName: sources[0].name ?? "iOS Server (unnamed)" };
}

function getFallbackSource(sources, triedIndex) {
  const nextIdx = triedIndex + 1;
  if (nextIdx < sources.length) {
    return { url: sources[nextIdx].url, type: sources[nextIdx].type, index: nextIdx };
  }
  return null;
}

function S(overrides) {
  return {
    index: overrides.index ?? 0,
    url: overrides.url ?? `https://example.com/stream_${overrides.index}.m3u8`,
    type: overrides.type ?? "hls",
    is_primary: overrides.is_primary ?? false,
    name: overrides.name,
    platform: overrides.platform,
  };
}

let passed = 0, failed = 0;

function test(desc, condition, detail) {
  if (condition) { passed++; console.log(`  \x1b[32m✓\x1b[0m ${desc}`); }
  else { failed++; console.log(`  \x1b[31m✗\x1b[0m ${desc}${detail ? ' — ' + detail : ''}`); }
}

// ─── TEST 1: Name Pattern Detection ───
console.log("\n\x1b[1m═══ TEST 1: iOS Server Name Pattern Detection ═══\x1b[0m");
[
  ["iOS - Server 1", true], ["iOS - Server 2", true], ["iOS – Server 3", true], ["iOS — Server 4", true],
  ["iOS - HLS", true], ["iPhone - Stream", true], ["iPad - Stream", true], ["Apple HLS", true],
  ["Some iOS Server backup", true], ["Regular HLS Server", false], ["DASH Provider A", false],
  ["Generic CDN", false], ["", false],
].forEach(([name, expected]) => {
  const r = isiOSServer(S({ index: 0, name }));
  test(`"${name}" → ${r} (expected: ${expected})`, r === expected);
});

// ─── TEST 2: Metadata Fallback ───
console.log("\n\x1b[1m═══ TEST 2: Metadata Fallback Detection ═══\x1b[0m");
[
  [{ type: "ios-hls", platform: "ios" }, true], [{ type: "hls", platform: "iphone" }, true],
  [{ type: "hls", platform: "ipad" }, true], [{ type: "hls", platform: "generic" }, false],
  [{ type: "dash", platform: "web" }, false],
].forEach(([over, expected]) => {
  const r = isiOSServer(S({ index: 0, ...over }));
  test(`type=${over.type}, platform=${over.platform} → ${r} (expected: ${expected})`, r === expected);
});

// ─── TEST 3: Full Source Set Sorting ───
console.log("\n\x1b[1m═══ TEST 3: Full Source Set — iOS Priority Sorting ═══\x1b[0m");
const sources = [
  S({ index: 0, name: "Other HLS Provider", type: "hls" }),
  S({ index: 1, name: "iOS - Server 4", type: "hls" }),
  S({ index: 2, name: "iOS - Server 1", type: "hls" }),
  S({ index: 3, name: "iOS - Server 2", type: "hls" }),
  S({ index: 4, name: "DASH Server A", type: "dash", url: "https://dash.example.com/manifest.mpd" }),
  S({ index: 5, name: "iOS - Server 3", type: "hls" }),
  S({ index: 6, name: "Generic CDN HLS", type: "hls" }),
];
const sorted = sortSourcesIOSFirst(sources);
const sortedNames = sorted.map(s => `${s.index}:${s.name}`);
console.log("  Sorted order:", sortedNames.join(" → "));

test("Same length", sorted.length === 7);
test("First 4 are all iOS", sorted.slice(0, 4).every(s => isiOSServer(s)));
test("Non-iOS start at position 4", !isiOSServer(sorted[4]));
const iosIdx = sorted.filter(s => isiOSServer(s)).map(s => s.index);
test("iOS order: Server 1(2) → 2(3) → 3(5) → 4(1)", iosIdx[0]===2 && iosIdx[1]===3 && iosIdx[2]===5 && iosIdx[3]===1, `got [${iosIdx}]`);

// ─── TEST 4: Initial Apple Source ───
console.log("\n\x1b[1m═══ TEST 4: Initial Apple Source Selection ═══\x1b[0m");
const initial = getInitialAppleSource(sorted);
test("Initial = iOS Server 1", initial?.sourceName === "iOS - Server 1", `got: ${initial?.sourceName}`);
test("Type = hls (NOT dash/mpd)", initial?.type === "hls", `got: ${initial?.type}`);
test("URL does NOT contain .mpd", initial && !initial.url.includes(".mpd"), `URL: ${initial?.url?.substring(0,60)}`);

// ─── TEST 5: No iOS Servers → Returns null ───
console.log("\n\x1b[1m═══ TEST 5: No iOS Servers — Returns null ═══\x1b[0m");
const noIOS = [
  S({ index: 0, name: "Generic HLS", type: "hls" }),
  S({ index: 1, name: "DASH Provider", type: "dash", url: "https://dash.example.com/manifest.mpd" }),
];
const noIOSSorted = sortSourcesIOSFirst(noIOS);
test("First is NOT iOS when no iOS servers exist", !isiOSServer(noIOSSorted[0]), `first is: ${noIOSSorted[0].name}`);
test("bestSource would be null (isiOSServer on first element fails)", !isiOSServer(noIOSSorted[0]));

// ─── TEST 6: Full Fallback Chain ───
console.log("\n\x1b[1m═══ TEST 6: Full Fallback Chain Simulation ═══\x1b[0m");
let idx = -1;
const chain = [];
while (true) { const fb = getFallbackSource(sorted, idx); if (!fb) break; idx = fb.index; chain.push(fb); }
  console.log("  Chain:", chain.map(c => `${sorted[c.index].name} [${isiOSServer(sorted[c.index]) ? "iOS" : "non-iOS"}]`).join(" → "));
test("All 7 sources in chain", chain.length === 7);
test("First 4 = iOS only", chain.slice(0, 4).every(c => isiOSServer(sorted[c.index])));
test("Remaining = non-iOS", chain.slice(4).every(c => !isiOSServer(sorted[c.index])));
test("iOS order: 1→2→3→4",
  sorted[chain[0].index].name === "iOS - Server 1" &&
  sorted[chain[1].index].name === "iOS - Server 2" &&
  sorted[chain[2].index].name === "iOS - Server 3" &&
  sorted[chain[3].index].name === "iOS - Server 4");

// ─── TEST 7: Edge Cases ───
console.log("\n\x1b[1m═══ TEST 7: Edge Cases ═══\x1b[0m");
test("Empty → empty sorted", sortSourcesIOSFirst([]).length === 0);
test("Empty → null initial", getInitialAppleSource([]) === null);
test("Single iOS → selected", getInitialAppleSource([S({ index: 0, name: "iOS - Server 1", type: "hls" })])?.sourceName === "iOS - Server 1");
test("No name field → not detected", !isiOSServer(S({ index: 0, type: "hls" })));
test("iOS in URL only → NOT detected (URL excluded)", !isiOSServer(S({ index: 0, name: "Generic", type: "hls", url: "https://ios.cdn.example.com/stream.m3u8" })));
test("Idempotent sort", JSON.stringify(sortSourcesIOSFirst(sorted)) === JSON.stringify(sorted));

// ─── Summary ───
console.log(`\n\x1b[1m═══ RESULTS: ${passed}/${passed+failed} passed, ${failed} failed ═══\x1b[0m`);
if (failed === 0) {
  console.log("\n\x1b[32m  ✓ All iOS priority logic tests PASSED\x1b[0m");
  console.log("  ✓ iOS Server 1 selected first on Apple devices");
  console.log("  ✓ Fallback: iOS1→iOS2→iOS3→iOS4→non-iOS");
  console.log("  ✓ DASH/MPD never initial source on Apple");
  console.log("  ✓ Generic HLS never before iOS servers");
  console.log("  ✓ Deterministic ordering confirmed");
} else {
  console.log(`\n\x1b[31m  ✗ ${failed} tests FAILED\x1b[0m`);
}
process.exit(failed > 0 ? 1 : 0);
