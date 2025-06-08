/**
 *   Versel에 등록 register.js
 */

export default async function handler(req, res) {
  const origin = req.headers.origin || "";

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "허용되지 않은 요청 방식입니다." });
  }

  const body = req.body;

  try {
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbwnq-sI34SgkLZ2C91hOjGf2xfdaTXvqErRYs9r71j7IM9t4EsLGVesv7yapTvQafc/exec?action=register&origin=${encodeURIComponent(origin)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ status: "error", message: "등록 실패", error: error.message });
  }
}
