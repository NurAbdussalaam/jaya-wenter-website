// Kompresi gambar OTOMATIS saat deploy di Netlify.
// - Semua PNG (dan JPG > 150 KB) di assets/ dan galeri/images/ diubah ke WebP, lebar maks 1000px.
// - Referensi nama file di .html/.json/.js/.xml otomatis diganti ke .webp (hanya di salinan build,
//   file asli di GitHub TIDAK berubah, jadi panel/admin tetap boleh mengunggah PNG/JPG biasa).
// - Aman dijalankan berulang: kalau tidak ada PNG/JPG baru, tidak ada yang berubah.
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.argv[2] || ".";
const IMAGE_DIRS = ["assets", "galeri/images"].map((d) => path.join(ROOT, d));
const MAX_WIDTH = 1000;
const QUALITY = 80;
const JPG_MIN_BYTES = 150 * 1024;
// Tetap format asli: logo (butuh transparan jelas) dan gambar OG untuk preview WhatsApp/Facebook.
const KEEP = [/logo/i, /^og-image\./i];
// Jangan ubah isi file panel/admin (mengelola nama file sendiri).
const SKIP_REWRITE_DIRS = new Set([".git", "node_modules", "panel", "admin", "netlify", "scripts", "_astro"]);
const REWRITE_EXT = new Set([".html", ".json", ".js", ".xml", ".css"]);

async function* walk(dir, skip = new Set()) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (skip.has(e.name)) continue;
      yield* walk(path.join(dir, e.name), skip);
    } else yield path.join(dir, e.name);
  }
}

const converted = []; // { base: "nama.png", webp: "nama.webp" }
let before = 0, after = 0;

for (const dir of IMAGE_DIRS) {
  for await (const file of walk(dir)) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file);
    if (![".png", ".jpg", ".jpeg"].includes(ext)) continue;
    if (KEEP.some((re) => re.test(base))) continue;
    const stat = await fs.stat(file);
    if (ext !== ".png" && stat.size < JPG_MIN_BYTES) continue;
    const out = file.slice(0, -ext.length) + ".webp";
    try {
      await sharp(file).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 5 }).toFile(out);
    } catch (err) {
      console.warn("Gagal kompres", file, err.message);
      continue;
    }
    before += stat.size;
    after += (await fs.stat(out)).size;
    await fs.unlink(file);
    converted.push({ base, webp: path.basename(out) });
  }
}

if (converted.length) {
  // Ganti dari nama terpanjang dulu agar tidak saling menimpa.
  converted.sort((a, b) => b.base.length - a.base.length);
  const variants = (n) => [n, encodeURI(n)];
  for await (const file of walk(ROOT, SKIP_REWRITE_DIRS)) {
    if (!REWRITE_EXT.has(path.extname(file).toLowerCase())) continue;
    let text = await fs.readFile(file, "utf8");
    let changed = false;
    for (const c of converted) {
      const pairs = [[c.base, c.webp], [encodeURI(c.base), encodeURI(c.webp)]];
      for (const [from, to] of pairs) {
        if (text.includes(from)) { text = text.split(from).join(to); changed = true; }
      }
    }
    if (changed) await fs.writeFile(file, text);
  }
}

const mb = (n) => (n / 1e6).toFixed(1);
console.log(`optimize-images: ${converted.length} gambar dikompres, ${mb(before)} MB -> ${mb(after)} MB`);
