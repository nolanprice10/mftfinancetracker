import { readdir, stat, writeFile } from "node:fs/promises";
import { join, posix } from "node:path";

const siteUrl = (process.env.VITE_SITE_URL || "https://myfinancetracker.app").replace(/\/$/, "");
const publicLearnDirectory = join(process.cwd(), "public", "learn");
const articleNames = (await readdir(publicLearnDirectory))
  .filter((name) => name.endsWith(".html"))
  .sort();

const routes = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  ...articleNames.map((name) => ({
    path: `/learn/${name}`,
    changefreq: "monthly",
    priority: "0.7",
  })),
];

const entries = await Promise.all(routes.map(async (route) => {
  const filePath = route.path.startsWith("/learn/")
    ? join(publicLearnDirectory, posix.basename(route.path))
    : join(process.cwd(), "public", "index.html");
  const fileStats = await stat(filePath).catch(() => null);
  const lastmod = (fileStats?.mtime || new Date()).toISOString().slice(0, 10);

  return `  <url>\n    <loc>${siteUrl}${route.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`;
}));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
await writeFile(join(process.cwd(), "public", "sitemap.xml"), sitemap, "utf8");