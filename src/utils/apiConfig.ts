const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').trim().replace(/\/+$/, '');

// Ensures API_BASE always ends with /api even if user sets VITE_API_URL without /api
export const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
