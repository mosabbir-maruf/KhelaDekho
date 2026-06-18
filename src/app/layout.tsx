import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Suspense } from "react";
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://kheladekho.pages.dev";

export const metadata: Metadata = {
  title: {
    default: "KhelaDekho — Live Sports Streaming Aggregator",
    template: "%s | KhelaDekho",
  },
  description: "Access all live matches and sports TV channels in high definition, aggregated from public sources and optimized for all devices.",
  keywords: [
    "kheladekho", "live sports", "streaming", "football", "cricket",
    "live channels", "sports streaming", "match schedule",
  ],
  authors: [{ name: "Mosabbir Maruf", url: "https://github.com/mosabbir-maruf" }],
  creator: "Mosabbir Maruf",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "KhelaDekho",
    title: "KhelaDekho — Live Sports Streaming Aggregator",
    description: "Access all live matches and sports TV channels in high definition, aggregated from public sources and optimized for all devices.",
    images: [
      {
        url: "https://kheladekho.pages.dev/meta-graph.webp",
        width: 1200,
        height: 630,
        alt: "KhelaDekho — Live Sports Streaming Aggregator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KhelaDekho — Live Sports Streaming Aggregator",
    description: "Access all live matches and sports TV channels in high definition, aggregated from public sources and optimized for all devices.",
    images: ["/meta-graph.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='20' height='15' x='2' y='7' rx='2' ry='2'/><polyline points='17 2 12 7 7 2'/></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='20' height='15' x='2' y='7' rx='2' ry='2'/><polyline points='17 2 12 7 7 2'/></svg>",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="google-site-verification" content="Cak52LH2Ttv-hORQBBU19PZWthnfPruqKLjAd2M3YuQ" />
        {GA_MEASUREMENT_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{send_page_view:false});`,
              }}
            />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "KhelaDekho",
              applicationCategory: "Entertainment",
              operatingSystem: "Web",
              description: "Access all live matches and sports TV channels in high definition, aggregated from public sources and optimized for all devices.",
              url: "https://kheladekho.pages.dev",
              author: {
                "@type": "Person",
                name: "Mosabbir Maruf",
                url: "https://github.com/mosabbir-maruf",
              },
              license: "https://opensource.org/licenses/MIT",
              programmingLanguage: ["TypeScript", "React"],
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        <Script
          id="kheladekho-api-url"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__KHELADEKHO_API_URL = ${JSON.stringify(process.env.KHELADEKHO_API_URL || "")};`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-page text-fg min-h-dvh flex flex-col selection:bg-fg/10`}
      >
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <ThemeProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
