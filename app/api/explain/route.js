import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { question, options, correct_answer } = await req.json();

    const prompt = `
Explain the correct answer for the following multiple choice question.

Question:
${question}

Options:
A. ${options.A}
B. ${options.B}
C. ${options.C}
D. ${options.D}

Correct Answer: ${correct_answer}

Give a short, clear explanation (2–3 sentences).
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
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();
    const explanation =
      data.choices?.[0]?.message?.content ||
      "Explanation not available.";

    return NextResponse.json({ explanation });
  } catch (err) {
    console.error(err);
    return NextResponse.json({
      explanation: "Failed to generate explanation.",
    });
  }
}
