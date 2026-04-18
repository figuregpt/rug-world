// shell.jsx — Sidebar, Topbar, Tweaks panel, RugTile, Pill, etc.

const { Icon } = window;

function RugTile({ v = 1, size, glyph, className = "" }) {
  return (
    <div className={`rug-tile v${v} ${className}`} style={size ? { width: size, height: size, aspectRatio: "auto" } : {}}>
      {glyph && <span className="glyph">{glyph}</span>}
    </div>
  );
}

function Pill({ kind = "upcoming", children }) {
  return <span className={`pill ${kind}`}>{children}</span>;
}

function Avatar({ seed = "x", size = 22 }) {
  const hue = (seed.charCodeAt(0) * 37) % 360;
  const bg = `oklch(62% 0.10 ${hue})`;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg,
      display: "grid", placeItems: "center",
      color: "#fff", fontSize: size * 0.42, fontWeight: 700, fontFamily: "Inter",
      flexShrink: 0
    }}>{seed[0]?.toUpperCase()}</div>
  );
}

function Sidebar({ route, setRoute, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const nav = [
    { key: "home",      label: "Home",       icon: "home" },
    { key: "launchpad", label: "Launchpad",  icon: "rocket",   badge: "3" },
    { key: "explore",   label: "Explore",    icon: "compass" },
    { key: "stake",     label: "Stake",      icon: "coins" },
  ];
  const tools = [
    { key: "studio",    label: "Studio",     icon: "palette" },
    { key: "create",    label: "Create",     icon: "plus" },
  ];
  const go = (k) => { setRoute(k); onCloseMobile && onCloseMobile(); };
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">R</div>
        {!collapsed && <span>RUG<span className="dot">.</span>WORLD</span>}
      </div>

      {!collapsed && <div className="nav-section-label">Marketplace</div>}
      {nav.map(n => (
        <button key={n.key} className={`nav-item ${route === n.key ? "active" : ""}`} onClick={() => go(n.key)}>
          <Icon name={n.icon} size={18} />
          {!collapsed && <span>{n.label}</span>}
          {!collapsed && n.badge && <span className="badge">{n.badge}</span>}
        </button>
      ))}

      {!collapsed && <div className="nav-section-label">Create</div>}
      {tools.map(n => (
        <button key={n.key} className={`nav-item ${route === n.key ? "active" : ""}`} onClick={() => go(n.key)}>
          <Icon name={n.icon} size={18} />
          {!collapsed && <span>{n.label}</span>}
        </button>
      ))}

      <div className="sidebar-footer">
        <button className="nav-item hide-mobile" onClick={onToggleCollapse}>
          <Icon name={collapsed ? "chevron-right" : "menu"} size={18} />
          {!collapsed && <span>Collapse</span>}
        </button>
        <button className="nav-item">
          <Icon name="help" size={18} />
          {!collapsed && <span>Docs</span>}
        </button>
      </div>
    </aside>
  );
}

function Topbar({ theme, setTheme, onOpenCmd, onOpenMenu }) {
  return (
    <header className="topbar">
      <button className="mobile-menu-btn" onClick={onOpenMenu} aria-label="Open menu">
        <Icon name="menu" size={16} />
      </button>
      <div className="search" onClick={onOpenCmd}>
        <Icon name="search" size={15} style={{ color: "var(--text-3)" }} />
        <input placeholder="Search collections, wallets, txs..." onClick={e => e.preventDefault()} readOnly />
        <span className="kbd">⌘K</span>
      </div>
      <div className="spacer" />
      <button className="chip-btn ghost hide-mobile" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
        <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
      </button>
      <button className="icon-btn hide-mobile" title="Notifications">
        <Icon name="bell" size={16} />
      </button>
      <button className="btn-primary">
        <Icon name="wallet" size={15} />
        <span>Connect Wallet</span>
      </button>
    </header>
  );
}

