"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with the wallet button
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const links = [
  { label: "Launchpad", href: "/launchpad" },
  { label: "Stake", href: "/stake" },
  { label: "Studio", href: "/studio" },
];

const socials = [
  { label: "Twitter", href: "https://x.com/", icon: "𝕏" },
  { label: "Discord", href: "https://discord.gg/", icon: "D" },
];

export default function RugNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On non-home pages, always show dark bg so text is readable on light page bg
  const showDarkBg = !isHome || scrolled;

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-[100] transition-colors duration-300"
        style={{
          background: showDarkBg ? "rgba(47, 43, 40, 0.95)" : "transparent",
          backdropFilter: showDarkBg ? "blur(12px)" : "none",
        }}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1">
              <span className="text-[22px] font-black text-[#EDE3BC] tracking-tight">
                CAMPFIRE
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`px-4 py-2 text-[14px] font-medium transition-colors ${
                      isActive
                        ? "text-[#A64C4F]"
                        : "text-[#EDE3BC]/50 hover:text-[#EDE3BC]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center text-[13px] text-[#EDE3BC]/30 hover:text-[#EDE3BC] transition-colors"
                >
                  {s.icon}
                </a>
              ))}
              <div className="ml-2 rug-wallet-btn">
                <WalletMultiButton />
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <div className="flex flex-col gap-[5px]">
                <span className={`block w-[18px] h-[1.5px] bg-[#EDE3BC] rounded-full transition-transform ${mobileOpen ? "rotate-45 translate-y-[3.5px]" : ""}`} />
                <span className={`block w-[18px] h-[1.5px] bg-[#EDE3BC] rounded-full transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block w-[18px] h-[1.5px] bg-[#EDE3BC] rounded-full transition-transform ${mobileOpen ? "-rotate-45 -translate-y-[3.5px]" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[99] bg-[#2F2B28] pt-[72px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="container-main py-8 flex flex-col gap-2">
              {links.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block text-[28px] font-bold py-2 ${
                        isActive ? "text-[#A64C4F]" : "text-[#EDE3BC]/50"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
              <div className="mt-8 rug-wallet-btn">
                <WalletMultiButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
