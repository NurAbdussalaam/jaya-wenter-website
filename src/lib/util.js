import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const WA_NUMBER = "6285325730777";
export const SITE = "https://wenter.my.id";

/** Ubah path relatif ('assets/x.png', '../assets/x.png') jadi absolut ('/assets/x.png'). */
export function abs(p, base = "") {
  if (!p) return "";
  if (/^(https?:)?\/\//.test(p)) return p;
  let s = String(p).replace(/^(\.\.\/)+/, "").replace(/^\.\//, "");
  if (s.startsWith("/")) return s;
  return "/" + (base ? base.replace(/^\/|\/$/g, "") + "/" : "") + s;
}

/** Baca lebar/tinggi gambar saat build agar tidak ada layout shift. */
const cache = new Map();
export async function dims(urlPath) {
  if (!urlPath || /^https?:/.test(urlPath)) return {};
  const rel = decodeURI(urlPath).replace(/^\//, "");
  if (cache.has(rel)) return cache.get(rel);
  const candidates = [rel, rel.replace(/\.(png|jpe?g)$/i, ".webp")];
  let out = {};
  for (const c of candidates) {
    const f = path.join(process.cwd(), c);
    if (fs.existsSync(f) && fs.statSync(f).size > 100) {
      try {
        const m = await sharp(f).metadata();
        if (m.width && m.height) { out = { width: m.width, height: m.height }; break; }
      } catch {}
    }
  }
  cache.set(rel, out);
  return out;
}

/** Pecah teks bebas menjadi paragraf / daftar (sama seperti renderer lama). */
export function richText(text) {
  if (!text) return [];
  return String(text).split(/\n\s*\n/).map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const isList = lines.length && lines.every((l) => l.startsWith("- "));
    return isList ? { type: "ul", items: lines.map((l) => l.slice(2)) } : { type: "p", lines };
  }).filter((b) => (b.items || b.lines).length);
}

export function plain(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}
