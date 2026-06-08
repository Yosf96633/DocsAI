"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { FileText, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 20);
  });

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#f7f4ef]/95 backdrop-blur-md border-b border-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-5 sm:px-8 md:px-12 py-4 sm:py-5">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 bg-[#2d5a3d] rounded-lg flex items-center justify-center">
            <FileText size={15} className="text-white" />
          </div>
          <span className="font-serif text-[1.35rem] text-[#0f0e0c]">
            DocsAI
          </span>
        </Link>

        {/* Desktop nav */}
        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/chat"
                className="px-5 py-2 rounded-full border border-black/20 text-sm font-medium text-[#0f0e0c] hover:bg-[#ede9e0] transition-colors no-underline"
              >
                Go to Chat
              </Link>
              <div className="w-9 h-9 rounded-full bg-[#2d5a3d] flex items-center justify-center text-white text-sm font-semibold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2 rounded-full border border-black/20 text-sm font-medium text-[#0f0e0c] hover:bg-[#ede9e0] transition-colors no-underline"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-full bg-[#2d5a3d] text-sm font-medium text-white hover:bg-[#4a8a5f] transition-colors no-underline"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 text-[#0f0e0c]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-[#f7f4ef]/98 border-t border-black/10 px-5 py-4 flex flex-col gap-3">
          {user ? (
            <Link
              href="/chat"
              className="flex items-center gap-3 px-5 py-2.5 no-underline"
              onClick={() => setMenuOpen(false)}
            >
              <div className="w-9 h-9 rounded-full bg-[#2d5a3d] flex items-center justify-center text-white text-sm font-semibold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-[#0f0e0c]">
                {user.username}
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="w-full text-center px-5 py-2.5 rounded-full border border-black/20 text-sm font-medium text-[#0f0e0c] hover:bg-[#ede9e0] transition-colors no-underline"
                onClick={() => setMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="w-full text-center px-5 py-2.5 rounded-full bg-[#2d5a3d] text-sm font-medium text-white hover:bg-[#4a8a5f] transition-colors no-underline"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </motion.nav>
  );
}
