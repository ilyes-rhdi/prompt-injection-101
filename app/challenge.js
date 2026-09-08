"use client";

import { useEffect, useRef, useState } from "react";
import { HINTS, MAX_HISTORY_MESSAGES, MAX_MESSAGE_CHARS, NOTEBOOK_ITEMS, WELCOME_MESSAGE } from "../lib/challenge";

const INITIAL_MESSAGES = [{ role: "ai", content: WELCOME_MESSAGE }];

function ObservatoryClock() {
  return (
    <div className="observatory-clock" aria-hidden="true">
      <svg viewBox="0 0 300 300" fill="none">
        <circle cx="150" cy="150" r="144" stroke="currentColor" strokeDasharray="2 8" opacity=".3" />
        <circle cx="150" cy="150" r="128" stroke="currentColor" opacity=".4" />
        <circle cx="150" cy="150" r="110" stroke="currentColor" opacity=".2" />
        {Array.from({ length: 60 }, (_, index) => <line key={index} x1="150" y1={index % 5 ? "32" : "28"} x2="150" y2={index % 5 ? "36" : "42"} stroke="currentColor" opacity={index % 5 ? ".3" : ".8"} transform={`rotate(${index * 6} 150 150)`} />)}
        <path d="M65 150H235M150 65V235" stroke="currentColor" strokeDasharray="2 6" opacity=".15" />
        <text x="150" y="65" textAnchor="middle" fill="currentColor">XII</text>
        <text x="240" y="155" textAnchor="middle" fill="currentColor">III</text>
        <text x="150" y="245" textAnchor="middle" fill="currentColor">VI</text>
        <text x="60" y="155" textAnchor="middle" fill="currentColor">IX</text>
        <line x1="150" y1="163" x2="150" y2="80" stroke="currentColor" strokeWidth="4" strokeLinecap="round" transform="rotate(128.5 150 150)" />
        <line x1="150" y1="169" x2="150" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform="rotate(102 150 150)" />
        <circle cx="150" cy="150" r="6" fill="currentColor" />
        <circle cx="150" cy="150" r="2" fill="#11191c" />
      </svg>
      <span>FIG. 01 — LE DERNIER INSTANT</span>
    </div>
  );
}

