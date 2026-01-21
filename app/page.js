"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(3);
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🌙 Dark mode
  const [darkMode, setDarkMode] = useState(false);

  // ⏱ Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const SECONDS_PER_QUESTION = 30;

  // 🧠 AI explanations
  const [explanations, setExplanations] = useState({});

  /* -------------------- THEME -------------------- */

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    setDarkMode(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  /* -------------------- QUIZ -------------------- */

  const generateQuiz = async () => {
    setLoading(true);
    setQuiz([]);
    setAnswers({});
    setScore(null);
    setExplanations({});
    setTimeUp(false);

    const res = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, count }),
    });

    const data = await res.json();
    const quizData = Array.isArray(data.quiz) ? data.quiz : [];

    setQuiz(quizData);
    setTimeLeft(quizData.length * SECONDS_PER_QUESTION);
    setTimerRunning(true);
    setLoading(false);
  };

  /* -------------------- TIMER -------------------- */

  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && timerRunning) {
      setTimeUp(true);
      submitQuiz();
    }
  }, [timeLeft, timerRunning]);

  const formatTime = (sec) =>
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  /* -------------------- SUBMIT -------------------- */

  const submitQuiz = async () => {
    if (score !== null) return;

    let s = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.correct_answer) s++;
    });

    setScore(s);
    setTimerRunning(false);

    // 🧠 Fetch AI explanations
    const exp = {};
    for (let i = 0; i < quiz.length; i++) {
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: quiz[i].question,
            options: quiz[i].options,
            correct_answer: quiz[i].correct_answer,
          }),
        });

        const data = await res.json();
        exp[i] = data.explanation;
      } catch {
        exp[i] = "Explanation unavailable.";
      }
    }

    setExplanations(exp);
  };

  /* -------------------- RENDER -------------------- */

  return (
    <main className="app">
      {/* ---------- HEADER ---------- */}
      <div className="header">
        <div className="header-row">
          <div className="title">AI Quiz Generator</div>
          <button onClick={toggleDarkMode} style={{ width: "auto" }}>
            {darkMode ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        {timerRunning && (
          <div className={`timer ${timeLeft <= 10 ? "danger" : ""}`}>
            ⏱ Time Left: {formatTime(timeLeft)}
          </div>
        )}

        {timeUp && (
          <p style={{ color: "red", fontWeight: "bold" }}>
            ⏰ Time’s up! Quiz submitted automatically.
          </p>
        )}

        {/* ✅ SCORE AT TOP */}
        {score !== null && (
          <div className="score">
            🎯 Score: {score} / {quiz.length}
          </div>
        )}
      </div>

      {/* ---------- CONTROLS ---------- */}
      <div className="card">
        <input
          placeholder="Enter topic (e.g. DBMS)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <input
          type="number"
          min={1}
          max={10}
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />

        <button onClick={generateQuiz}>
          {loading ? "Generating..." : "Generate Quiz"}
        </button>
      </div>

      {/* ---------- QUESTIONS ---------- */}
      {quiz.map((q, i) => (
        <div key={i} className="card question">
          <h3>
            {i + 1}. {q.question}
          </h3>

          {Object.entries(q.options).map(([k, v]) => (
            <label
              key={k}
              className={`option ${
                score !== null || timeUp
                  ? k === q.correct_answer
                    ? "correct"
                    : answers[i] === k
                    ? "wrong"
                    : ""
                  : ""
              }`}
            >
              <input
                type="radio"
                name={`q-${i}`}
                disabled={score !== null || timeUp}
                onChange={() =>
                  setAnswers({ ...answers, [i]: k })
                }
              />
              {k}. {v}
            </label>
          ))}

          {(score !== null || timeUp) && explanations[i] && (
            <div className="explanation">
              <strong>🧠 Explanation:</strong>
              <p>{explanations[i]}</p>
            </div>
          )}
        </div>
      ))}

      {/* ---------- SUBMIT BUTTON ---------- */}
      {quiz.length > 0 && score === null && !timeUp && (
        <button onClick={submitQuiz}>Submit Quiz</button>
      )}
    </main>
  );
}
