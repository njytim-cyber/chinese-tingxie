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
};
