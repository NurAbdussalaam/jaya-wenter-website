import { JAYA_WENTER_KB } from "../../content/jaya-wenter-knowledge.mjs";
import { SYSTEM_PROMPT } from "../../content/jaya-wenter-prompt.mjs";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// Pembatas sederhana per IP (in-memory; cukup untuk meredam penyalahgunaan ringan)
const hits = new Map();
const LIMIT = 15;            // maks permintaan
const WINDOW_MS = 60_000;    // per 1 menit
const MAX_LEN = 800;         // maks panjang pesan

function tooMany(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > LIMIT;
}

export default async (req, context) => {
  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
  if (tooMany(ip)) {
    return Response.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body harus JSON." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "Field message wajib diisi." }, { status: 400 });
  }

  if (message.length > MAX_LEN) {
    return Response.json({ error: "Pesan terlalu panjang." }, { status: 413 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY belum disetel di Netlify." },
      { status: 500 }
    );
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`;

  const instruction = `${SYSTEM_PROMPT}

KNOWLEDGE BASE JAYA WENTER:
${JAYA_WENTER_KB}

PESAN PELANGGAN:
${message}

Buat satu jawaban WhatsApp yang siap dikirim. Jangan menambahkan fakta yang tidak ada di Knowledge Base.`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: instruction }] }],
        generationConfig: {
          maxOutputTokens: 300
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: "Gagal menghubungi Gemini.",
          detail: data?.error?.message || "Unknown error"
        },
        { status: 502 }
      );
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      return Response.json({ error: "AI tidak menghasilkan jawaban." }, { status: 502 });
    }

    return Response.json({
      answer,
      model: MODEL
    });
  } catch (error) {
    return Response.json(
      { error: "Terjadi kesalahan saat memproses pertanyaan." },
      { status: 500 }
    );
  }
};

export const config = {
  path: "/api/ai-cs"
};
