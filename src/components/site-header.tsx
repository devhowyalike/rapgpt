"use client";

import { Home, Archive } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 p-3 bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/archive"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
          >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Archive</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
