"use client";
import { useState, useEffect } from "react";

const empty = { xp: 0, streak: 0, last: "", lib: [] };

export default function Home() {
  const [tab, setTab] = useState("tutor");
  const [S, setS] = useState(empty);
  const [lesson, setLesson] = useState(null);
  const [mode, setMode] = useState("simple");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [ci, setCi] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("ss"));
      if (d) setS(d);
    } catch (e) {}
  }, []);

  function update(next) {
    setS(next);
    localStorage.setItem("ss", JSON.stringify(next));
  }

  function withStreak(base) {
    const today = new Date().toDateString();
    if (base.last === today) return base;
    const y = new Date(Date.now() - 864e5).toDateString();
    return {
      ...base,
      streak: base.last === y ? base.streak + 1 : 1,
      last: today
    };
  }

  function openLesson(l) {
    setLesson(l);
    setMode("simple");
    setQi(0);
    setCi(0);
    setPicked(null);
    setFlipped(false);
  }

  async function explain() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: text })
      });
      const data = await r.json();
      if (!r.ok || !data.lesson) throw new Error("failed");
      openLesson(data.lesson);
      update(withStreak({ ...S, lib: [data.lesson, ...S.lib].slice(0, 20) }));
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  function pick(i) {
    if (picked !== null) return;
    setPicked(i);
    if (i === lesson.questions[qi].answer) {
      update(withStreak({ ...S, xp: S.xp + 10 }));
    }
  }

  const q = lesson ? lesson.questions[qi] : null;
  const card = lesson ? lesson.cards[ci] : null;

  return (
    <main>
      {tab === "tutor" && (
        <div>
          <h1>🤖 AI Tutor</h1>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a topic or question, e.g. How does the heart pump blood?"
          />
          <button onClick={explain} disabled={loading}>
            {loading ? "Thinking..." : "Teach me"}
          </button>
          {error && <div className="card">{error}</div>}
          {lesson && (
            <div>
              <h2>{lesson.topic}</h2>
              <div className="sub">
                {[
                  ["simple", "Simple"],
                  ["detailed", "Detailed"],
                  ["analogy", "Real-life"]
                ].map(([k, label]) => (
                  <button
                    key={k}
                    className={mode === k ? "on" : ""}
                    onClick={() => setMode(k)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="card">{lesson[mode]}</div>
              <button onClick={() => setTab("practice")}>Start quiz →</button>
            </div>
          )}
        </div>
      )}

      {tab === "practice" && (
        <div>
          <h1>🧠 Practice</h1>
          {!lesson && <div className="card">Ask a topic in Tutor first.</div>}
          {lesson && qi >= lesson.questions.length && (
            <div>
              <div className="card">Quiz done! 🎉 Check your flashcards next.</div>
              <button
                onClick={() => {
                  setQi(0);
                  setPicked(null);
                }}
              >
                Retry
              </button>
            </div>
          )}
          {lesson && q && (
            <div>
              <h3>
                {qi + 1}. {q.q}
              </h3>
              {q.options.map((o, i) => {
                let bg = "#1e293b";
                if (picked !== null && i === q.answer) bg = "#166534";
                else if (picked === i) bg = "#991b1b";
                return (
                  <button
                    key={i}
                    className="opt"
                    style={{ background: bg }}
                    onClick={() => pick(i)}
                  >
                    {o}
                  </button>
                );
              })}
              {picked !== null && (
                <div>
                  <div className="card">
                    {picked === q.answer ? "✅ Correct! +10 XP\n" : "❌ Not quite.\n"}
                    {q.why}
                  </div>
                  <button
                    onClick={() => {
                      setQi(qi + 1);
                      setPicked(null);
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "cards" && (
        <div>
          <h1>📚 Flashcards</h1>
          {!lesson && <div className="card">Ask a topic in Tutor first.</div>}
          {lesson && card && (
            <div>
              <div className="card flash" onClick={() => setFlipped(!flipped)}>
                {flipped ? card.back : card.front}
              </div>
              <p>
                Card {ci + 1} of {lesson.cards.length} — tap card to flip
              </p>
              <button
                onClick={() => {
                  setCi((ci + 1) % lesson.cards.length);
                  setFlipped(false);
                }}
              >
                Next card
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "profile" && (
        <div>
          <h1>👤 Profile</h1>
          <div className="card">
            {"⭐ " + S.xp + " XP\n🏅 Level " + (Math.floor(S.xp / 100) + 1) + "\n🔥 " + S.streak + "-day streak"}
          </div>
          <h3>Library</h3>
          {S.lib.length === 0 && <div className="card">No topics yet.</div>}
          {S.lib.map((l, i) => (
            <div
              key={i}
              className="lib"
              onClick={() => {
                openLesson(l);
                setTab("tutor");
              }}
            >
              📖 {l.topic}
            </div>
          ))}
        </div>
      )}

      <nav>
        {[
          ["tutor", "🤖 Tutor"],
          ["practice", "🧠 Practice"],
          ["cards", "📚 Cards"],
          ["profile", "👤 Profile"]
        ].map(([k, label]) => (
          <button
            key={k}
            className={tab === k ? "on" : ""}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
