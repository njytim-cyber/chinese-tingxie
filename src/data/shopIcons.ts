/**
 * Shop Item SVG Icons
 * Reusable SVG icon definitions for shop items
 */

export const shopIcons: Record<string, (itemId: string) => string> = {
    // Stroke effects
    '✨': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l2 7h7l-6 5 2 7-5-4-5 4 2-7-6-5h7z" fill="url(#sparkle-${id})"/><defs><linearGradient id="sparkle-${id}"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs></svg>`,
    '🌈': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M3 17c0-7 6-13 9-13s9 6 9 13" stroke="url(#rainbow-${id})" stroke-width="3" stroke-linecap="round"/><defs><linearGradient id="rainbow-${id}"><stop offset="0%" stop-color="#ef4444"/><stop offset="25%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#10b981"/><stop offset="75%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs></svg>`,
    '🖌️': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#78350f" stroke-width="1.5"><path d="M3 20l5-5m0 0l7-7 4 4-7 7m-4-4L4 19l1-4zm10-10l4-4m0 0l1 1-1 1-1-1z"/><path d="M19 4l-1 1 1 1 1-1-1-1z" fill="#78350f"/></svg>`,
    '⚡': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="url(#lightning-${id})"/><defs><linearGradient id="lightning-${id}"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs></svg>`,

    // Ink colors
    '🟡': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#gold-${id})" stroke="#ca8a04" stroke-width="1.5"/><defs><linearGradient id="gold-${id}"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs></svg>`,
    '🟢': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#jade-${id})" stroke="#059669" stroke-width="1.5"/><defs><linearGradient id="jade-${id}"><stop offset="0%" stop-color="#d1fae5"/><stop offset="100%" stop-color="#10b981"/></linearGradient></defs></svg>`,
    '🔴': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#crimson-${id})" stroke="#991b1b" stroke-width="1.5"/><defs><linearGradient id="crimson-${id}"><stop offset="0%" stop-color="#fecaca"/><stop offset="100%" stop-color="#dc2626"/></linearGradient></defs></svg>`,
    '🟣': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#purple-${id})" stroke="#6b21a8" stroke-width="1.5"/><defs><linearGradient id="purple-${id}"><stop offset="0%" stop-color="#e9d5ff"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs></svg>`,

    // Themes
    '🎨': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#57534e" stroke-width="1.5"><circle cx="12" cy="12" r="10" fill="none"/><circle cx="8" cy="10" r="1.5" fill="#ef4444"/><circle cx="12" cy="8" r="1.5" fill="#10b981"/><circle cx="16" cy="10" r="1.5" fill="#3b82f6"/><path d="M12 12c-2 3-4 4-7 2" stroke-linecap="round"/></svg>`,
    '🎋': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="1.5"><path d="M12 2v20M8 4c2 1 4 1 8 0M7 8c2.5 1 5.5 1 10 0M6 12c3 1 6 1 12 0" stroke-linecap="round"/></svg>`,
    '🪷': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2c-3 4-2 8 0 10 2-2 3-6 0-10z" fill="#fda4af"/><path d="M7 8c1 3 3 5 5 6-2-2-2-5-5-6z" fill="#fb7185"/><path d="M17 8c-1 3-3 5-5 6 2-2 2-5 5-6z" fill="#fb7185"/><circle cx="12" cy="14" r="2" fill="#fbbf24"/></svg>`,

    // Power-ups
    '💡': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M9 18h6v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2zm3-16a7 7 0 015 11.9V16H7v-2.1A7 7 0 0112 2z" fill="url(#bulb-${id})" stroke="#78350f" stroke-width="1"/><defs><linearGradient id="bulb-${id}"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs></svg>`,
    '📦': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M21 8v13H3V8l9-6 9 6z" fill="#d6d3d1" stroke="#57534e" stroke-width="1.5"/><path d="M3 8l9 6 9-6M12 22V14" stroke="#57534e" stroke-width="1.5"/></svg>`,
    '⏫': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 4l8 8h-5v8h-6v-8H4l8-8z" fill="url(#up-${id})"/><defs><linearGradient id="up-${id}"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs></svg>`,
    '🛡️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5 3 9 8 10 5-1 8-5 8-10V6l-8-4z" fill="url(#shield-${id})" stroke="#0369a1" stroke-width="1.5"/><defs><linearGradient id="shield-${id}"><stop offset="0%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs></svg>`,
    '✅': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#10b981"/><path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

    // Tools & Content
    '📝': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#78350f" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="M9 12h6M9 16h6" stroke-linecap="round"/></svg>`,
    '📊': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5"><path d="M9 3v18M15 8v13M3 17v4M21 12v9" stroke-linecap="round"/></svg>`,
    '🌓': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#1e293b"/><path d="M12 2a10 10 0 000 20V2z" fill="#f1f5f9"/></svg>`,
    '🔀': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.5"><path d="M3 7h2a2 2 0 012 2v6a2 2 0 002 2h10M17 3l4 4-4 4M21 17h-2a2 2 0 01-2-2V9a2 2 0 00-2-2H5M7 21l-4-4 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    '🔄': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#0e7490" stroke-width="1.5"><path d="M4 4v5h5M20 20v-5h-5M2 12a10 10 0 0118-6M22 12a10 10 0 01-18 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    '📚': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#78350f" stroke-width="1.5"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill="#e7e5e4" stroke="#78350f" stroke-width="1.5"/><path d="M8 6h8M8 10h6" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    '🎁': (id) => `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="11" width="16" height="11" fill="#fca5a5" stroke="#991b1b" stroke-width="1.5"/><rect x="3" y="7" width="18" height="4" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/><path d="M12 7V22M8 7c0-1 1-3 2-3s2 1 2 3M16 7c0-1-1-3-2-3s-2 1-2 3" stroke="#991b1b" stroke-width="1.5"/></svg>`,

    // Additional stroke effects
    '🔥': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2c-1 3-2 5 0 8-2-1-4 0-4 3 0 4 3 7 7 7s7-3 7-7c0-3-2-4-4-3 2-3 1-5 0-8-1 2-2 3-3 4-1-1-2-2-3-4z" fill="url(#fire-${id})"/><defs><linearGradient id="fire-${id}"><stop offset="0%" stop-color="#fbbf24"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#ef4444"/></linearGradient></defs></svg>`,
    '❄️': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.5"><path d="M12 2v20M5 5l14 14M19 5L5 19M12 7L9 4m6 3l3-3M12 17l-3 3m6-3l3 3M7 12l-3-3m3 3l-3 3M17 12l3-3m-3 3l3 3" stroke-linecap="round"/></svg>`,
    '💨': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M4 8h12a2 2 0 100-4M4 12h14a3 3 0 110 6H9M4 16h8" stroke-linecap="round"/></svg>`,
    '🌌': (id) => `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" fill="url(#galaxy-${id})"/><circle cx="6" cy="6" r="1" fill="white"/><circle cx="18" cy="8" r="1.5" fill="white"/><circle cx="10" cy="14" r="1" fill="white"/><circle cx="16" cy="16" r="1.5" fill="white"/><circle cx="8" cy="18" r="1" fill="white"/><defs><linearGradient id="galaxy-${id}" x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stop-color="#1e293b"/><stop offset="50%" stop-color="#7e22ce"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs></svg>`,

    // Additional ink colors
    '⚪': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#silver-${id})" stroke="#71717a" stroke-width="1.5"/><defs><linearGradient id="silver-${id}"><stop offset="0%" stop-color="#f4f4f5"/><stop offset="100%" stop-color="#d4d4d8"/></linearGradient></defs></svg>`,
    '🟤': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#bronze-${id})" stroke="#78350f" stroke-width="1.5"/><defs><linearGradient id="bronze-${id}"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs></svg>`,
    '🔵': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#blue-${id})" stroke="#1e40af" stroke-width="1.5"/><defs><linearGradient id="blue-${id}"><stop offset="0%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs></svg>`,
    '🟠': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="url(#orange-${id})" stroke="#c2410c" stroke-width="1.5"/><defs><linearGradient id="orange-${id}"><stop offset="0%" stop-color="#fed7aa"/><stop offset="100%" stop-color="#f97316"/></linearGradient></defs></svg>`,
    '🌹': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 4c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z" fill="#f43f5e"/><path d="M12 12c-1.5 0-3 1-3 3s1.5 3 3 3 3-1 3-3-1.5-3-3-3z" fill="#fb7185"/><path d="M12 18v4" stroke="#15803d" stroke-width="2"/><path d="M10 20l-2 2M14 20l2 2" stroke="#15803d" stroke-width="1.5"/></svg>`,
    '🌸': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 8c-2 0-3 1-3 2s1 2 3 2 3-1 3-2-1-2-3-2z" fill="#fda4af"/><path d="M12 4l-2 4 2 2 2-2-2-4z" fill="#fda4af"/><path d="M8 8L6 12l2 2 2-2-2-4z" fill="#fda4af"/><path d="M16 8l2 4-2 2-2-2 2-4z" fill="#fda4af"/><path d="M12 12l-2 2 2 4 2-4-2-2z" fill="#fda4af"/><circle cx="12" cy="12" r="2" fill="#fbbf24"/></svg>`,

    // Theme icons
    '⛰️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M2 20l6-10 4 6 4-8 6 12z" fill="url(#mountain-${id})"/><defs><linearGradient id="mountain-${id}" x1="12" y1="8" x2="12" y2="20"><stop offset="0%" stop-color="#64748b"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs></svg>`,
    '🌊': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M2 14c2-2 4 0 6 0s4-2 6 0 4 2 6 0M2 18c2-2 4 0 6 0s4-2 6 0 4 2 6 0" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round"/></svg>`,
    '☁️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M18 10a6 6 0 00-11.6-2A5 5 0 107 19h11a5 5 0 000-10z" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/></svg>`,
    '🌙': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" fill="#fbbf24"/></svg>`,
    '🌺': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 5l-2 4 2 3 2-3-2-4z" fill="#f472b6"/><path d="M7 9l-2 3 2 3 3-1-3-5z" fill="#f472b6"/><path d="M17 9l2 3-2 3-3-1 3-5z" fill="#f472b6"/><path d="M9 14l-2 4 2 2 3-2-3-4z" fill="#f472b6"/><path d="M15 14l2 4-2 2-3-2 3-4z" fill="#f472b6"/><circle cx="12" cy="12" r="2" fill="#fbbf24"/></svg>`,
    '🌼': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill="#fbbf24"/><circle cx="12" cy="7" r="2" fill="#fef08a"/><circle cx="16.5" cy="9" r="2" fill="#fef08a"/><circle cx="16.5" cy="15" r="2" fill="#fef08a"/><circle cx="12" cy="17" r="2" fill="#fef08a"/><circle cx="7.5" cy="15" r="2" fill="#fef08a"/><circle cx="7.5" cy="9" r="2" fill="#fef08a"/></svg>`,
    '👑': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M3 18l3-10 6 6 6-6 3 10H3z" fill="url(#crown-${id})"/><circle cx="6" cy="8" r="2" fill="#fbbf24"/><circle cx="12" cy="2" r="2" fill="#fbbf24"/><circle cx="18" cy="8" r="2" fill="#fbbf24"/><defs><linearGradient id="crown-${id}"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs></svg>`,

    // Writing styles
    '✍️': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#78350f" stroke-width="1.5"><path d="M17 3l4 4-10 10H7v-4L17 3z" stroke-linejoin="round"/><path d="M13 7l4 4" stroke-linecap="round"/></svg>`,
    '🖊️': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#1e40af" stroke-width="1.5"><path d="M18 2l4 4-12 12H6v-4L18 2z" stroke-linejoin="round"/><path d="M14 6l4 4" stroke-linecap="round"/></svg>`,
    '🖋️': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#6b21a8" stroke-width="1.5"><path d="M12 2l2 18H10l2-18z" stroke-linejoin="round"/><path d="M8 20h8" stroke-linecap="round"/></svg>`,

    // Paper textures
    '📄': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/><path d="M13 2v7h7" stroke="#78350f" stroke-width="1.5"/></svg>`,
    '📜': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/><path d="M8 6h8M8 10h8M8 14h5" stroke="#78350f" stroke-width="1" opacity="0.5"/></svg>`,
    '🎀': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 12l-5-5v10l5-5zm0 0l5-5v10l-5-5z" fill="#f9a8d4" stroke="#ec4899" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="#ec4899"/></svg>`,
    '📖': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill="#e7e5e4" stroke="#78350f" stroke-width="1.5"/><path d="M8 6h8M8 10h6M8 14h4" stroke="#78350f" stroke-width="1" opacity="0.3"/></svg>`,

    // Border decorations
    '🖼️': (id) => `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" fill="none" stroke="#78350f" stroke-width="2"/><rect x="6" y="6" width="12" height="12" fill="#fef3c7" stroke="#78350f" stroke-width="1"/></svg>`,
    '🌿': (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="1.5"><path d="M12 2c-2 3-2 6 0 8M12 10c-3-1-5 0-5 3s2 4 5 4M12 17c3 0 5-1 5-4s-2-4-5-3M12 10v7" stroke-linecap="round"/></svg>`,
    '⬜': (id) => `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" fill="none" stroke="#64748b" stroke-width="1.5"/><rect x="13" y="4" width="7" height="7" fill="none" stroke="#64748b" stroke-width="1.5"/><rect x="4" y="13" width="7" height="7" fill="none" stroke="#64748b" stroke-width="1.5"/><rect x="13" y="13" width="7" height="7" fill="none" stroke="#64748b" stroke-width="1.5"/></svg>`,
    '🐉': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M4 12c0-3 2-6 5-6s5 3 8 3c2 0 3-1 3-3M20 6c-1 2-2 3-3 3-3 0-5-3-8-3-2 0-4 1-5 3M4 12c1 3 3 5 5 5s4-1 6-1c3 0 5 2 5 4" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/></svg>`,
    '🦅': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l-8 8c0 5 3 8 8 10 5-2 8-5 8-10l-8-8z" fill="#f97316"/><path d="M12 3v10M6 8l6 3 6-3" stroke="white" stroke-width="1.5"/></svg>`,

    // Animation effects
    '⬆️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 4l-6 6h4v10h4V10h4l-6-6z" fill="#3b82f6"/></svg>`,
    '➡️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M20 12l-6-6v4H4v4h10v4l6-6z" fill="#10b981"/></svg>`,
    '🔍': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#6b7280" stroke-width="2"/><path d="M16 16l5 5" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,

    // Powerup icons
    '⏱️': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="9" stroke="#6b7280" stroke-width="2"/><path d="M12 13V7M12 13l4 4M9 2h6" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    '⏭️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M5 5l10 7-10 7V5zm12 0v14" fill="#6b7280"/></svg>`,
    '↩️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M9 9l-4 4 4 4M5 13h11a4 4 0 100-8h-1" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    '🎯': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#dc2626" stroke-width="2"/><circle cx="12" cy="12" r="6" stroke="#dc2626" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#dc2626"/></svg>`,
    '🔤': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h10" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    '🐌': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="14" cy="10" r="6" fill="#d6d3d1"/><path d="M8 10c-2 0-4 2-4 4s2 4 4 4h6" stroke="#78350f" stroke-width="2" stroke-linecap="round"/><path d="M14 7l1-2M17 8l2-1" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    '📈': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M3 17l6-6 4 4 8-8M21 7v6h-6" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    '💰': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5 3 9 8 10 5-1 8-5 8-10V6l-8-4z" fill="url(#money-${id})" stroke="#78350f" stroke-width="1.5"/><path d="M12 8v8M9 10h6M9 16h6" stroke="#78350f" stroke-width="2"/><defs><linearGradient id="money-${id}"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs></svg>`,
    '💎': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l-8 6 8 14 8-14-8-6z" fill="url(#diamond-${id})" stroke="#6366f1" stroke-width="1.5"/><path d="M4 8h16M12 2v20M8 2l4 6M16 2l-4 6" stroke="#6366f1" stroke-width="1"/><defs><linearGradient id="diamond-${id}"><stop offset="0%" stop-color="#ddd6fe"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs></svg>`,
    '🍀': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3" fill="#22c55e"/><circle cx="15" cy="9" r="3" fill="#22c55e"/><circle cx="9" cy="15" r="3" fill="#22c55e"/><circle cx="15" cy="15" r="3" fill="#22c55e"/><path d="M12 16v5" stroke="#15803d" stroke-width="2"/></svg>`,
    '🏃': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="14" cy="4" r="2" fill="#6b7280"/><path d="M10 8l4-2 2 4-2 8-4 2M14 12l4 2M6 16l4-2" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    '⭐': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l3 7h7l-6 5 2 8-6-4-6 4 2-8-6-5h7z" fill="#fbbf24"/></svg>`,

    // Tool icons
    '💾': (id) => `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#6b7280" stroke-width="2"/><path d="M8 4v6h8V4M12 14v6" stroke="#6b7280" stroke-width="2"/></svg>`,
    '📥': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    '📱': (id) => `<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="2" width="12" height="20" rx="2" stroke="#6b7280" stroke-width="2"/><circle cx="12" cy="18" r="1" fill="#6b7280"/></svg>`,
    '⏩': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5l8 7-8 7V5zm10 0l8 7-8 7V5z" fill="#6b7280"/></svg>`,
    '🎚️': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="7" cy="8" r="2" fill="#6b7280"/><path d="M7 10v10M12 4v16M17 8v12" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="6" r="2" fill="#6b7280"/><circle cx="17" cy="10" r="2" fill="#6b7280"/></svg>`,
    '🔊': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="#6b7280"/><path d="M15 9c1 1 1 5 0 6M18 7c2 2 2 8 0 10" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    '🎤': (id) => `<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="#6b7280" stroke-width="2"/><path d="M5 11a7 7 0 0014 0M12 19v4M8 23h8" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    '🧘': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" fill="#6b7280"/><path d="M12 9c-2 0-4 2-4 4v4h1l2 4h2l2-4h1v-4c0-2-2-4-4-4z" fill="#6b7280"/><path d="M7 13l-3 3M17 13l3 3" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    '🏆': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M8 3h8v5c0 3-2 5-4 5s-4-2-4-5V3z" fill="#fbbf24"/><path d="M8 3H5a2 2 0 00-2 2v1a3 3 0 003 3M16 3h3a2 2 0 012 2v1a3 3 0 01-3 3M10 17h4v3H10v-3z" stroke="#78350f" stroke-width="1.5"/><path d="M7 21h10" stroke="#78350f" stroke-width="2" stroke-linecap="round"/></svg>`,
    '♻️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 6V3l-4 4 4 4V8c3 0 5 2 5 5s-2 5-5 5v2c4 0 7-3 7-7s-3-7-7-7z" fill="#10b981"/><path d="M7 13c0-1 0-2 1-3l-4-1-1 4 2 1c-1 2-1 4 0 6l2-1c-1-2-1-4 0-6z" fill="#10b981"/></svg>`,
    '🤖': (id) => `<svg viewBox="0 0 24 24" fill="none"><rect x="7" y="8" width="10" height="11" rx="2" stroke="#6b7280" stroke-width="2"/><circle cx="10" cy="12" r="1" fill="#6b7280"/><circle cx="14" cy="12" r="1" fill="#6b7280"/><path d="M10 16h4M12 4V8M5 11H3M21 11h-2M5 15H3M21 15h-2" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    '⚖️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v18M5 8l3 8H2l3-8zM19 8l3 8h-6l3-8zM5 8h14" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    '📍': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill="#ef4444"/><circle cx="12" cy="9" r="2" fill="white"/></svg>`,
    '📤': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    '👥': (id) => `<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="#6b7280" stroke-width="2"/><path d="M3 21c0-3 3-6 6-6s6 3 6 6M15 7c0-2 2-4 4-4s4 2 4 4M21 21c0-2-1-4-3-5" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    '🤝': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 5l-3 3 3 3-3 3 3 3M12 5l3 3-3 3 3 3-3 3" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    '✏️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M16 3l5 5-10 10H7v-4L16 3z" stroke="#6b7280" stroke-width="2" stroke-linejoin="round"/></svg>`,
    '🔖': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M6 2h12a2 2 0 012 2v18l-8-6-8 6V4a2 2 0 012-2z" fill="#fbbf24"/></svg>`,
    '🗺️': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3V6z" stroke="#6b7280" stroke-width="2" stroke-linejoin="round"/><path d="M8 3v15M16 6v15" stroke="#6b7280" stroke-width="2"/></svg>`,
    '🎓': (id) => `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l-9 5 9 5 9-5-9-5z" fill="#6b7280"/><path d="M3 13v4c0 2 4 4 9 4s9-2 9-4v-4M12 13v8" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
};
