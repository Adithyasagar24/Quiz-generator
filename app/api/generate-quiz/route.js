import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { topic = "Java", count = 3 } = await req.json();

    const prompt = `
Generate ${count} multiple choice quiz questions on "${topic}".

Return ONLY valid JSON array.
No markdown. No explanation.

Format:
[
  {
    "question": "string",
    "options": {
      "A": "string",
      "B": "string",
      "C": "string",
      "D": "string"
    },
    "correct_answer": "A"
  }
]
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "AI Quiz Generator",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        }),
      }
    );

    const raw = await response.json();

    let content = raw.choices?.[0]?.message?.content || "[]";
    content = content.replace(/```json|```/g, "").trim();

    let quiz;
    try {
      quiz = JSON.parse(content);
    } catch {
      quiz = [];
    }

    return NextResponse.json({ quiz });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ quiz: [] });
  }
}
