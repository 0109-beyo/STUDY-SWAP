export async function POST(req) {
  try {
    const { topic } = await req.json();

    const prompt = `You are a friendly tutor. Student topic or question: "${topic}".
Reply ONLY with valid JSON, no markdown fences, in this shape:
{"topic":"","simple":"","detailed":"","analogy":"","cards":[{"front":"","back":""}],"questions":[{"q":"","options":["","","",""],"answer":0,"why":""}]}
Rules: "simple" explains like to a beginner. "detailed" is a proper academic explanation. "analogy" uses a real-life example. Give 6 cards and 5 questions. "answer" is the index (0-3) of the correct option. Use \\n for line breaks.`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const d = await r.json();
    const raw = (d.content || []).map((c) => c.text || "").join("");
    const lesson = JSON.parse(raw.replace(/```json|```/g, "").trim());

    return Response.json({ lesson });
  } catch (e) {
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
