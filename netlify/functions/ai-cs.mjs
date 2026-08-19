import { JAYA_WENTER_KB } from "../../content/jaya-wenter-knowledge.mjs";
import { SYSTEM_PROMPT } from "../../content/jaya-wenter-prompt.mjs";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export default async (req) => {
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
          temperature: 0.2,
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
