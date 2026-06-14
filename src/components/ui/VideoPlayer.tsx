"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

interface VideoPlayerProps {
  streamUrl: string;
  streamType: string;
  clearKeys?: Record<string, string> | null;
}

export function VideoPlayer({ streamUrl, streamType, clearKeys }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Quality States
  const [levels, setLevels] = useState<{ id: number; name: string }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 is Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isPiP, setIsPiP] = useState(false);

  // Player references
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shakaPlayerRef = useRef<any>(null);
  const hlsPlayerRef = useRef<Hls | null>(null);

  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMouseMoveRef = useRef<number>(0);

  const resetControlsTimeout = useCallback(() => {
    setShowControls((curr) => (curr ? curr : true));
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    if (isPiP) return; // Disable controls hover tracking when in PiP
    const now = Date.now();
    if (now - lastMouseMoveRef.current > 250) {
      lastMouseMoveRef.current = now;
      resetControlsTimeout();
    }
  }, [isPiP, resetControlsTimeout]);

  // Sync controls timer lifecycle
  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // Fullscreen transitions are handled 100% natively in browser layout and CSS to prevent React reflow collisions during active macOS animations

  // HTML5 Video event listeners for playback state syncing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      resetControlsTimeout();
    };
    const handlePause = () => {
      setIsPlaying(false);
      resetControlsTimeout();
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
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

  // Stringify clearKeys to prevent unnecessary useEffect cleanups due to object identity changes
  const clearKeysStr = clearKeys ? JSON.stringify(clearKeys) : "";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setIsLoading(true);
    setIsPlaying(false);
    setLevels([]);
    setCurrentLevel(-1);
    setPlayerError(null);

    // Clean up function for previous stream
    const cleanupPlayers = async () => {
      if (shakaPlayerRef.current) {
        try {
          await shakaPlayerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying Shaka player:", e);
        }
        shakaPlayerRef.current = null;
      }
      if (hlsPlayerRef.current) {
        hlsPlayerRef.current.destroy();
        hlsPlayerRef.current = null;
      }
    };

    const initStream = async () => {
      await cleanupPlayers();

      // Check stream type
      const isDash = streamType === "dash" || streamUrl.includes(".mpd");

      if (isDash) {
        try {
          const shaka = (await import("shaka-player")).default;
          shaka.polyfill.installAll();

          if (!shaka.Player.isBrowserSupported()) {
            console.error("Browser not supported for Shaka Player");
            video.src = streamUrl;
            setIsLoading(false);
            return;
          }

          const player = new shaka.Player();
          shakaPlayerRef.current = player;
          await player.attach(video);

          // Configure for performance and ABR size restrictions
          player.configure({
            streaming: {
              bufferingGoal: 15,       // Raised buffer limit to absorb layout changes
              rebufferingGoal: 3,      // Rebuffer when buffer falls below 3s
              bufferBehind: 10,        // Clear played buffer segments after 10s to save memory
            },
            abr: {
              enabled: true,
              restrictToElementSize: false, // Disabled to prevent ABR quality switch stalls
            }
          });

          // Configure ClearKey DRM if keys exist
          const keysObj = clearKeysStr ? JSON.parse(clearKeysStr) : null;
          if (keysObj && Object.keys(keysObj).length > 0) {
            player.configure({
              drm: {
                clearKeys: keysObj,
              },
            });
          }

          player.addEventListener("error", (event: Event) => {
            const customEvent = event as CustomEvent;
            const err = customEvent.detail as { code?: number; category?: string; severity?: string };
            console.error("Shaka Player Error:", err || event);
            setIsLoading(false);
            if (!err || !err.code) {
              setPlayerError("Stream failed to load — the feed may be unavailable.");
              return;
            }
            if (err.code === 4032) setPlayerError("Stream manifest not found — the feed may have expired.");
            else if (err.code === 4010) setPlayerError("Failed to decrypt stream — invalid DRM keys.");
            else setPlayerError(`Stream error (code ${err.code}).`);
          });

          await player.load(streamUrl);
          setIsLoading(false);

          // Set up quality tracks
          const tracks = player.getVariantTracks();
          const uniqueQualities = new Map<number, string>();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tracks.forEach((track: any) => {
            if (track.height) {
              uniqueQualities.set(track.height, `${track.height}p`);
            }
          });

          const qualityList = Array.from(uniqueQualities.entries())
            .map(([height, name]) => ({ id: height, name }))
            .sort((a, b) => b.id - a.id);

          setLevels(qualityList);
        } catch (err) {
          console.error("Shaka player initialization failed:", err);
          setIsLoading(false);
        }
      } else {
        // HLS Stream (.m3u8)
        try {
          const HlsClass = (await import("hls.js")).default;
          if (HlsClass.isSupported()) {
            const hls = new HlsClass({
              enableWorker: true,            // Run demuxing in web worker for UI responsiveness
              lowLatencyMode: true,          // Optimize for low latency streams
              maxBufferLength: 15,           // Raised buffer limit to absorb layout changes
              maxMaxBufferLength: 30,
              backBufferLength: 10,          // Prune back buffer to free memory
              capLevelToPlayerSize: false,   // Disabled to prevent ABR quality switch stalls
              autoStartLoad: true,
            });
            hlsPlayerRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(HlsClass.Events.MANIFEST_PARSED, (_, data) => {
              setIsLoading(false);
              const qualityList = data.levels.map((level, idx) => ({
                id: idx,
                name: level.height ? `${level.height}p` : `Level ${idx}`,
              })).sort((a, b) => b.id - a.id);

              setLevels(qualityList);
            });

            hls.on(HlsClass.Events.ERROR, (_, data) => {
              if (data.fatal) {
                switch (data.type) {
                  case HlsClass.ErrorTypes.NETWORK_ERROR:
                    console.error("HLS Network error, trying to recover...");
                    hls.startLoad();
                    break;
                  case HlsClass.ErrorTypes.MEDIA_ERROR:
                    console.error("HLS Media error, trying to recover...");
                    hls.recoverMediaError();
                    break;
                  default:
                    console.error("Fatal HLS error, cannot recover");
                    cleanupPlayers();
                    break;
                }
              }
            });
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
          } else {
            console.error("HLS not supported in this browser");
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Failed to load hls.js dynamically:", err);
          setIsLoading(false);
        }
      }
    };

    initStream();

    return () => {
      cleanupPlayers();
    };
  }, [streamUrl, streamType, clearKeysStr]);

  // Sync volume state to video ref
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Sync PiP state
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

    if (video.paused) {
      video.play().catch(err => {
        console.error("Playback failed:", err);
      });
    } else {
      video.pause();
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const toggleMute = useCallback(() => {
    setIsMuted((muted) => !muted);
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) {
      setIsMuted(false);
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const doc = document as unknown as {
      fullscreenElement?: Element;
      webkitFullscreenElement?: Element;
      mozFullScreenElement?: Element;
      msFullscreenElement?: Element;
      exitFullscreen?: () => Promise<void>;
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };

    const isFS = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isFS) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch((err) => {
          console.error("Error attempting to enable full-screen:", err);
        });
      } else {
        const c = container as unknown as {
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        };
        const v = video as unknown as {
          webkitEnterFullscreen?: () => void;
        };

        if (c.webkitRequestFullscreen) {
          c.webkitRequestFullscreen();
        } else if (c.mozRequestFullScreen) {
          c.mozRequestFullScreen();
        } else if (c.msRequestFullscreen) {
          c.msRequestFullscreen();
        } else if (v && v.webkitEnterFullscreen) {
          v.webkitEnterFullscreen();
        }
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handlePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP failed:", err);
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleSelectQuality = useCallback((id: number) => {
    setCurrentLevel(id);
    setShowQualityMenu(false);

    if (shakaPlayerRef.current) {
      const player = shakaPlayerRef.current;
      if (id === -1) {
        player.configure({ abr: { enabled: true } });
      } else {
        player.configure({ abr: { enabled: false } });
        const tracks = player.getVariantTracks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const targetTrack = tracks.find((t: any) => t.height === id);
        if (targetTrack) {
          player.selectVariantTrack(targetTrack, true);
        }
      }
    } else if (hlsPlayerRef.current) {
      hlsPlayerRef.current.currentLevel = id;
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  return (
    <div className="relative w-full flex flex-col space-y-6">
      {/* Video Canvas Box */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => videoRef.current && !videoRef.current.paused && setShowControls(false)}
        className="relative aspect-video w-full bg-[#030303] overflow-hidden border border-border-alt group cursor-default select-none shadow-2xl"
        style={{
          transform: "translate3d(0, 0, 0)",
          willChange: "transform",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        <video
          ref={videoRef}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
          style={{
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        />

        {/* Loading Spinner / Error */}
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

        {/* Controls Overlay */}
        <div
          className={`absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-overlay via-transparent to-bg-page z-10 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Top Panel */}
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

          {/* Bottom Controls */}
          <div className="flex items-center justify-between mt-auto pt-4">
            <div className="flex items-center gap-4">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="p-1.5 rounded bg-hover-alt hover:bg-hover-alt text-fg transition-colors cursor-pointer"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              {/* Volume Block */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="text-fg-dim hover:text-fg transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 relative">
              {/* Quality Settings */}
              {levels.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu((prev) => !prev)}
                    className="flex items-center gap-1.5 text-fg-dim hover:text-fg font-mono text-xs cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    {currentLevel === -1
                      ? "Auto"
                      : levels.find((l) => l.id === currentLevel)?.name || "Auto"}
                  </button>

                  {/* Quality Select dropdown */}
                  {showQualityMenu && (
                    <div className="absolute bottom-8 right-0 border border-border-alt bg-input py-1 shadow-2xl z-30 min-w-[100px] text-xs font-mono">
                      <button
                        onClick={() => handleSelectQuality(-1)}
                        className={`w-full px-3 py-1.5 text-left hover:bg-hover transition-colors ${
                          currentLevel === -1 ? "text-red-500 font-semibold" : "text-fg-dim"
                        }`}
                      >
                        Auto
                      </button>
                      {levels.map((level) => (
                        <button
                          key={level.id}
                          onClick={() => handleSelectQuality(level.id)}
                          className={`w-full px-3 py-1.5 text-left hover:bg-hover transition-colors ${
                            currentLevel === level.id ? "text-red-500 font-semibold" : "text-fg-dim"
                          }`}
                        >
                          {level.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PiP */}
              <button
                onClick={handlePiP}
                className={`hover:text-fg transition-colors cursor-pointer ${
                  isPiP ? "text-red-500" : "text-fg-dim"
                }`}
                aria-label="Picture in Picture"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="text-fg-dim hover:text-fg transition-colors cursor-pointer"
                aria-label="Toggle Fullscreen"
              >
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
