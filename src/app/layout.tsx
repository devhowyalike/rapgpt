import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { APP_TITLE, APP_URL } from "@/lib/constants";
import { DEFAULT_DESCRIPTION, DEFAULT_IMAGE } from "@/lib/metadata";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

const defaultTitle = `${APP_TITLE} - AI Freestyle Battles + Music Generator`;

export const metadata: Metadata = {
  title: {
    default: defaultTitle,
    template: `%s | ${APP_TITLE}`,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(`https://${APP_URL}`),
  openGraph: {
    type: "website",
    siteName: APP_TITLE,
    title: defaultTitle,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    images: [
      { url: DEFAULT_IMAGE, width: 1200, height: 630, alt: defaultTitle },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
        <body
          className={`${inter.variable} ${bebasNeue.variable} antialiased min-h-dvh flex flex-col`}
        >
          <div className="flex-1 flex flex-col">{children}</div>
          <Toaster
            position="bottom-center"
            richColors
            toastOptions={{
              className: "text-white",
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
