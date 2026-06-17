"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useCopyButton(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), resetMs);
  }, [resetMs]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return { copied, copy };
}
