// Development-only logging. In production builds these are no-ops so runtime
// internals aren't exposed in the browser console or edge logs.
const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
};
