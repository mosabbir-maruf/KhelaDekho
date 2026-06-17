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
import type { StreamSource } from "@/lib/api";

const V2_HOME_URL = process.env.NEXT_PUBLIC_V2_HOME_URL || 'https://kickbd.org';

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

const WIDEVINE_UUID = "urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed";
const PLAYREADY_UUID = "urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95";
const PSSH_REGEX = new RegExp(
  `<ContentProtection[^>]*schemeIdUri="(${WIDEVINE_UUID}|${PLAYREADY_UUID})"[^>]*>[\\s\\S]*?<\\/ContentProtection>`,
  "g"
);

function makeShakaPlayer(video: HTMLVideoElement, shaka: any) {
  const player = new shaka.Player();
  const netEngine = player.getNetworkingEngine();
  if (netEngine) {
    netEngine.registerRequestFilter((type: any, request: any) => {
      if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST) {
        request.headers['Referer'] = V2_HOME_URL;
      }
    });
    netEngine.registerResponseFilter((type: any, response: any) => {
      if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST && response.data) {
        const text = new TextDecoder().decode(response.data);
        const stripped = text.replace(PSSH_REGEX, "");
        if (stripped.length !== text.length) {
          response.data = new TextEncoder().encode(stripped).buffer;
        }
      }
    });
  }
  player.attach(video);
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

  const shakaPlayerRef = useRef<any>(null);
  const hlsPlayerRef = useRef<Hls | null>(null);
  const attachedTypeRef = useRef<string | null>(null);

  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [fallbackType, setFallbackType] = useState<string | null>(null);
  const failedSourceIndex = useRef(0);
  const fallbackSourcesRef = useRef(fallbackSources);
  fallbackSourcesRef.current = fallbackSources;

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
    setFallbackUrl(null);
    setFallbackType(null);
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
    resetControlsTimeout();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [resetControlsTimeout]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePlay = () => { setIsPlaying(true); resetControlsTimeout(); };
    const handlePause = () => { setIsPlaying(false); resetControlsTimeout(); };
    const handleWaiting = () => { setIsLoading(true); if (playerError) setPlayerError(null); };
    const handlePlaying = () => { setIsLoading(false); if (playerError) setPlayerError(null); if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; } };
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
  volumeRef.current = volume;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

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

  const clearKeysStr = clearKeys ? JSON.stringify(clearKeys) : "";

  // ---- Stream initialization ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveUrl) return;

    const newType = detectType(effectiveUrl, effectiveType);
    setIsLoading(true);
    setIsPlaying(false);
    setLevels([]);
    setCurrentLevel(-1);
    setPlayerError(null);

    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => {
      if (!playerError) setPlayerError("Stream is taking too long to load — the feed may be unavailable.");
      setIsLoading(false);
    }, 30000);

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
    const loadStream = async () => {
      // Destroy HLS if switching to DASH
      if (newType === "dash" && hlsPlayerRef.current) {
        hlsPlayerRef.current.destroy();
        hlsPlayerRef.current = null;
        attachedTypeRef.current = null;
      }

      // Destroy Shaka if switching to HLS
      if (newType !== "dash" && shakaPlayerRef.current) {
        try { await shakaPlayerRef.current.destroy(); } catch {}
        shakaPlayerRef.current = null;
        attachedTypeRef.current = null;
      }

      if (newType === "dash") {
        // Reuse existing Shaka player or create one
        if (!shakaPlayerRef.current && video) {
          const shaka = await getShaka();
          shakaPlayerRef.current = makeShakaPlayer(video, shaka);
        }
        attachedTypeRef.current = "dash";

        const player = shakaPlayerRef.current;
        if (!player) return;

        const keysObj = clearKeysStr ? JSON.parse(clearKeysStr) : null;
        if (keysObj && Object.keys(keysObj).length > 0) {
          player.configure({ drm: { clearKeys: keysObj } });
        } else {
          player.configure({ drm: { clearKeys: {} } });
        }

        player.removeEventListener("error", player._kdErrorHandler);
        const handler = (event: Event) => {
          const customEvent = event as CustomEvent;
          const err = customEvent.detail as { code?: number };
          console.error("Shaka Player Error:", err || event);
          setIsLoading(false);
          if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
          const isFatal = !err || !err.code || err.code === 4032 || err.code !== 4010;
          if (isFatal && tryFallback()) return;
          if (!err || !err.code) setPlayerError("Stream failed to load — the feed may be unavailable.");
          else if (err.code === 4032) setPlayerError("Stream manifest not found — the feed may have expired.");
          else if (err.code === 4010) setPlayerError("Failed to decrypt stream — invalid DRM keys.");
          else setPlayerError(`Stream error (code ${err.code}).`);
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
          tracks.forEach((track: any) => {
            if (track.height) uniqueQualities.set(track.height, `${track.height}p`);
          });
          setLevels(Array.from(uniqueQualities.entries()).map(([h, n]) => ({ id: h, name: n })).sort((a, b) => b.id - a.id));
        } catch (err) {
          console.error("Shaka load failed:", err);
          if (!destroyed && !tryFallback()) setIsLoading(false);
        }
        return;
      }

      if (newType === "direct") {
        video.src = effectiveUrl;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
          autoPlayVideo(video);
        }, { once: true });
        video.addEventListener("error", () => {
          setIsLoading(false);
          if (!tryFallback()) setPlayerError("Failed to load direct stream.");
        }, { once: true });
        return;
      }

      if (isApple && video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = effectiveUrl;
        const onLoaded = () => { setIsLoading(false); autoPlayVideo(video); };
        video.addEventListener("loadedmetadata", onLoaded);
        const nativeErrorHandler = () => {
          video.removeEventListener("loadedmetadata", onLoaded);
          if (video) video.removeEventListener("error", nativeErrorHandler);
          if (!tryFallback()) setIsLoading(false);
        };
        video.addEventListener("error", nativeErrorHandler);
      } else {
        try {
          const HlsClass = await getHls();
          if (HlsClass.isSupported()) {
            const hls = new HlsClass({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 15, maxMaxBufferLength: 30, backBufferLength: 10, capLevelToPlayerSize: false, autoStartLoad: true });
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
          } else { setIsLoading(false); }
        } catch { setIsLoading(false); }
      }
    };

    const cleanup = () => {
      destroyed = true;
      if (hlsPlayerRef.current) { hlsPlayerRef.current.destroy(); hlsPlayerRef.current = null; }
      attachedTypeRef.current = null;
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

  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;
    const doc = document as any;
    const isFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
    if (!isFS) {
      if (container.requestFullscreen) container.requestFullscreen();
      else (container as any).webkitRequestFullscreen?.();
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
      else if (doc.msExitFullscreen) doc.msExitFullscreen();
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

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
        const target = tracks.find((t: any) => t.height === id);
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

        <div className={`absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-overlay via-transparent to-bg-page z-10 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="flex items-center justify-between">
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

          <div className="flex items-center justify-between mt-auto pt-4">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="p-1.5 rounded bg-hover-alt hover:bg-hover-alt text-fg transition-colors cursor-pointer" aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="text-fg-dim hover:text-fg transition-colors cursor-pointer">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
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
