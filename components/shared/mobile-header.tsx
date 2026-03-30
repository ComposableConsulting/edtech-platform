"use client";

import { useState } from "react";

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-800">
        Coastal Connections Academy
      </span>
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle menu"
        className="p-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
      >
        {menuOpen ? (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>
    </header>
  );
}
