"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Sun from "lucide-react/dist/esm/icons/sun";
import Moon from "lucide-react/dist/esm/icons/moon";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center border-l border-border h-full px-4">
        <div className="w-4 h-4" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center border-l border-border h-full px-4 hover:bg-hover transition-colors text-fg-dim hover:text-fg cursor-pointer"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="transition-transform duration-400 ease-in-out" style={{ transform: isDark ? "rotate(180deg)" : "rotate(0deg)" }}>
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </div>
    </button>
  );
}