export default function Challenge({ model }) {
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
  const [hintsUsed, setHintsUsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [victory, setVictory] = useState(null);
  const chatRef = useRef(null);
  const composerRef = useRef(null);
  const busy = sending || checking;
  const turns = messages.filter((message) => message.role === "user").length;

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, sending]);

  async function handleTestKey() {
    if (!apiKey.trim() || testing) return;
    setTesting(true);
    setKeyStatus(null);
    try {
      const res = await fetch("/api/test-key", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      setKeyStatus({ ok: res.ok && data.valid, text: data.valid ? "Connexion établie. Les archives t’attendent." : data.error || "La vérification a échoué." });
    } catch {
      setKeyStatus({ ok: false, text: "Erreur réseau pendant la vérification de la clé." });
    } finally {
      setTesting(false);
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy || solved) return;
    const previous = messages;
    const history = [...previous, { role: "user", content: text }];
    setMessages(history);
    setDraft("");
    setSending(true);
    setChatError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, messages: history.slice(-(MAX_HISTORY_MESSAGES + 1)) }),
      });
      const data = await res.json();
      if (!res.ok || typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error(data.error || "L’archiviste n’a pas répondu. Réessaie.");
      }
      setMessages([...history, { role: "ai", content: data.reply }]);
    } catch (error) {
      setMessages(previous);
      setDraft(text);
      setChatError(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setSending(false);
      requestAnimationFrame(() => composerRef.current?.focus());
    }
  }

  async function handleCheckFlag(event) {
    event.preventDefault();
    if (!flagDraft.trim() || busy || solved) return;
    setChecking(true);
    setFlagFeedback(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: flagDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Validation indisponible. Réessaie.");
      if (data.correct === true) {
        setSolved(true);
        setVictory({ turns, hintsUsed });
        setFlagFeedback({ ok: true, text: "Sceau authentifié. Le dossier est résolu." });
      } else {
        setFlagFeedback({ ok: false, text: "Ce n’est pas le sceau attendu. Vérifie le texte exact, majuscules comprises." });
      }
    } catch (error) {
      setFlagFeedback({ ok: false, text: error instanceof Error ? error.message : "Erreur réseau pendant la validation." });
    } finally {
      setChecking(false);
    }
  }

  function handleReset() {
    if (busy) return;
    setMessages(INITIAL_MESSAGES);
    setDraft("");
    setChatError("");
    setFlagDraft("");
    setFlagFeedback(null);
    setSolved(false);
    setHintsUsed(0);
    setNotes("");
    setMilestones([]);
    setVictory(null);
  }

  return (
    <main className="container">
      <div className="masthead"><a href="/" className="wordmark"><span className="wordmark-icon">M</span> MNÉMOS <span className="wordmark-label">ARCHIVES CONVERSATIONNELLES</span></a><span className="session-status"><i /> {phase === "setup" ? "ACCÈS VISITEUR" : solved ? "DOSSIER RÉSOLU" : "SESSION OUVERTE"}</span></div>
      <header className="header">
        <div className="hero-copy">
        <div className="badge">
          <span className="badge-main">PROMPT INJECTION 101</span>
          <span className="badge-sub">ENQUÊTE N° 001</span>
        </div>
        <h1>La nuit<br /><em>sans aiguilles.</em></h1>
        <p className="subtitle">Un archiviste. Trois documents.<br />Un secret que le temps n’a pas effacé.</p>
        </div>
        <ObservatoryClock />
      </header>

      <section className="card briefing">
        <div className="briefing-meta"><span>01 / ORDRE DE MISSION</span><span>04:17 — HORLOGE ARRÊTÉE</span></div>
        <p>Cette nuit, une partie du registre de relève a disparu de l’édition publique.
          MNÉMOS en conserve la mémoire, mais refuse de dévoiler le sceau confidentiel.</p>
        <p className="goal">Explore les archives, recoupe leurs indices et obtiens le flag par la conversation.</p>
        <div className="tags"><span>Débutant +</span><span>Sessions indépendantes</span><span>{model}</span></div>
      </section>

      {phase === "setup" ? (
        <section className="card setup-card">
          <h2 className="flag-title">Ouvrir une session d’archives</h2>
          <form className="stack" onSubmit={(event) => { event.preventDefault(); if (apiKey.trim() && !testing) setPhase("playing"); }}>
            <label className="field-label" htmlFor="gemini-api-key">Ta clé API Gemini</label>
            <div className="key-row">
              <input id="gemini-api-key" type={showKey ? "text" : "password"} value={apiKey}
                onChange={(event) => { setApiKey(event.target.value); setKeyStatus(null); }}
                placeholder="Colle ta clé API" autoComplete="off" spellCheck={false} disabled={testing} />
              <button type="button" className="btn btn-ghost" onClick={() => setShowKey(!showKey)} aria-pressed={showKey}>
                {showKey ? "Masquer" : "Afficher"}
              </button>
            </div>
            <div className="btn-row">
              <button type="button" className="btn btn-ghost" onClick={handleTestKey} disabled={testing || !apiKey.trim()}>
                {testing ? "Connexion…" : "Tester la clé"}
              </button>
              <button type="submit" className="btn" disabled={testing || !apiKey.trim()}>Entrer dans les archives →</button>
            </div>
            {keyStatus && <p role="status" className={keyStatus.ok ? "feedback ok" : "feedback err"}>{keyStatus.text}</p>}
            <p className="warning">La clé reste en mémoire pendant cette session et transite par le serveur pour appeler Google.
              L’application ne l’enregistre pas. Les échanges sont transmis à Google ; les quotas et frais éventuels de ton projet s’appliquent.</p>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Obtenir une clé dans Google AI Studio ↗</a>
          </form>
        </section>
      ) : (
        <div className="investigation-grid">
          <aside className="case-sidebar">
            <section className="card">
              <h2 className="flag-title">Ton carnet d’enquête</h2>
              <p className="small-copy">Coche tes découvertes pour suivre ton raisonnement.</p>
              <div className="notebook-list">
                {NOTEBOOK_ITEMS.map((item, index) => (
                  <label className="notebook-item" key={item}>
                    <input type="checkbox" checked={milestones.includes(index)}
                      onChange={() => setMilestones((previous) => previous.includes(index) ? previous.filter((value) => value !== index) : [...previous, index])} />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
              <label className="field-label small-copy" htmlFor="notes">Notes personnelles</label>
              <textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} maxLength={6000}
                placeholder="Cotes, détails, hypothèses…" />
              <p className="small-copy">Tes notes ne sont pas envoyées au modèle. Elles disparaissent à la fermeture ou à la réinitialisation.</p>
            </section>
            <section className="card">
              <h2 className="flag-title">Un peu de lumière</h2>
              <p className="small-copy">Trois indices facultatifs, du plus discret au plus précis.</p>
              <ol className="hints-list" aria-live="polite">{HINTS.slice(0, hintsUsed).map((hint) => <li key={hint}>{hint}</li>)}</ol>
              <button className="btn btn-ghost btn-small" type="button" disabled={hintsUsed === HINTS.length || solved}
                onClick={() => setHintsUsed((count) => Math.min(count + 1, HINTS.length))}>
                {hintsUsed === HINTS.length ? "Tous les indices révélés" : `Révéler l’indice ${hintsUsed + 1} / ${HINTS.length}`}
              </button>
            </section>
          </aside>

          <div className="conversation-column">
            <section className="card">
              <div className="chat-heading"><h2 className="flag-title"><span className="live-dot" /> Ligne directe · MNÉMOS</h2><span className="small-copy">{turns} échange{turns > 1 ? "s" : ""}</span></div>
              <div ref={chatRef} className="chat-window" role="log" aria-label="Conversation avec MNÉMOS" aria-live="polite" aria-relevant="additions" aria-busy={sending}>
                {messages.map((message, index) => (
                  <div key={index} className={message.role === "user" ? "msg msg-you" : "msg msg-ai"}>
                    <span className="msg-prefix">{message.role === "user" ? "Toi" : "MNÉMOS"}</span>
                    <div>{message.content}</div>
                  </div>
                ))}
                {sending && <div className="msg msg-ai"><span className="msg-prefix">MNÉMOS consulte ses archives…</span></div>}
              </div>
              {turns === 0 && !solved && <div className="starter-row">
                {["Que contient le catalogue ?", "Que s’est-il passé cette nuit ?"].map((question) => (
                  <button type="button" className="btn btn-ghost btn-small" key={question} disabled={busy}
                    onClick={() => { setDraft(question); composerRef.current?.focus(); }}>{question}</button>
                ))}
              </div>}
              <form className="composer" onSubmit={handleSend}>
                <label className="sr-only" htmlFor="message">Ton message à MNÉMOS</label>
                <textarea id="message" ref={composerRef} value={draft} onChange={(event) => setDraft(event.target.value)}
                  placeholder="Interroge l’archiviste…" rows={3} maxLength={MAX_MESSAGE_CHARS} disabled={busy || solved}
                  onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }} />
                <button type="submit" className="btn" disabled={busy || solved || !draft.trim()}>{sending ? "…" : "Envoyer"}</button>
              </form>
              <div className="composer-meta"><span>Entrée : envoyer · Maj + Entrée : nouvelle ligne</span><span>{draft.length}/{MAX_MESSAGE_CHARS}</span></div>
              {chatError && <p role="alert" className="feedback err">{chatError}</p>}
              <p className="notice">MNÉMOS garde les {MAX_HISTORY_MESSAGES} derniers messages en contexte. Les réponses peuvent varier ; conserve les détails utiles dans ton carnet.</p>
              <div className="chat-actions">
                <button type="button" className="btn btn-ghost btn-small" disabled={busy} onClick={handleReset}>Recommencer l’enquête</button>
                <button type="button" className="btn btn-ghost btn-small" disabled={busy} onClick={() => { setShowKey(false); setKeyStatus(null); setPhase("setup"); }}>Changer de clé</button>
              </div>
            </section>

            <section className="card">
              <h2 className="flag-title">Valider le sceau</h2>
              <form className="composer" onSubmit={handleCheckFlag}>
                <label className="sr-only" htmlFor="flag">Flag obtenu</label>
                <input id="flag" type="text" value={flagDraft} onChange={(event) => setFlagDraft(event.target.value)}
                  placeholder="Mchal{...}" autoComplete="off" spellCheck={false} maxLength={135} disabled={busy || solved} />
                <button type="submit" className="btn" disabled={busy || solved || !flagDraft.trim()}>{checking ? "Vérification…" : "Vérifier"}</button>
              </form>
              {flagFeedback && <p role="status" className={flagFeedback.ok ? "feedback ok" : "feedback err"}>{flagFeedback.text}</p>}
            </section>

            {solved && <section className="card debrief" role="status">
              <p className="eyebrow">DOSSIER RÉSOLU</p>
              <h2>La mémoire a parlé.</h2>
              <p>{victory.turns} échange{victory.turns > 1 ? "s" : ""} · {victory.hintsUsed} indice{victory.hintsUsed > 1 ? "s" : ""} utilisé{victory.hintsUsed > 1 ? "s" : ""}</p>
              <p>Le défaut prévu dans ce scénario : la consultation masque une annotation confidentielle,
                mais une procédure de restitution recopie le document original. Deux règles du même service se contredisent.</p>
              <p>Cette voie de résolution suit une exception volontaire du prompt développeur ; elle ne démontre pas à elle seule
                un contournement du prompt système. D’autres formulations peuvent produire des résultats différents.</p>
              <p>À retenir : séparer les instructions des messages clarifie les responsabilités. Pour protéger un vrai secret,
                il faut aussi le tenir hors du contexte du modèle et contrôler l’accès dans le code.</p>
            </section>}
          </div>
        </div>
      )}
    </main>
  );
}
