/**
 * JAYA WENTER — Block Renderer
 * Membaca content/homepage.json (array "blocks") dan merender tiap block
 * menjadi HTML sesuai tipenya. Tambah tipe baru cukup tambah satu
 * function render_<type> di bawah + daftarkan di RENDERERS.
 */
(function () {
  "use strict";

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Ubah teks dengan baris kosong = paragraf baru, "- " di awal baris = list item.
  function textToHtml(text) {
    if (!text) return "";
    const blocks = String(text).split(/\n\s*\n/);
    return blocks
      .map((block) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isList = lines.length && lines.every((l) => l.startsWith("- "));
        if (isList) {
          return "<ul>" + lines.map((l) => `<li>${esc(l.slice(2))}</li>`).join("") + "</ul>";
        }
        return `<p>${lines.map(esc).join("<br>")}</p>`;
      })
      .join("");
  }

  function waLink(href, text, extraClass, iconClass) {
    const icon = iconClass ? `<i class="${iconClass}" aria-hidden="true"></i>` : "";
    return `<a class="wenter-cta-btn ${extraClass || ""}" href="${esc(href)}" target="_blank">${icon}<span>${esc(text)}</span></a>`;
  }

  const RENDERERS = {
    hero(block) {
      return `
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-text">
              <h1>${esc(block.title)}</h1>
              <p>${esc(block.subtitle)}</p>
              ${waLink(block.cta_link, block.cta_text, "wenter-cta-btn--hero", "fab fa-whatsapp")}
            </div>
            <div class="hero-image">
              <img src="${esc(block.image)}" alt="${esc(block.image_alt || block.title)}">
            </div>
          </div>
        </div>
      </section>`;
    },

    text(block) {
      return `
      <section class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <div class="tarif">${textToHtml(block.body)}</div>
      </section>`;
    },

    feature_grid(block) {
      const items = (block.items || [])
        .map((it) => `<p><strong>${esc(it.title)}</strong><br>${esc(it.subtitle)}</p><br>`)
        .join("");
      return `
      <section class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <div class="tarif">${items}</div>
      </section>`;
    },

    gallery_preview(block) {
      const imgs = (block.images || [])
        .map((img) => `<img src="${esc(img.src)}" alt="${esc(img.alt)}">`)
        .join("");
      const cta = block.cta_link
        ? `<a href="${esc(block.cta_link)}" class="wenter-gallery-btn"><span>${esc(block.cta_text)}</span>
           <svg class="wenter-arrow-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
             <path d="M4 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
           </svg></a>`
        : "";
      return `
      <section id="galeri" class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <p style="text-align:center;margin-bottom:25px;">${esc(block.subheading)}</p>
        <div class="gallery">${imgs}${cta}</div>
      </section>`;
    },

    service_list(block) {
      const items = (block.items || [])
        .map((it) => `<p><strong>${esc(it.title)}</strong><br>${esc(it.description)}</p><br>`)
        .join("");
      return `
      <section id="layanan" class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <div class="tarif">${items}</div>
      </section>`;
    },

    color_palette(block) {
      const items = (block.colors || [])
        .map(
          (c) =>
            `<div class="warna-item"><div class="warna-bulat" style="background:${esc(c.hex)};width:48px;height:48px;border-radius:50%;margin:0 auto;"></div><p>${esc(c.name)}</p></div>`
        )
        .join("");
      return `
      <section class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <p class="warna-subtitle">${esc(block.subheading)}</p>
        <div class="warna-grid">${items}</div>
      </section>`;
    },

    pricing_table(block) {
      const rows = (block.rows || [])
        .map((r) => `<tr><td>${esc(r.item)}</td><td>${esc(r.price)}</td></tr>`)
        .join("");
      return `
      <section class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <div class="tarif"><table>${rows}</table></div>
      </section>`;
    },

    testimonials(block) {
      const items = (block.items || [])
        .map(
          (t) =>
            `<p>${"⭐".repeat(t.stars || 5)}<strong> ${esc(t.name)}</strong><br><br>${esc(t.text)}</p><br><hr><br>`
        )
        .join("");
      const cta = block.cta_link
        ? `<p><a href="${esc(block.cta_link)}" target="_blank" class="wenter-review-btn">
             <i class="fab fa-google" aria-hidden="true"></i><span>${esc(block.cta_text)}</span>
           </a></p>`
        : "";
      return `
      <section class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <div class="tarif">${items}${cta}</div>
      </section>`;
    },

    faq(block) {
      const items = (block.items || [])
        .map(
          (it) =>
            `<details><summary>${esc(it.question)}</summary>${textToHtml(it.answer)}</details>`
        )
        .join("");
      return `
      <section id="faq" class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <div class="faq-box">${items}</div>
      </section>`;
    },

    blog_preview(block) {
      const posts = (block.posts || [])
        .map(
          (p) => `
          <p><a href="${esc(p.link)}"><strong>${esc(p.title)}</strong></a></p>
          <p>${esc(p.excerpt)}</p>
          <p><a href="${esc(p.link)}">Baca Selengkapnya →</a></p>`
        )
        .join("<br>");
      return `
      <section class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <div>${posts}</div>
      </section>`;
    },

    cta_banner(block) {
      const btnClass = block.style === "agent" ? "wenter-cta-btn--agent" : "";
      const btn =
        block.style === "consult"
          ? `<a class="whatsapp-btn" href="${esc(block.cta_link)}" target="_blank">${esc(block.cta_text)}</a>`
          : waLink(block.cta_link, block.cta_text, btnClass, "fab fa-whatsapp");
      const id = block.anchor ? ` id="${esc(block.anchor)}"` : "";
      return `
      <section${id} class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <div class="tarif">${textToHtml(block.body)}<br>${btn}</div>
      </section>`;
    },

    legal_terms(block) {
      const sections = (block.sections || [])
        .map((s) => `<h3>${esc(s.title)}</h3>${textToHtml(s.body)}`)
        .join("");
      const id = block.anchor ? ` id="${esc(block.anchor)}"` : "";
      return `
      <section${id} class="container">
        <h2 class="section-title">${esc(block.heading)}</h2>
        <div class="faq-box"><details><summary>${esc(block.summary)}</summary>${sections}</details></div>
      </section>`;
    },

    video(block) {
      let embedUrl = block.url || "";
      if (block.provider === "youtube") {
        const idMatch = embedUrl.match(/(?:v=|youtu\.be\/)([\w-]+)/);
        if (idMatch) embedUrl = `https://www.youtube.com/embed/${idMatch[1]}`;
      } else if (block.provider === "tiktok") {
        const idMatch = embedUrl.match(/video\/(\d+)/);
        if (idMatch) embedUrl = `https://www.tiktok.com/embed/v2/${idMatch[1]}`;
      }
      return `
      <section class="container">
        <div style="max-width:640px;margin:0 auto;">
          <div style="position:relative;padding-bottom:56.25%;height:0;">
            <iframe src="${esc(embedUrl)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
          </div>
          ${block.caption ? `<p style="text-align:center;margin-top:10px;">${esc(block.caption)}</p>` : ""}
        </div>
      </section>`;
    },

    custom_embed(block) {
      // HTML bebas dari CMS — dipakai untuk widget/aplikasi pihak ketiga.
      return `<section class="container">${block.html || ""}</section>`;
    },

    ai_chat_widget(block) {
      // Placeholder mengambang; logika chat sebenarnya dihubungkan ke
      // netlify/functions/ai-cs.mjs pada tahap berikutnya.
      return `
      <div class="wenter-ai-widget" data-position="${esc(block.position || "bottom-right")}"
           style="position:fixed;${block.position === "bottom-left" ? "left" : "right"}:20px;bottom:100px;z-index:99998;">
        <!-- Widget chat AI akan dipasang di sini -->
      </div>`;
    },
  };

  async function renderBlocks(jsonUrl, mountSelector) {
    const mount = document.querySelector(mountSelector);
    if (!mount) return;
    try {
      const res = await fetch(jsonUrl, { cache: "no-store" });
      const data = await res.json();
      const html = (data.blocks || [])
        .map((block) => {
          const renderer = RENDERERS[block.type];
          if (!renderer) {
            console.warn("Tipe block tidak dikenal:", block.type);
            return "";
          }
          return renderer(block);
        })
        .join("\n");
      mount.innerHTML = html;
    } catch (err) {
      console.error("Gagal memuat homepage.json:", err);
    }
  }

  window.WenterBlocks = { renderBlocks, RENDERERS };
})();
