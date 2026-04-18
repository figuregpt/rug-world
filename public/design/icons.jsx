// icons.jsx — inline SVG icon set used across the app

const Icon = ({ name, size = 18, className = "", style = {} }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", className, style };
  switch (name) {
    case "home":      return <svg {...common}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
    case "compass":   return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/></svg>;
    case "coins":     return <svg {...common}><circle cx="9" cy="9" r="6"/><path d="M14.5 6.5A6 6 0 1 1 17 17"/></svg>;
    case "palette":   return <svg {...common}><path d="M12 3a9 9 0 1 0 0 18 3 3 0 0 0 0-6h-1a3 3 0 0 1 0-6h3a6 6 0 0 0-2-6z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/></svg>;
    case "rocket":    return <svg {...common}><path d="M14 4c4 0 6 2 6 6l-8 8-3-3 8-8c-4 0-6-2-6-3z"/><path d="M7 14l-3 3 3 3 3-3"/><circle cx="15" cy="9" r="1.2"/></svg>;
    case "sparkle":   return <svg {...common}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>;
    case "search":    return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case "plus":      return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case "filter":    return <svg {...common}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
    case "grid":      return <svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    case "list":      return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case "sun":       return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case "moon":      return <svg {...common}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
    case "bell":      return <svg {...common}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case "wallet":    return <svg {...common}><path d="M3 7h16v12H3z"/><path d="M16 12h3"/><path d="M3 7V5a2 2 0 0 1 2-2h12v4"/></svg>;
    case "check":     return <svg {...common}><path d="M4 12l5 5 11-12"/></svg>;
    case "arrow-right":return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "arrow-up-right":return <svg {...common}><path d="M7 17L17 7M9 7h8v8"/></svg>;
    case "chevron-down":return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case "chevron-right":return <svg {...common}><path d="M9 6l6 6-6 6"/></svg>;
    case "x":         return <svg {...common}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case "trending":  return <svg {...common}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>;
    case "fire":      return <svg {...common}><path d="M12 3c2 4 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-9z"/></svg>;
    case "star":      return <svg {...common}><path d="M12 3l3 6 6 1-5 4 1 7-5-3-5 3 1-7-5-4 6-1z"/></svg>;
    case "clock":     return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "shield":    return <svg {...common}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/></svg>;
    case "hand":      return <svg {...common}><path d="M7 11V5a2 2 0 1 1 4 0v5M11 10V4a2 2 0 1 1 4 0v6M15 10V6a2 2 0 1 1 4 0v9a6 6 0 0 1-12 0v-1l-2-3a1.5 1.5 0 0 1 2.5-2L8 11"/></svg>;
    case "lock":      return <svg {...common}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></svg>;
    case "unlock":    return <svg {...common}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0"/></svg>;
    case "layers":    return <svg {...common}><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/></svg>;
    case "image":     return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 16l-5-5-8 8"/></svg>;
    case "upload":    return <svg {...common}><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>;
    case "download":  return <svg {...common}><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>;
    case "dollar":    return <svg {...common}><path d="M12 3v18M17 7H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7"/></svg>;
    case "copy":      return <svg {...common}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>;
    case "external":  return <svg {...common}><path d="M14 4h6v6M20 4L10 14M18 14v6H4V6h6"/></svg>;
    case "twitter":   return <svg {...common}><path d="M4 4l7.5 10L4 20h3l6-6 4 6h4l-7.5-10L20 4h-3l-5 5-3.5-5z" fill="currentColor" stroke="none"/></svg>;
    case "discord":   return <svg {...common}><path d="M8 7a12 12 0 0 1 8 0M7 10c-1 2-1 5 0 9 1 1 3 1 4 0M17 10c1 2 1 5 0 9-1 1-3 1-4 0"/><circle cx="9.5" cy="13.5" r="1"/><circle cx="14.5" cy="13.5" r="1"/></svg>;
    case "menu":      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h10"/></svg>;
    case "chart":     return <svg {...common}><path d="M4 20h16M7 16v-5M12 16V8M17 16v-9"/></svg>;
    case "settings":  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case "help":      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01"/></svg>;
    case "logout":    return <svg {...common}><path d="M10 5H5v14h5M15 12H9M14 8l4 4-4 4"/></svg>;
    case "verified":  return <svg {...common}><path d="M12 2l2 2 3-1 1 3 3 1-1 3 2 2-2 2 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-2-2 2-2-1-3 3-1 1-3 3 1z"/><path d="M8 12l3 3 5-6" strokeWidth={1.8}/></svg>;
    case "sliders":   return <svg {...common}><path d="M4 6h10M4 12h4M4 18h12"/><circle cx="17" cy="6" r="2"/><circle cx="11" cy="12" r="2"/><circle cx="19" cy="18" r="2"/></svg>;
    case "eye":       return <svg {...common}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "dot-3":     return <svg {...common}><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>;
    case "solana":    return <svg {...common} viewBox="0 0 24 24"><path d="M5 7l3-3h11l-3 3H5zM5 13l3-3h11l-3 3H5zM19 17l-3 3H5l3-3h11z" fill="currentColor" stroke="none"/></svg>;
    default: return null;
  }
};

window.Icon = Icon;
