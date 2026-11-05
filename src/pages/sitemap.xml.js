import fs from "node:fs";
import path from "node:path";
import { getPosts } from "../lib/blog.js";
import { SITE } from "../lib/util.js";

export function GET() {
  const urls = [
    { loc: "/", priority: "1.0" },
    { loc: "/galeri/", priority: "0.8" },
    { loc: "/blog/", priority: "0.8" },
  ];
  const posts = getPosts();
  const seen = new Set();
  for (const p of posts) {
    seen.add(p.href);
    urls.push({ loc: p.href, lastmod: p.date, priority: "0.6" });
  }
  // artikel lama (HTML statis) yang belum tercatat di blog.json
  const skip = new Set(["index.html", "blog.html", "post.html"]);
  for (const f of fs.readdirSync(path.join(process.cwd(), "blog"))) {
    if (!f.endsWith(".html") || skip.has(f)) continue;
    const href = "/blog/" + f;
    if (!seen.has(href)) urls.push({ loc: href, priority: "0.6" });
  }
  const body = urls.map((u) => `<url><loc>${SITE}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<priority>${u.priority}</priority></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, { headers: { "Content-Type": "application/xml" } });
}
