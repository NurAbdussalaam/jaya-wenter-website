# Panduan Eksekusi — Website JAYA WENTER (wenter.my.id)

Ikuti urut. Jangan lompat. Kalau hasilnya beda dari yang ditulis di sini, berhenti dan tanya Claude.
Cara kerja: versi baru dipasang di cabang terpisah (`perbaikan-v2`), diuji di Cloudflare, baru digabung ke situs asli. Situs yang tayang sekarang tidak tersentuh sampai langkah 7.

## 1. Cadangan (5 menit)
- GitHub → repo `jaya-wenter-website` → **Code → Download ZIP**. Simpan.
- Cloudflare → **Workers & Pages** → proyek situs wenter → **Deployments**. Pastikan deploy produksi terakhir berstatus *Success*. Dari sini nanti situs bisa di-*rollback* dalam hitungan detik.

## 2. Buka Codespace
- GitHub → repo → **Code → Codespaces → Create codespace on main** (atau buka yang sudah ada).
- Di terminal bawah, jalankan satu per satu:
```
git status
git branch --show-current
```
Harus tertulis "nothing to commit" dan nama cabang `main` (atau `master`).

## 3. Buat cabang kerja
```
git checkout -b perbaikan-v2
```

## 4. Masukkan versi baru
1. Tarik file `jaya-wenter-website-v2-astro.zip` ke panel **Explorer** (kiri) di Codespace, tunggu selesai.
2. Jalankan:
```
unzip -q jaya-wenter-website-v2-astro.zip -d /tmp/v2
cp -a /tmp/v2/jaya-wenter-website/. ./
rm jaya-wenter-website-v2-astro.zip
```
3. Hapus file lama yang tidak dipakai lagi:
```
git rm -rq --ignore-unmatch index.html index-backup-*.html ai-tester.html js robots.txt sitemap.xml _headers galeri/index.html galeri/index-backup-*.html blog/index.html blog/blog.html blog/post.html
```
JANGAN hapus `content/`, `assets/`, `galeri/images/`, `admin/`, `panel/`, `netlify/`, `style.css`, dan artikel `blog/*.html` lainnya.

## 5. Coba bangun di Codespace (2 menit)
```
npm install
npm run build
```
Harus berakhir dengan baris `optimize-images: ... gambar dikompres`. Kalau muncul tulisan `error`, kirim ke Claude, jangan lanjut.

## 6. Kirim ke GitHub
```
git add -A
git commit -m "Migrasi ke Astro, optimasi SEO dan kecepatan"
git push -u origin perbaikan-v2
```

## 7. Uji di Cloudflare (situs asli belum berubah)
Situs ini dilayani Cloudflare. Dasbor: dash.cloudflare.com → **Workers & Pages** → pilih proyek situs wenter.
1. Buka **Settings → Build** (atau *Build configuration*) dan ubah:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables → Add:** `NODE_VERSION` = `22` (untuk Production dan Preview)
   Simpan. Pengaturan ini tidak mengubah situs yang sedang tayang; baru dipakai pada build berikutnya.
2. Buka tab **Deployments**. Cabang `perbaikan-v2` yang sudah Anda push akan muncul sebagai *Preview*. Jika belum muncul, klik **Retry deployment** pada deploy cabang itu, atau jalankan di Codespace: `git commit --allow-empty -m "build ulang" && git push`.
3. Tunggu status *Success*, lalu buka tautan preview-nya dan periksa:
   - [ ] Beranda lengkap; di bawah tombol "Pesan Sekarang" ada "Mulai Rp25.000" dan "Estimasi pengerjaan 3–7 hari"
   - [ ] Tombol WhatsApp membuka WA dengan pesan terisi; tombol Lokasi membuka Google Maps yang benar
   - [ ] Menu di HP bisa dibuka; jam buka di footer benar
   - [ ] /galeri/: cari "kaos nike hitam", filter Jenis dan Warna, klik foto → membesar
   - [ ] /blog/ dan satu artikel baru, satu artikel lama (mis. /blog/wenter-vs-beli-baru.html)
   - [ ] /sitemap.xml dan /robots.txt terbuka
   - [ ] /panel/ masih bisa dibuka dan menyimpan perubahan
4. Ada masalah? Kirim tangkapan layar ke Claude. Jangan lanjut.

Catatan: /admin/ (Decap CMS) bergantung pada Netlify Identity dan tidak akan berfungsi di Cloudflare; ini sama dengan keadaan sekarang. Panel (/panel/) tidak terpengaruh.

## 8. Tayangkan
- GitHub → **Pull requests → New pull request** → dari `perbaikan-v2` ke `main` → **Create pull request** → **Merge pull request**.
- Cloudflare otomatis membangun `main` (±2 menit). Setelah *Success*, buka https://wenter.my.id dan ulangi daftar periksa langkah 7.
- Kalau ada yang rusak parah: Cloudflare → **Deployments** → deploy lama yang sukses → **⋯ → Rollback to this deployment**.

## 9. Setelah tayang (SEO)
1. Google Search Console → **Sitemaps** → kirim `https://wenter.my.id/sitemap.xml`.
2. **Inspeksi URL** → `https://wenter.my.id/` → **Minta pengindeksan**. Ulangi untuk `/galeri/` dan `/blog/`.
3. Google Analytics 4 → Admin → **Events** → tandai `whatsapp_click` sebagai **Key event**.
4. Pastikan alamat, jam buka, dan telepon di Google Business Profile sama dengan footer situs.

## Kebiasaan sesudahnya
- Foto baru lewat panel/admin tetap seperti biasa; dikompres otomatis saat deploy. Jangan menimpa foto lama dengan nama yang sama (cache 1 tahun).
- Teks beranda: ubah lewat `/admin/` atau `content/homepage.json`. Poin di bawah tombol hero ada di kolom "Poin Singkat di Bawah Tombol".
- File `blog/*.html` jangan dihapus; itu sumber isi artikel lama.
