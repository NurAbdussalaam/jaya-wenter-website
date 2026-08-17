/* ======================================================= */
/* GALLERY.JS                                              */
/* Grid = thumbnail ringan; lightbox = versi full tajam    */
/* ======================================================= */

(function () {
  const GALLERY_JSON_PATH = "/content/gallery.json";

  document.addEventListener("DOMContentLoaded", function () {
    fetch(GALLERY_JSON_PATH)
      .then(function (res) {
        if (!res.ok) throw new Error("Gagal memuat gallery.json");
        return res.json();
      })
      .then(function (data) {
        renderGallery(data.items || []);
        initializeFilters();
      })
      .catch(function (err) {
        console.error("Error loading gallery:", err);
        var grid = document.getElementById("galleryGrid");
        if (grid) {
          grid.innerHTML = '<p style="color:#c00;text-align:center;">Gagal memuat data gallery.</p>';
        }
      });
  });

  function renderGallery(items) {
    var grid = document.getElementById("galleryGrid");
    if (!grid) return;
    grid.innerHTML = "";

    items.forEach(function (item) {
      var el = document.createElement("div");
      el.className = "gallery-item";
      el.dataset.kategori = item.kategori || "";
      el.dataset.merk = item.merk || "";
      el.dataset.warna = item.warna || "";

      var thumb = item.image;
      var full = item.full || item.image;

      el.innerHTML =
        '<img src="' + thumb + '" alt="' + (item.alt || item.title) + '" loading="lazy" decoding="async" onclick="openLightbox(\'' + thumb + '\', \'' + full + '\')">' +
        '<div class="gallery-info">' +
        "<h3>" + (item.title || "") + "</h3>" +
        "<p>" + (item.description || "") + "</p>" +
        "</div>";

      grid.appendChild(el);
    });
  }

  function initializeFilters() {
    var searchInput = document.getElementById("gallerySearch");
    var searchClearBtn = document.getElementById("searchClearBtn");
    var resetFilterBtn = document.getElementById("resetFilterBtn");
    var resultCountEl = document.getElementById("resultCount");
    var noResultMsg = document.getElementById("noResultMsg");
    var kategoriButtons = document.querySelectorAll("#kategoriButtons .wenter-kw-btn");
    var warnaButtons = document.querySelectorAll("#warnaButtons .wenter-kw-btn");

    var activeKategori = null;
    var activeWarna = null;

    var categoryKeywords = {
      celana: "celana", jaket: "jaket", hoodie: "hoodie", kaos: "kaos",
      kemeja: "kemeja", tas: "tas", topi: "topi", lainnya: "lainnya",
      rok: "lainnya", dress: "lainnya"
    };

    var colorPhrases = [
      ["abu abu tua","abu"],["abu-abu tua","abu"],["abu2 tua","abu"],["abu tua","abu"],
      ["biru tua","biru"],["hijau tua","hijau"],["coklat tua","coklat"],["cokelat tua","coklat"],
      ["hitam","hitam"],["biru","biru"],["hijau","hijau"],["coklat","coklat"],["cokelat","coklat"],
      ["abu2","abu"],["abu","abu"]
    ];

    function normalize(str) {
      return (str || "").toLowerCase().replace(/[^\p{L}\p{N}\s&]/gu, " ").replace(/\s+/g, " ").trim();
    }
    function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    function wholeWordMatch(haystack, word) {
      if (!word) return true;
      return new RegExp("\\b" + escapeRegex(word) + "\\b", "i").test(haystack);
    }

    function parseQuery(raw) {
      var text = normalize(raw);
      var kategori = null, warna = null;
      for (var i = 0; i < colorPhrases.length; i++) {
        var re = new RegExp("\\b" + colorPhrases[i][0].replace(/ /g, "\\s+") + "\\b", "i");
        if (re.test(text)) { warna = colorPhrases[i][1]; text = text.replace(re, " ").replace(/\s+/g, " ").trim(); break; }
      }
      var keys = Object.keys(categoryKeywords);
      for (var j = 0; j < keys.length; j++) {
        var re2 = new RegExp("\\b" + escapeRegex(keys[j]) + "\\b", "i");
        if (re2.test(text)) { kategori = categoryKeywords[keys[j]]; text = text.replace(re2, " ").replace(/\s+/g, " ").trim(); break; }
      }
      return { kategori: kategori, warna: warna, freeWords: text.split(" ").filter(Boolean) };
    }

    function applyFilters() {
      var rawQuery = searchInput.value;
      var parsed = parseQuery(rawQuery);
      var finalKategori = activeKategori || parsed.kategori;
      var finalWarna = activeWarna || parsed.warna;
      var items = document.querySelectorAll(".gallery-item");
      var visibleCount = 0;

      items.forEach(function (item) {
        var merk = (item.dataset.merk || "").toLowerCase();
        var titleText = item.querySelector("h3") ? item.querySelector("h3").textContent : "";
        var descText = item.querySelector("p") ? item.querySelector("p").textContent : "";
        var haystack = normalize(titleText + " " + descText + " " + merk);
        var match = true;
        if (finalKategori && item.dataset.kategori !== finalKategori) match = false;
        if (finalWarna && item.dataset.warna !== finalWarna) match = false;
        if (match && parsed.freeWords.length) {
          match = parsed.freeWords.every(function (w) { return wholeWordMatch(haystack, w); });
        }
        item.style.display = match ? "" : "none";
        if (match) visibleCount++;
      });

      var isFiltering = rawQuery.trim() !== "" || activeKategori || activeWarna;
      if (resultCountEl) resultCountEl.textContent = isFiltering ? visibleCount + " hasil ditemukan" : "";
      if (noResultMsg) noResultMsg.style.display = (isFiltering && visibleCount === 0) ? "block" : "none";
      if (searchClearBtn) searchClearBtn.style.display = rawQuery ? "inline-flex" : "none";
    }

    searchInput.addEventListener("input", applyFilters);
    searchClearBtn.addEventListener("click", function () {
      searchInput.value = ""; searchClearBtn.style.display = "none"; applyFilters(); searchInput.focus();
    });
    kategoriButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val = btn.dataset.kategori;
        if (activeKategori === val) { activeKategori = null; btn.classList.remove("active"); }
        else { activeKategori = val; kategoriButtons.forEach(function (b) { b.classList.remove("active"); }); btn.classList.add("active"); }
        applyFilters();
      });
    });
    warnaButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val = btn.dataset.warna;
        if (activeWarna === val) { activeWarna = null; btn.classList.remove("active"); }
        else { activeWarna = val; warnaButtons.forEach(function (b) { b.classList.remove("active"); }); btn.classList.add("active"); }
        applyFilters();
      });
    });
    resetFilterBtn.addEventListener("click", function () {
      searchInput.value = ""; activeKategori = null; activeWarna = null;
      kategoriButtons.forEach(function (b) { b.classList.remove("active"); });
      warnaButtons.forEach(function (b) { b.classList.remove("active"); });
      applyFilters();
    });

    applyFilters();
  }

  /* Lightbox: thumb tampil instan, lalu diganti versi full saat selesai dimuat */
  window.openLightbox = function (thumbSrc, fullSrc) {
    var lb = document.getElementById("lightbox");
    var img = document.getElementById("lightboxImg");
    if (!lb || !img) return;
    lb.style.display = "block";
    img.src = thumbSrc;
    if (fullSrc && fullSrc !== thumbSrc) {
      var pre = new Image();
      pre.onload = function () {
        if (lb.style.display === "block") img.src = fullSrc;
      };
      pre.src = fullSrc;
    }
  };

  window.closeLightbox = function () {
    var lb = document.getElementById("lightbox");
    if (lb) lb.style.display = "none";
  };
})();
