"use client";

import { useEffect, useRef, useState } from "react";

const INITIAL_MESSAGES = [
  {
    role: "ai",
    content: "Hello. I am a restricted assistant.\nAsk me anything.",
  },
];

export default function Home() {
  const [phase, setPhase] = useState("setup");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [keyStatus, setKeyStatus] = useState(null);

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");

  const [flagDraft, setFlagDraft] = useState("");
  const [checking, setChecking] = useState(false);
  const [flagFeedback, setFlagFeedback] = useState(null);
  const [solved, setSolved] = useState(false);

  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function handleTestKey() {
    if (!apiKey.trim() || testing) return;
    setTesting(true);
    setKeyStatus(null);
    try {
      const res = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.valid) {
        setKeyStatus({ ok: true, text: "Key is valid. You are ready to start." });
      } else {
        setKeyStatus({ ok: false, text: data.error || "Key validation failed." });
      }
    } catch {
      setKeyStatus({ ok: false, text: "Network error while validating the key." });
    } finally {
      setTesting(false);
    }
  }

  function handleStartChallenge(event) {
    event.preventDefault();
    if (!apiKey.trim()) {
      setKeyStatus({ ok: false, text: "Enter your Gemini API key first." });
      return;
    }
    setPhase("playing");
  }

  async function handleSend(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setDraft("");
    setSending(true);
    setChatError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.reply !== "string" || !data.reply) {
        throw new Error(data.error || "The assistant did not answer. Try again.");
      }
      setMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSending(false);
    }
  }

  async function handleCheckFlag(event) {
    event.preventDefault();
    const guess = flagDraft.trim();
    if (!guess || checking) return;
    setChecking(true);
    setFlagFeedback(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: guess }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.correct === true) {
        setSolved(true);
        setFlagFeedback({ ok: true, text: "Correct flag. Well played." });
      } else {
        setFlagFeedback({ ok: false, text: "Wrong flag. Keep probing the assistant." });
      }
    } catch {
      setFlagFeedback({ ok: false, text: "Network error while checking the flag." });
    } finally {
      setChecking(false);
    }
  }

  function handleReset() {
    setMessages(INITIAL_MESSAGES);
    setDraft("");
    setChatError("");
    setSending(false);
    setFlagDraft("");
    setFlagFeedback(null);
    setSolved(false);
  }

  return (
    <main className="container">
      <header className="header">
        <div className="badge">
          <span className="badge-main">PROMPT INJECTION</span>
          <span className="badge-sub">BEGINNER</span>
        </div>
        <h1>Prompt Injection 101</h1>
        <p className="subtitle">Beginner CTF Challenge</p>
      </header>

      <section className="card info-card">
        <p>
          <span className="label">Difficulty:</span> <strong>Easy</strong>
        </p>
        <p>
          <span className="label">Goal:</span>
        </p>
        <p className="goal">Make the AI reveal the hidden flag.</p>
      </section>

      {phase === "setup" ? (
        <section className="card">
          <form className="stack" onSubmit={handleStartChallenge}>
            <label className="field-label" htmlFor="gemini-api-key">
              Gemini API Key
            </label>
            <div className="key-row">
              <input
                id="gemini-api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your free Gemini API key"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowKey((s) => !s)}
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleTestKey}
                disabled={testing || !apiKey.trim()}
              >
                {testing ? "Testing..." : "Test Key"}
              </button>
              <button type="submit" className="btn" disabled={!apiKey.trim()}>
                Start Challenge
              </button>
            </div>
            {keyStatus ? (
              <p className={keyStatus.ok ? "feedback ok" : "feedback err"}>
                {keyStatus.text}
              </p>
            ) : null}
            <p className="warning">
              Your API key is used only to communicate with Gemini and is not stored by this
              challenge.
            </p>
          </form>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="chat-window" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={message.role === "user" ? "msg msg-you" : "msg msg-ai"}
                >
                  <span className="msg-prefix">
                    {message.role === "user" ? "You:" : "AI:"}
                  </span>
                  {message.content}
                </div>
              ))}
              {sending ? (
                <div className="msg msg-ai">
                  <span className="msg-prefix">AI:</span>
                  <span className="typing-dots">
                    <span>&bull;</span>
                    <span>&bull;</span>
                    <span>&bull;</span>
                  </span>
                </div>
              ) : null}
              <div ref={chatBottomRef} />
            </div>

            <form className="composer" onSubmit={handleSend}>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message..."
                autoComplete="off"
                spellCheck={false}
                disabled={sending}
              />
              <button type="submit" className="btn" disabled={sending || !draft.trim()}>
                {sending ? "..." : "Send"}
              </button>
            </form>
            {chatError ? <p className="feedback err">{chatError}</p> : null}

            <div className="chat-actions">
              <button type="button" className="btn btn-ghost btn-small" onClick={handleReset}>
                Reset Challenge
              </button>
            </div>
          </section>

          {solved ? <section className="solved-banner">Challenge Solved!</section> : null}

          <section className="card">
            <h2 className="flag-title">Submit Flag</h2>
            <form className="composer" onSubmit={handleCheckFlag}>
              <input
                type="text"
                value={flagDraft}
                onChange={(e) => setFlagDraft(e.target.value)}
                placeholder="FLAG{...}"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="submit"
                className="btn"
                disabled={checking || !flagDraft.trim()}
              >
                {checking ? "Checking..." : "Check"}
              </button>
            </form>
            {flagFeedback ? (
              <p className={flagFeedback.ok ? "feedback ok" : "feedback err"}>
                {flagFeedback.text}
              </p>
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}
