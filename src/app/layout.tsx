import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"),
  title: {
    default: "FounderHQ | Validate Startup Ideas Before You Build",
    template: "%s | FounderHQ",
  },
  description:
    "FounderHQ pulls real posts from Reddit, Hacker News, GitHub, and Stack Overflow to score your startup idea against your actual goal: side project, funded startup, or anything in between. Know if your idea has demand before you write a line of code.",
  keywords: [
    "startup idea validation",
    "validate startup idea",
    "startup research tool",
    "idea validation",
    "market demand research",
    "startup viability score",
    "founder tools",
    "startup ideas",
    "reddit startup signals",
    "startup market analysis",
    "idea validation before building",
    "startup idea generator",
  ],
  authors: [{ name: "FounderHQ" }],
  creator: "FounderHQ",
  publisher: "FounderHQ",
  category: "technology",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: "/brand/app-icons/app-icon-rounded.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "FounderHQ | Validate Startup Ideas Before You Build",
    description:
      "Real posts from Reddit, HN, GitHub, and Stack Overflow, scored for your startup goal. Know before you build.",
    siteName: "FounderHQ",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FounderHQ | Validate Startup Ideas Before You Build",
    description:
      "Real posts from Reddit, HN, GitHub, and Stack Overflow, scored for your startup goal. Know before you build.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
