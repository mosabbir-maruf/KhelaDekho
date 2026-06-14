"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useRef, useEffect } from "react";
import { GA_MEASUREMENT_ID, isAnalyticsEnabled } from "@/lib/analytics";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAnalyticsEnabled() || initialized.current) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID as string, {
      send_page_view: false,
    });

    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!isAnalyticsEnabled() || !initialized.current) return;

    const url =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag("config", GA_MEASUREMENT_ID as string, {
      page_path: url,
    });
  }, [pathname, searchParams]);

  if (!isAnalyticsEnabled()) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      strategy="afterInteractive"
    />
  );
}
