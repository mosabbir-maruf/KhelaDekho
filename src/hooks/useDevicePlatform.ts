"use client";

import { useSyncExternalStore } from "react";

export type DevicePlatform = "ios" | "ipados" | "android" | "macos" | "windows" | "linux" | "unknown";

function getDevicePlatform(): DevicePlatform {
  if (typeof navigator === "undefined") return "unknown";

  const nav = navigator as Navigator & {
    userAgentData?: { platform: string; mobile: boolean };
    maxTouchPoints?: number;
  };

  if (nav.userAgentData) {
    const p = nav.userAgentData.platform.toLowerCase();
    if (p.includes("iphone") || (p.includes("ipad") && nav.userAgentData.mobile)) return "ios";
    if (p.includes("ipad") || (p === "macos" && nav.userAgentData.mobile)) return "ipados";
    if (p.includes("mac")) return "macos";
    if (p.includes("android")) return "android";
    if (p.includes("win")) return "windows";
    if (p.includes("linux")) return "linux";
  }

  const ua = navigator.userAgent;
  if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 0 && /Safari/i.test(ua) && !/Chrome/i.test(ua))) return "ipados";
  if (/iPhone|iPod/i.test(ua)) return "ios";
  if (/Mac/i.test(ua)) return "macos";
  if (/Android/i.test(ua)) return "android";
  if (/Win/i.test(ua)) return "windows";
  if (/Linux/i.test(ua)) return "linux";

  return "unknown";
}

export function useDevicePlatform(): DevicePlatform {
  return useSyncExternalStore(
    () => () => {},
    () => getDevicePlatform(),
    () => "unknown",
  );
}