function TweaksPanel({ open, onClose, tweaks, setTweaks }) {
  if (!open) return null;
  const accents = [
    { name: "Terracotta", dark: "#C96265", light: "#A64C4F" },
    { name: "Indigo",     dark: "#8186C9", light: "#3B3E74" },
    { name: "Sage",       dark: "#9EB57A", light: "#6F8547" },
    { name: "Gold",       dark: "#E3B04A", light: "#B98A1C" },
  ];
  return (
    <div className="tweaks-panel">
      <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <div className="h4">Tweaks</div>
        <button className="icon-btn" onClick={onClose} style={{ width: 28, height: 28 }}><Icon name="x" size={14} /></button>
      </div>
      <div className="tweaks-row">
        <span>Theme</span>
        <div className="hstack" style={{ gap: 4 }}>
          {["dark", "light"].map(t => (
            <button key={t} className={`chip-btn ${tweaks.theme === t ? "" : "ghost"}`} style={{ height: 28, padding: "0 10px", fontSize: 12 }} onClick={() => setTweaks({ ...tweaks, theme: t })}>{t}</button>
          ))}
        </div>
      </div>
      <div className="tweaks-row">
        <span>Accent</span>
        <div className="swatch-row">
          {accents.map(a => (
            <button key={a.name}
              className={`swatch ${tweaks.accent === a.name ? "active" : ""}`}
              style={{ background: tweaks.theme === "dark" ? a.dark : a.light }}
              onClick={() => setTweaks({ ...tweaks, accent: a.name })}
              title={a.name}
            />
          ))}
        </div>
      </div>
      <div className="tweaks-row">
        <span>Card style</span>
        <div className="hstack" style={{ gap: 4 }}>
          {["grid", "list"].map(t => (
            <button key={t} className={`chip-btn ${tweaks.layout === t ? "" : "ghost"}`} style={{ height: 28, padding: "0 10px", fontSize: 12 }} onClick={() => setTweaks({ ...tweaks, layout: t })}>{t}</button>
          ))}
        </div>
      </div>
      <div className="tweaks-row">
        <span>Density</span>
        <div className="hstack" style={{ gap: 4 }}>
          {["cozy", "compact"].map(t => (
            <button key={t} className={`chip-btn ${tweaks.density === t ? "" : "ghost"}`} style={{ height: 28, padding: "0 10px", fontSize: 12 }} onClick={() => setTweaks({ ...tweaks, density: t })}>{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function applyAccent(theme, accentName) {
  const map = {
    "Terracotta": { dark: ["#C96265", "rgba(201, 98, 101, 0.14)", "rgba(201, 98, 101, 0.30)"], light: ["#A64C4F", "rgba(166, 76, 79, 0.10)", "rgba(166, 76, 79, 0.30)"] },
    "Indigo":     { dark: ["#8186C9", "rgba(129, 134, 201, 0.14)", "rgba(129, 134, 201, 0.30)"], light: ["#3B3E74", "rgba(59, 62, 116, 0.10)", "rgba(59, 62, 116, 0.30)"] },
    "Sage":       { dark: ["#9EB57A", "rgba(158, 181, 122, 0.14)", "rgba(158, 181, 122, 0.30)"], light: ["#6F8547", "rgba(111, 133, 71, 0.10)", "rgba(111, 133, 71, 0.30)"] },
    "Gold":       { dark: ["#E3B04A", "rgba(227, 176, 74, 0.14)", "rgba(227, 176, 74, 0.30)"],  light: ["#B98A1C", "rgba(185, 138, 28, 0.10)", "rgba(185, 138, 28, 0.30)"] },
  };
  const v = map[accentName]?.[theme];
  if (!v) return;
  document.documentElement.style.setProperty("--accent", v[0]);
  document.documentElement.style.setProperty("--accent-soft", v[1]);
  document.documentElement.style.setProperty("--accent-line", v[2]);
}

Object.assign(window, { RugTile, Pill, Avatar, Sidebar, Topbar, TweaksPanel, applyAccent });
