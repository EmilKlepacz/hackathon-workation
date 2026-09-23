import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./levels.css";

const demo = {
  repo: "vercel/next.js",
  filesReviewed: 8,
  roast: {
    summary:
      "A surprisingly competent codebase wearing the emotional support blanket of a thousand abstractions.",
    debtLevel: 4,
    verdict: "Not a dumpster fire. More of a carefully architected bonfire.",
    files: [
      {
        path: "packages/next/src/server/app-render.tsx",
        severity: "medium",
        comment:
          "This file is doing the job of an entire department and has the dependency graph to prove it.",
      },
      {
        path: "packages/next/src/build/index.ts",
        severity: "low",
        comment:
          "A build pipeline so elaborate it needs its own build pipeline. At least the complexity is employed.",
      },
    ],
  },
};
const roastingLevels = [
  {
    id: "gentle",
    name: "Gentle reviewer",
    description: "Helpful notes, soft edges",
  },
  {
    id: "constructive",
    name: "Constructive critic",
    description: "Clear feedback, practical fixes",
  },
  {
    id: "brutal",
    name: "Brutal senior developer",
    description: "Sharp observations, zero sugarcoat",
  },
];

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [roastingLevel, setRoastingLevel] = useState("brutal");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function roast() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, githubToken, roastingLevel }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went sideways.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">&gt;_</span>
          <span>
            repo<span className="accent">roaster</span>
          </span>
        </a>
        <div className="status">
          <span className="pulse" />
          AI CODE REVIEW / ONLINE
        </div>
        <div className="toplinks">
          <span>v1.0.0</span>
          <span>EN</span>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <span>01</span> PASTE A REPOSITORY
          </div>
          <h1>
            Good code gets
            <br />
            <em>respect.</em> Bad code
            <br />
            gets <span className="strike">roasted.</span>
          </h1>
          <p className="lede">
            An AI-powered code review that doesn't sugarcoat. Drop in a public
            GitHub repo and prepare for a brutally honest technical debt report.
          </p>
          <div className="terminal-card">
            <div className="terminal-head">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              <span>~/repo-roaster</span>
              <span className="terminal-label">READY</span>
            </div>
            <div className="terminal-body">
              <label>
                <span className="prompt">$</span> repo_url
              </label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/you/your-repo"
                onKeyDown={(e) => e.key === "Enter" && roast()}
              />
              <button onClick={roast} disabled={loading || !repoUrl}>
                {loading ? "SCANNING…" : "ROAST IT"} <span>↗</span>
              </button>
              <div className="level-picker">
                <div className="level-label">ROASTING LEVEL</div>
                <div className="level-options">
                  {roastingLevels.map((level) => (
                    <button
                      type="button"
                      key={level.id}
                      className={`level-option ${
                        roastingLevel === level.id ? "selected" : ""
                      }`}
                      onClick={() => setRoastingLevel(level.id)}
                    >
                      <span>{level.name}</span>
                      <small>{level.description}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="token-row">
                <span className="lock">⌁</span>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="GitHub PAT (optional — for private access)"
                />
                <span className="hint">never stored</span>
              </div>
            </div>
          </div>
          {error && <div className="error">× {error}</div>}
          <div className="permission">
            <span>⚠</span>
            <span>
              Only roast repositories you have explicit permission to review. Be
              cool.
            </span>
          </div>
        </section>
        <section className="results">
          <div className="section-label">
            <span>02</span> YOUR REPORT <span className="line" />
          </div>
          {!result && !loading && (
            <div className="empty">
              <div className="empty-icon" />
              <strong>AWAITING TARGET</strong>
              <p>
                Enter a GitHub URL above.
                <br />
                The code won't judge itself.
              </p>
              <button className="demo" onClick={() => setResult(demo)}>
                LOAD DEMO ROAST <span>→</span>
              </button>
            </div>
          )}
          {loading && (
            <div className="loading">
              <span className="loader" />
              <strong>INDEXING THE EVIDENCE…</strong>
              <p>Fetching source files. The roast is marinating.</p>
            </div>
          )}
          {result && <Report result={result} />}
        </section>
      </main>
      <footer>
        <span>BUILT FOR PEOPLE WHO READ THE DIFF</span>
        <span>NO CODE WAS HARMED (YET)</span>
      </footer>
    </div>
  );
}

function Report({ result }) {
  const roast = result.roast || {};
  const level = roastingLevels.find((item) => item.id === result.roastingLevel);
  return (
    <div className="report">
      <div className="report-top">
        <div>
          <span className="repo-name">github.com/</span>
          <strong>{result.repo}</strong>
          <p>
            {result.filesReviewed} source files inspected · {level?.name || "Roast"} · verdict generated by AI
          </p>
        </div>
        <div
          className={`score score-${
            roast.debtLevel > 7 ? "bad" : roast.debtLevel > 4 ? "warn" : "good"
          }`}
        >
          <small>TECHNICAL DEBT</small>
          <b>
            {roast.debtLevel}
            <span>/10</span>
          </b>
        </div>
      </div>
      <div className="summary">
        <span className="quote">“</span>
        <p>{roast.summary}</p>
      </div>
      <div className="file-list">
        {(roast.files || []).map((file, i) => (
          <article className="file" key={i}>
            <div className="file-head">
              <span className="file-index">0{i + 1}</span>
              <code>{file.path}</code>
              <span className={`severity ${file.severity}`}>
                {file.severity}
              </span>
            </div>
            <p>{file.comment}</p>
          </article>
        ))}
      </div>
      <div className="verdict">
        <span>FINAL VERDICT</span>
        <strong>{roast.verdict}</strong>
      </div>
      <button
        className="again"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ROAST ANOTHER <span>↗</span>
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
