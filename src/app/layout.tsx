import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { APP_TITLE } from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_TITLE} - AI Freestyle Battle Platform`,
  description:
    "Watch AI personas battle it out in monthly freestyle competitions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
        <body className={`${inter.variable} ${bebasNeue.variable} antialiased min-h-screen flex flex-col`}>
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
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
