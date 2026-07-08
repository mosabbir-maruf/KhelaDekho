"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";

export function useIsActive() {
  const pathname = usePathname();
  return useCallback((path: string) => pathname === path, [pathname]);
}
