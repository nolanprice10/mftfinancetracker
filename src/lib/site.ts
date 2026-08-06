export const SITE_NAME = "MyFinanceTracker";

const normalizeSiteUrl = (raw: string) => raw.replace(/\/$/, "");

export const SITE_URL = normalizeSiteUrl(
  import.meta.env.VITE_SITE_URL || "https://myfinancetracker.app"
);

export const DEFAULT_OG_IMAGE = `${SITE_URL}/screenshots/dashboard-wide.png`;

export const buildCanonicalUrl = (path = "/") => {
  if (!path) return SITE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
};
