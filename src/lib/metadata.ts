import type { Metadata } from "next";
import { APP_TITLE } from "./constants";

export const DEFAULT_IMAGE = "/marketing/rap-gpt-screenshot.webp";
export const DEFAULT_DESCRIPTION =
  "Create dream matchups and stream them live as MCs battle in real time. Turn battles into full tracks with AI-generated beats and vocals.";

type MetadataOptions = {
  title: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
};

/**
 * Creates consistent metadata for pages with Open Graph and Twitter cards.
 *
 * Works for both static and dynamic pages:
 *
 * Static: `export const metadata = createMetadata({ title: "Roster", ... })`
 *
 * Dynamic: `export async function generateMetadata() { return createMetadata({ ... }) }`
 */
export function createMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  noIndex = false,
  type = "website",
}: MetadataOptions): Metadata {
  const fullTitle = `${title} | ${APP_TITLE}`;

  return {
    title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type,
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}
