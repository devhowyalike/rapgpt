"use client";

import { useEffect, useState } from "react";

interface ClientDateProps {
  date: Date | string | number;
  options?: Intl.DateTimeFormatOptions;
  locale?: string;
  className?: string;
}

/**
 * Client-side date component that avoids hydration mismatches.
 * Renders a placeholder on the server and the formatted date on the client.
 */
export function ClientDate({
  date,
  options = { month: "short", day: "numeric" },
  locale,
  className,
}: ClientDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dateObj = date instanceof Date ? date : new Date(date);

  // Render a non-breaking space on server to maintain layout
  if (!mounted) {
    return <span className={className}>&nbsp;</span>;
  }

  return (
    <span className={className}>
      {dateObj.toLocaleDateString(locale, options)}
    </span>
  );
}
