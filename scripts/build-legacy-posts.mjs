// Membuat ulang artikel lama (blog/*.html) dengan tampilan baru, URL TETAP SAMA (mis. /blog/wenter-vs-beli-baru.html).
// Isi artikel (kata-kata) tidak diubah sedikit pun; hanya dibungkus header/footer/gaya baru.
import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from "node:fs";

const TEMPLATE = "dist/legacy-template/index.html";
if (!existsSync(TEMPLATE)) { console.log("build-legacy-posts: template tidak ada, dilewati"); process.exit(0); }
const tpl = readFileSync(TEMPLATE, "utf8");
const skip = new Set(["index.html", "blog.html", "post.html"]);
const esc = (s) => s.replace(/&(?!amp;|lt;|gt;|quot;|#)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pick = (re, s, d = "") => (s.match(re) || [, d])[1].trim();
let n = 0;

for (const f of readdirSync("blog")) {
  if (!f.endsWith(".html") || skip.has(f)) continue;
  const src = readFileSync(`blog/${f}`, "utf8");
  // Bentuk umum: <div class="blog-content">...</div></section>. Ada artikel yang memakai
  // <section class="container blog-content"> dan tidak sempat ditutup; ambil sampai tag penutup atau akhir file.
  const m = src.match(/<div class="blog-content">([\s\S]*?)<\/div>\s*<\/section>/)
    || src.match(/<section[^>]*class="[^"]*blog-content[^"]*"[^>]*>([\s\S]*?)(?:<\/section>|<footer|$)/);
  if (!m) { console.warn("Lewati (tidak ada .blog-content):", f); continue; }

  let content = m[1]
    .replace(/(src|href)="\.\.\/(assets|blog|galeri)\//g, '$1="/$2/')
    .replace(/class="blog-thumb-hero"/g, 'class="hero-cover" loading="eager" decoding="async"')
    .replace(/\s*<h1>\s*([\s\S]*?)\s*<\/h1>/, "<h1>$1</h1>");

  const title = pick(/<title>([^<]*)<\/title>/, src, "JAYA WENTER");
  const desc = pick(/<meta name="description" content="([^"]*)"/, src, "Artikel seputar wenter dan perawatan pakaian dari JAYA WENTER Malang.");
  let og = pick(/property="og:image" content="([^"]*)"/, src, "");
  og = og ? og.replace(/^https?:\/\/wenter\.my\.id/, "") : "";
  if (!og) { const im = content.match(/<img[^>]*src="([^"]+)"/); og = im ? im[1] : "/assets/og-image.jpg"; }
  const ctaTag = src.match(/<a\b[^>]*whatsapp-btn[^>]*>\s*([^<]+?)\s*<\/a>/);
  const ctaHref = ctaTag && ctaTag[0].match(/href="(https:\/\/wa\.me[^"]*)"/);
  const cta = ctaTag && ctaHref ? [null, ctaHref[1], ctaTag[1]] : null;
  // tombol WhatsApp & "Kembali ke Blog" bawaan artikel dibuang dari isi; kerangka baru sudah menyediakannya
  content = content
    .replace(/<p>\s*<a\b[^>]*whatsapp-btn[\s\S]*?<\/a>\s*<\/p>/g, "")
    .replace(/<p>\s*<a href="(?:\.\.\/blog\/|index\.html)">\s*←\s*Kembali ke Blog\s*<\/a>\s*<\/p>/g, "");

  const out = tpl
    .replaceAll("%%TITLE%%", esc(title))
    .replaceAll("%%DESC%%", esc(desc))
    .replaceAll("%%FILE%%", f)
    .replaceAll("%%OGIMG%%", og)
    .replaceAll("%%CTA_HREF%%", cta ? cta[1] : "https://wa.me/6285325730777?text=Halo%20Jaya%20Wenter%2C%20saya%20ingin%20konsultasi..")
    .replaceAll("%%CTA_TEXT%%", cta ? esc(cta[2]) : "Konsultasi Via WhatsApp")
    .replace("%%CONTENT%%", () => content);
  writeFileSync(`dist/blog/${f}`, out);
  n++;
}
rmSync("dist/legacy-template", { recursive: true, force: true });
console.log(`build-legacy-posts: ${n} artikel lama dirender ulang`);
