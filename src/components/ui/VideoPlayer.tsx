"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Play from "lucide-react/dist/esm/icons/play";
import Pause from "lucide-react/dist/esm/icons/pause";
import Volume2 from "lucide-react/dist/esm/icons/volume-2";
import VolumeX from "lucide-react/dist/esm/icons/volume-x";
import Maximize from "lucide-react/dist/esm/icons/maximize";
import Settings from "lucide-react/dist/esm/icons/settings";
import PictureInPicture2 from "lucide-react/dist/esm/icons/picture-in-picture-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Tv from "lucide-react/dist/esm/icons/tv";
import Minimize from "lucide-react/dist/esm/icons/minimize";
import type Hls from "hls.js";
import { useDevicePlatform } from "@/hooks/useDevicePlatform";
import { getFallbackSource } from "@/lib/streamSelector";
import { getApiBaseUrl } from "@/lib/api";
import type { StreamSource } from "@/lib/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let shakaModule: any = null;
async function getShaka() {
  if (!shakaModule) {
    shakaModule = (await import("shaka-player")).default;
    shakaModule.polyfill.installAll();
  }
  return shakaModule;
}

interface VideoPlayerProps {
  streamUrl: string;
  streamType: string;
  clearKeys?: Record<string, string> | null;
  fallbackSources?: StreamSource[];
  className?: string;
}

function base64ToHex(b64: string): string {
  const raw = atob(b64);
  return Array.from(raw).map(ch => ch.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

const WIDEVINE_UUID = "urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed";
const PLAYREADY_UUID = "urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95";
const PSSH_REGEX = new RegExp(
  `<ContentProtection[^>]*schemeIdUri="(${WIDEVINE_UUID}|${PLAYREADY_UUID})"[^>]*>[\\s\\S]*?<\\/ContentProtection>`,
  "g"
);

async function makeShakaPlayer(video: HTMLVideoElement, shaka: typeof shakaModule, clearKeysRef: { current: Record<string, string> | null }) {
  const player = new shaka.Player();
  const netEngine = player.getNetworkingEngine();
  if (netEngine) {
    netEngine.registerRequestFilter((type: unknown, request: { headers: Record<string, string> }) => {
      if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST) {
        const apiBase = getApiBaseUrl();
        if (apiBase) request.headers['Referer'] = `${apiBase}/`;
      }
    });
    netEngine.registerResponseFilter((type: unknown, response: { data: ArrayBuffer }) => {
      if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST && response.data) {
        const keys = clearKeysRef.current;
        if (keys && Object.keys(keys).length > 0) {
          const text = new TextDecoder().decode(response.data);
          const stripped = text.replace(PSSH_REGEX, "");
          if (stripped.length !== text.length) {
            response.data = new TextEncoder().encode(stripped).buffer;
          }
        }
      }
    });
  }
  await player.attach(video);
  player.configure({
    streaming: { bufferingGoal: 15, rebufferingGoal: 3, bufferBehind: 10 },
    abr: { enabled: true, restrictToElementSize: false },
  });
  return player;
}

