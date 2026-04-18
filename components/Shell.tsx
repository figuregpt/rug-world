"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

/* ── Icon component (exact SVGs from the design spec) ── */
function Icon({ name, size = 18, className = "", style = {} }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className, style };
  switch (name) {
    case "home":       return <svg {...p}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
    case "rocket":     return <svg {...p}><path d="M14 4c4 0 6 2 6 6l-8 8-3-3 8-8c-4 0-6-2-6-3z"/><path d="M7 14l-3 3 3 3 3-3"/><circle cx="15" cy="9" r="1.2"/></svg>;
    case "compass":    return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/></svg>;
    case "coins":      return <svg {...p}><circle cx="9" cy="9" r="6"/><path d="M14.5 6.5A6 6 0 1 1 17 17"/></svg>;
    case "palette":    return <svg {...p}><path d="M12 3a9 9 0 1 0 0 18 3 3 0 0 0 0-6h-1a3 3 0 0 1 0-6h3a6 6 0 0 0-2-6z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/></svg>;
    case "plus":       return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case "search":     return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case "sun":        return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case "moon":       return <svg {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
    case "bell":       return <svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case "wallet":     return <svg {...p}><path d="M3 7h16v12H3z"/><path d="M16 12h3"/><path d="M3 7V5a2 2 0 0 1 2-2h12v4"/></svg>;
    case "menu":       return <svg {...p}><path d="M4 7h16M4 12h16M4 17h10"/></svg>;
    case "chevron-right": return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case "help":       return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01"/></svg>;
    case "arrow-right": return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    default: return null;
  }
}

const navSections = [
  {
    label: "Marketplace",
    items: [
      { label: "Home", href: "/", icon: "home" },
      { label: "Launchpad", href: "/launchpad", icon: "rocket", badge: "3" },
      { label: "Stake", href: "/stake", icon: "coins" },
    ],
  },
  {
    label: "Create",
    items: [
      { label: "Studio", href: "/studio", icon: "palette" },
    ],
  },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.classList.add("sidebar-open");
    else document.body.classList.remove("sidebar-open");
    return () => { document.body.classList.remove("sidebar-open"); };
  }, [mobileOpen]);

  return (
    <div className={`app ${collapsed ? "collapsed" : ""}`}>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div className="sidebar-scrim" style={{ display: "block" }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
          <div className="brand-mark">R</div>
          {!collapsed && <span>RUG<span className="dot">.</span>WORLD</span>}
        </Link>

        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && <div className="nav-section-label">{section.label}</div>}
            {section.items.map((item) => {
              const isActive = item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon name={item.icon} size={18} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge && <span className="badge">{item.badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}

        <div className="sidebar-footer">
          <button className="nav-item hide-mobile" onClick={() => setCollapsed(!collapsed)}>
            <Icon name={collapsed ? "chevron-right" : "menu"} size={18} />
            {!collapsed && <span>Collapse</span>}
          </button>
          <button className="nav-item">
            <Icon name="help" size={18} />
            {!collapsed && <span>Docs</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open menu">
            <Icon name="menu" size={16} />
          </button>

          <div className="search">
            <Icon name="search" size={15} style={{ color: "var(--text-3)" }} />
            <input placeholder="Search collections, wallets, txs..." readOnly />
            <span className="kbd hide-mobile">&#x2318;K</span>
          </div>

          <div className="spacer" />

          <button
            className="chip-btn ghost hide-mobile"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
          </button>

          <button className="icon-btn hide-mobile" title="Notifications">
            <Icon name="bell" size={16} />
          </button>

          <div className="rug-wallet-btn">
            <WalletMultiButton />
          </div>
        </header>

        {/* Scrollable content */}
        <div className="scroll">
          <div className="screen">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
