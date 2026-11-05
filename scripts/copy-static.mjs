// Menyalin folder statis (yang dikelola panel/admin lewat GitHub) ke hasil build `dist/`.
// Struktur repo TIDAK diubah, jadi panel dan Decap CMS tetap bekerja seperti biasa.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const OUT = "dist";
const notBackup = (src) => !/backup/i.test(path.basename(src));

function copy(from, to, filter = notBackup) {
  if (!existsSync(from)) return;
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true, filter });
}

copy("assets", `${OUT}/assets`, (s) => notBackup(s) && !s.endsWith("README.md"));
copy("galeri/images", `${OUT}/galeri/images`);
copy("admin", `${OUT}/admin`);
copy("panel", `${OUT}/panel`);
copy("style.css", `${OUT}/style.css`); // dipakai artikel lama (HTML statis)

// Artikel lama berupa file HTML statis: URL-nya dipertahankan agar peringkat Google tidak hilang.
const skip = new Set(["index.html", "blog.html", "post.html"]);
for (const f of existsSync("blog") ? readdirSync("blog") : []) {
  if (f.endsWith(".html") && !skip.has(f)) copy(`blog/${f}`, `${OUT}/blog/${f}`);
}
console.log("copy-static: selesai");