let hlsConstructor: typeof Hls | null = null;
async function getHls(): Promise<typeof Hls> {
  if (!hlsConstructor) hlsConstructor = (await import("hls.js")).default;
  return hlsConstructor;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mpegtsModule: any = null;
async function getMpegts() {
  if (!mpegtsModule) {
    mpegtsModule = (await import("mpegts.js")).default;
  }
  return mpegtsModule;
}

function detectType(url: string, hint: string): string {
  if (hint === "dash" || url.includes(".mpd")) return "dash";
  if (hint === "direct" || url.match(/\.ts($|\?)/)) return "direct";
  return "hls";
}

export function VideoPlayer({ streamUrl, streamType, clearKeys, fallbackSources, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [levels, setLevels] = useState<{ id: number; name: string }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isPiP, setIsPiP] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shakaPlayerRef = useRef<any>(null);
  const hlsPlayerRef = useRef<Hls | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mpegtsPlayerRef = useRef<any>(null);
  const attachedTypeRef = useRef<string | null>(null);

  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [fallbackType, setFallbackType] = useState<string | null>(null);
  const failedSourceIndex = useRef(0);
  const fallbackSourcesRef = useRef(fallbackSources);
  useEffect(() => { fallbackSourcesRef.current = fallbackSources; }, [fallbackSources]);

  const devicePlatform = useDevicePlatform();
  const isApple = devicePlatform === "ios" || devicePlatform === "ipados" || devicePlatform === "macos";

  const sortedSources = useMemo(() => {
    if (!fallbackSources || fallbackSources.length === 0) return undefined;
    if (!isApple) return fallbackSources;
    return [...fallbackSources].sort((a, b) => {
      const aIsIOS = a.name ? /^iOS\s*-/i.test(a.name.trim()) : false;
      const bIsIOS = b.name ? /^iOS\s*-/i.test(b.name.trim()) : false;
      if (aIsIOS !== bIsIOS) return aIsIOS ? -1 : 1;
      return a.index - b.index;
    });
  }, [fallbackSources, isApple]);

  const bestSource = useMemo(() => {
    if (isApple && sortedSources && sortedSources.length > 0) {
      return { url: sortedSources[0].url, type: sortedSources[0].type };
    }
    return null;
  }, [isApple, sortedSources]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setFallbackUrl(null);
    setFallbackType(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    failedSourceIndex.current = 0;
  }, [streamUrl]);

  const effectiveUrl = fallbackUrl || bestSource?.url || streamUrl;
  const effectiveType = fallbackType || bestSource?.type || streamType;
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMouseMoveRef = useRef<number>(0);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    if (isPiP) return;
    const now = Date.now();
    if (now - lastMouseMoveRef.current > 250) {
      lastMouseMoveRef.current = now;
      resetControlsTimeout();
    }
  }, [isPiP, resetControlsTimeout]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetControlsTimeout();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [resetControlsTimeout]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePlay = () => { setIsPlaying(true); resetControlsTimeout(); };
    const handlePause = () => { setIsPlaying(false); resetControlsTimeout(); };
    const handleWaiting = () => { setIsLoading(true); setPlayerError(null); };
    const handlePlaying = () => { setIsLoading(false); setPlayerError(null); if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; } };
    const handleLoadedMetadata = () => setIsLoading(false);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("seeking", handleWaiting);
    video.addEventListener("seeked", handlePlaying);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("seeking", handleWaiting);
      video.removeEventListener("seeked", handlePlaying);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [resetControlsTimeout]);

  const volumeRef = useRef(volume);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  const isMutedRef = useRef(isMuted);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  async function autoPlayVideo(video: HTMLVideoElement) {
    video.muted = true;
    try {
      await video.play();
      video.muted = false;
      video.volume = volumeRef.current;
      setIsMuted(false);
    } catch {}
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isApple) return;
    let debounce: ReturnType<typeof setTimeout>;
    const enforce = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (video && !isMutedRef.current) { video.muted = false; video.volume = volumeRef.current; }
      }, 100);
    };
    video.addEventListener("ratechange", enforce);
    video.addEventListener("waiting", enforce);
    return () => { clearTimeout(debounce); video.removeEventListener("ratechange", enforce); video.removeEventListener("waiting", enforce); };
  }, [isApple]);

  const clearKeysRef = useRef(clearKeys);
  useEffect(() => { clearKeysRef.current = clearKeys; }, [clearKeys]);
  const clearKeysStr = useMemo(() => clearKeys ? JSON.stringify(clearKeys) : "", [clearKeys]);

  // ---- Stream initialization ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveUrl) return;

    const newType = detectType(effectiveUrl, effectiveType);
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsLoading(true);
    setIsPlaying(false);
    setLevels([]);
    setCurrentLevel(-1);
    setPlayerError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    const timeoutMs = newType === "dash" ? 45000 : 20000;
    const timeoutId = setTimeout(() => {
      setPlayerError(newType === "dash" ? "DASH stream is taking too long to load — the feed may be slow or unavailable." : "Stream is taking too long to load — the feed may be unavailable.");
      setIsLoading(false);
    }, timeoutMs);
    loadingTimeoutRef.current = timeoutId;

    let destroyed = false;
    const tryFallback = () => {
      const sources = fallbackSourcesRef.current;
      if (sources && sources.length > 0) {
        const next = getFallbackSource(sources, failedSourceIndex.current);
        if (next) {
          failedSourceIndex.current = next.index;
          setFallbackUrl(next.url);
          setFallbackType(next.type);
          return true;
        }
      }
      return false;
    };
    const destroyAllPlayers = () => {
      if (hlsPlayerRef.current) { hlsPlayerRef.current.destroy(); hlsPlayerRef.current = null; }
      if (shakaPlayerRef.current) { try { shakaPlayerRef.current.destroy(); } catch {} shakaPlayerRef.current = null; }
      if (mpegtsPlayerRef.current) { try { mpegtsPlayerRef.current.destroy(); } catch {} mpegtsPlayerRef.current = null; }
      if (cleanupNativeListeners) { cleanupNativeListeners(); cleanupNativeListeners = null; }
    };

    const loadStream = async () => {
      destroyAllPlayers();
      attachedTypeRef.current = null;

      const attachNativeListeners = (errorMsg = "Failed to load stream natively.") => {
        const onLoaded = () => { if (destroyed) return; setIsLoading(false); autoPlayVideo(video); };
        const onError = () => { if (destroyed) return; setIsLoading(false); if (!tryFallback()) setPlayerError(errorMsg); };
        video.addEventListener("loadedmetadata", onLoaded);
        video.addEventListener("error", onError);
        cleanupNativeListeners = () => {
          video.removeEventListener("loadedmetadata", onLoaded);
          video.removeEventListener("error", onError);
        };
      };

      if (newType === "dash") {
        // Reuse existing Shaka player or create one
        if (!shakaPlayerRef.current && video) {
          const shaka = await getShaka();
          shakaPlayerRef.current = await makeShakaPlayer(video, shaka, clearKeysRef as { current: Record<string, string> | null });
        }
        attachedTypeRef.current = "dash";

        const player = shakaPlayerRef.current;
        if (!player) return;

        const keysObj: Record<string, string> | null = clearKeysStr ? JSON.parse(clearKeysStr) : null;
        if (keysObj && Object.keys(keysObj).length > 0) {
          const hexKeys: Record<string, string> = {};
          for (const kid of Object.keys(keysObj)) {
            const key = keysObj[kid];
            const hexKid = kid.length === 24 ? base64ToHex(kid) : kid;
            const hexKey = key.length === 24 ? base64ToHex(key) : key;
            const validHex = /^[0-9a-fA-F]+$/;
            if (validHex.test(hexKid) && hexKid.length % 2 === 0 && validHex.test(hexKey) && hexKey.length % 2 === 0) {
              hexKeys[hexKid] = hexKey;
            }
          }
          if (Object.keys(hexKeys).length > 0) {
            player.configure({ drm: { clearKeys: hexKeys } });
          }
        }

        player.removeEventListener("error", player._kdErrorHandler);
        const handler = (event: Event) => {
          if (destroyed) return;
          const customEvent = event as CustomEvent;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const err = customEvent.detail as any;
          const code = err?.code;
          const hasDetail = err && typeof err === "object" && Object.keys(err).length > 0;
          if (hasDetail) {
            const category = err?.category;
            console.error("Shaka Player Error:", { code, category, message: err.message, data: err.data }, "URL:", effectiveUrl);
          } else {
            console.warn("Shaka Player Error (empty detail) URL:", effectiveUrl);
          }
          setIsLoading(false);
          if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
          const isFatal = !err || !code || code === 4032 || code !== 4010;
          if (isFatal && tryFallback()) return;
          if (!err || !code) setPlayerError("Stream failed to load — the feed may be unavailable.");
          else if (code === 4032) setPlayerError("Stream manifest not found — the feed may have expired.");
          else if (code === 4010) setPlayerError("Failed to decrypt stream — invalid DRM keys.");
          else setPlayerError(`Stream error (code ${code}).`);
        };
        player._kdErrorHandler = handler;
        player.addEventListener("error", handler);

        try {
          await player.load(effectiveUrl);
          if (destroyed) return;
          setIsLoading(false);
          autoPlayVideo(video);

          const tracks = player.getVariantTracks();
          const uniqueQualities = new Map<number, string>();
          tracks.forEach((track: { height?: number }) => {
            if (track.height) uniqueQualities.set(track.height, `${track.height}p`);
          });
          setLevels(Array.from(uniqueQualities.entries()).map(([h, n]) => ({ id: h, name: n })).sort((a, b) => b.id - a.id));
        } catch {
          if (!destroyed && !tryFallback()) setPlayerError("Stream failed to load — the feed may be unavailable.");
        }
        return;
      }

      if (newType === "direct") {
        try {
          const mpegts = await getMpegts();
          if (mpegts.isSupported()) {
            const isTs = effectiveUrl.toLowerCase().includes(".ts");
            const player = mpegts.createPlayer({
              type: isTs ? "m2ts" : "mp4",
              isLive: true,
              url: effectiveUrl,
            });
            mpegtsPlayerRef.current = player;
            player.attachMediaElement(video);
            player.load();

            player.on(mpegts.Events.ERROR, () => {
              if (!destroyed && !tryFallback()) setPlayerError("Failed to load direct stream.");
            });

            attachNativeListeners("Failed to load direct stream (mpegts).");
            return;
          }
        } catch {}

        video.src = effectiveUrl;
        attachNativeListeners("Failed to load direct stream.");
        return;
      }

      try {
        const HlsClass = await getHls();
        if (HlsClass.isSupported()) {
          const hls = new HlsClass({ enableWorker: true, lowLatencyMode: false, maxBufferLength: 30, maxMaxBufferLength: 60, backBufferLength: 30, capLevelToPlayerSize: true, autoStartLoad: true });
          hlsPlayerRef.current = hls;
          hls.loadSource(effectiveUrl);
          hls.attachMedia(video);
          hls.on(HlsClass.Events.MANIFEST_PARSED, (_, data) => {
            setIsLoading(false);
            autoPlayVideo(video);
            setLevels(data.levels.map((level, idx) => ({ id: idx, name: level.height ? `${level.height}p` : `Level ${idx}` })).sort((a, b) => b.id - a.id));
          });
          hls.on(HlsClass.Events.ERROR, (_, data) => {
            if (data.fatal) {
              if (!tryFallback()) {
                if (data.type === HlsClass.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                else if (data.type === HlsClass.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
                else { cleanup(); }
              }
            }
          });
          return;
        }
      } catch {}

      if (typeof video.canPlayType === "function" && video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = effectiveUrl;
        attachNativeListeners("Failed to load stream via native HLS.");
        return;
      } else {
        if (!tryFallback()) {
          setPlayerError("HLS playback is not supported on this device.");
          setIsLoading(false);
        }
      }
    };

    let cleanupNativeListeners: (() => void) | null = null;

    const cleanup = () => {
      destroyed = true;
      destroyAllPlayers();
      if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
    };

    loadStream();
    return cleanup;
  }, [effectiveUrl, effectiveType, clearKeysStr]);

  useEffect(() => {
    if (videoRef.current) { videoRef.current.volume = volume; videoRef.current.muted = isMuted; }
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);
    video.addEventListener("enterpictureinpicture", onEnterPiP);
    video.addEventListener("leavepictureinpicture", onLeavePiP);
    return () => {
      video.removeEventListener("enterpictureinpicture", onEnterPiP);
      video.removeEventListener("leavepictureinpicture", onLeavePiP);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const toggleMute = useCallback(() => { setIsMuted(m => !m); resetControlsTimeout(); }, [resetControlsTimeout]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const isMobile = devicePlatform === "android" || devicePlatform === "ios" || devicePlatform === "ipados";

  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void; webkitExitFullscreen?: () => void; webkitDisplayingFullscreen?: boolean };
    if (!container || !video) return;
    
    const doc = document as Document & {
      webkitFullscreenElement?: Element; mozFullScreenElement?: Element; msFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>; mozCancelFullScreen?: () => Promise<void>; msExitFullscreen?: () => Promise<void>;
    };
    
    const isNativeFS = !!video.webkitDisplayingFullscreen;
    const isFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) || isNativeFS;
    
    if (!isFS) {
      if ((devicePlatform === "ios" || devicePlatform === "ipados") && typeof video.webkitEnterFullscreen === "function") {
        video.webkitEnterFullscreen();
      } else {
        const target: HTMLElement & { webkitRequestFullscreen?: () => Promise<void> } = (isMobile && video) ? video : container;
        if (target.requestFullscreen) target.requestFullscreen();
        else target.webkitRequestFullscreen?.();
      }
    } else {
      if (isNativeFS && typeof video.webkitExitFullscreen === "function") {
        video.webkitExitFullscreen();
      } else if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
      else if (doc.msExitFullscreen) doc.msExitFullscreen();
    }
    resetControlsTimeout();
  }, [isMobile, devicePlatform, resetControlsTimeout]);

  const handlePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {}
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleSelectQuality = useCallback((id: number) => {
    setCurrentLevel(id);
    setShowQualityMenu(false);
    if (shakaPlayerRef.current) {
      if (id === -1) shakaPlayerRef.current.configure({ abr: { enabled: true } });
      else {
        shakaPlayerRef.current.configure({ abr: { enabled: false } });
        const tracks = shakaPlayerRef.current.getVariantTracks();
        const target = tracks.find((t: { height?: number }) => t.height === id);
        if (target) shakaPlayerRef.current.selectVariantTrack(target, true);
      }
    } else if (hlsPlayerRef.current) hlsPlayerRef.current.currentLevel = id;
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  return (
    <div className={"relative w-full flex flex-col space-y-6" + (className ? " " + className : "")}>
      <div ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={() => videoRef.current && !videoRef.current.paused && setShowControls(false)} className="relative aspect-video w-full bg-[#030303] overflow-hidden border border-border-alt group cursor-default select-none shadow-2xl">
        <video ref={videoRef} onClick={togglePlay} className="w-full h-full object-contain cursor-pointer" playsInline autoPlay muted />

        {isLoading && !playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-overlay z-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              <span className="font-mono text-xs text-fg-dim tracking-wider uppercase">Buffering feed...</span>
            </div>
          </div>
        )}
        {playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-overlay z-20">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <div className="border border-red-500/20 bg-red-500/5 px-6 py-4">
                <span className="font-mono text-xs text-red-500 uppercase tracking-widest">[ STREAM_ERROR ]</span>
                <p className="font-mono text-[10px] text-fg-dim mt-2">{playerError}</p>
              </div>
            </div>
          </div>
        )}

        <div
          className={`absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-overlay via-transparent to-bg-page z-10 transition-opacity duration-300 pointer-events-none ${showControls ? "opacity-100" : "opacity-0"}`}
        >
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[10px] font-bold text-red-500 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE
              </div>
            </div>
            {clearKeys && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-input border border-border-alt text-xs font-mono text-fg-dim">
                <Tv className="w-3.5 h-3.5 text-red-500" />
                KhelaDekho
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-4 pointer-events-auto">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="p-1.5 rounded bg-hover-alt hover:bg-hover-alt text-fg transition-colors cursor-pointer" aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="text-fg-dim hover:text-fg transition-colors cursor-pointer">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                  <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" style={{ WebkitAppearance: "none" }} />
              </div>
            </div>

            <div className="flex items-center gap-4 relative">
              {levels.length > 0 && (
                <div className="relative">
                  <button onClick={() => setShowQualityMenu(p => !p)} className="flex items-center gap-1.5 text-fg-dim hover:text-fg font-mono text-xs cursor-pointer">
                    <Settings className="w-4 h-4" />
                    {currentLevel === -1 ? "Auto" : levels.find(l => l.id === currentLevel)?.name || "Auto"}
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-8 right-0 border border-border-alt bg-input py-1 shadow-2xl z-30 min-w-[100px] text-xs font-mono">
                      <button onClick={() => handleSelectQuality(-1)} className={`w-full px-3 py-1.5 text-left hover:bg-hover transition-colors ${currentLevel === -1 ? "text-red-500 font-semibold" : "text-fg-dim"}`}>Auto</button>
                      {levels.map(level => (
                        <button key={level.id} onClick={() => handleSelectQuality(level.id)} className={`w-full px-3 py-1.5 text-left hover:bg-hover transition-colors ${currentLevel === level.id ? "text-red-500 font-semibold" : "text-fg-dim"}`}>{level.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={handlePiP} className={`hover:text-fg transition-colors cursor-pointer ${isPiP ? "text-red-500" : "text-fg-dim"}`} aria-label="Picture in Picture"><PictureInPicture2 className="w-4 h-4" /></button>
              <button onClick={handleFullscreen} className="text-fg-dim hover:text-fg transition-colors cursor-pointer" aria-label="Toggle Fullscreen">
                <Minimize className="w-4 h-4 fullscreen-minimize-icon" />
                <Maximize className="w-4 h-4 fullscreen-maximize-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
