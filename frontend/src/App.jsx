import { useState, useRef, useEffect } from "react";
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core";
import { ApolloProvider } from "@apollo/client/react";
import GraphQLApp from "../../graphql-learning/frontend/src/App";
import SpringBootApp from "../../springboot-learning/frontend/src/App";
import "./hub.css";

const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: "/graphql" }),
  cache: new InMemoryCache(),
});

const MODULES = [
  {
    id: "graphql",
    label: "GraphQL Learning",
    desc: "Strawberry · FastAPI · DataLoader",
    badge: "GraphQL",
    badgeColor: "#a0357a",
    dot: "#e535ab",
    hint: null,
  },
  {
    id: "springboot",
    label: "Spring Boot",
    desc: "Java · Spring · JPA · Cloud",
    badge: "REST",
    badgeColor: "#3d7030",
    dot: "#6db33f",
    hint: "Maven build can take 30–60 s on first run.",
  },
];

// ── Loading screen ──────────────────────────────────────────────────────────
function LoadingScreen({ mod, elapsed }) {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <span className="loading-dot-large" style={{ background: mod.dot }} />
        <h2 className="loading-title">{mod.label}</h2>
        <p className="loading-status">Starting backend environment…</p>
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
        <p className="loading-elapsed">{elapsed}s elapsed</p>
        {mod.hint && <p className="loading-hint">{mod.hint}</p>}
      </div>
    </div>
  );
}

// ── Welcome screen ──────────────────────────────────────────────────────────
function WelcomeScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <p className="welcome-brand">BrawnedBrain</p>
        <p className="loading-status">Select a module from the sidebar to get started.</p>
      </div>
    </div>
  );
}

// ── Hub App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeModule, setActiveModule] = useState(null);
  const [moduleStatus, setModuleStatus] = useState("idle"); // idle | starting | ready
  const [elapsed, setElapsed]     = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("bb-theme") || "light"
  );

  const pollRef   = useRef(null);
  const timerRef  = useRef(null);
  const activeRef = useRef(null);

  // Apply theme to <html> so all CSS overrides pick it up
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("bb-theme", next);
  }

  function clearTimers() {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function handleModuleSelect(moduleId) {
    clearTimers();
    setActiveModule(moduleId);
    activeRef.current = moduleId;

    try {
      const res  = await fetch(`/__hub/status/${moduleId}`);
      const data = await res.json();
      if (data.ready) { setModuleStatus("ready"); return; }
    } catch { /* proceed to start */ }

    setModuleStatus("starting");
    setElapsed(0);

    fetch(`/__hub/start/${moduleId}`, { method: "POST" }).catch(() => {});

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    pollRef.current = setInterval(async () => {
      if (activeRef.current !== moduleId) { clearTimers(); return; }
      try {
        const res  = await fetch(`/__hub/status/${moduleId}`);
        const data = await res.json();
        if (data.ready) { clearTimers(); setModuleStatus("ready"); }
      } catch { /* keep polling */ }
    }, 2000);
  }

  const activeMod = MODULES.find((m) => m.id === activeModule);

  return (
    <div className="hub-root">
      {/* ── Sidebar ── */}
      <aside className={`hub-sidebar ${sidebarOpen ? "hub-sidebar--open" : "hub-sidebar--closed"}`}>
        <button className="hub-toggle" onClick={() => setSidebarOpen((o) => !o)}>
          {sidebarOpen ? "◀" : "▶"}
        </button>

        {sidebarOpen && (
          <div className="hub-sidebar-inner">
            <div className="hub-brand">
              <span className="hub-brand-text">BrawnedBrain</span>
            </div>

            <div className="hub-section-label">Modules</div>

            {MODULES.map((m) => (
              <button
                key={m.id}
                className={`hub-module-item${activeModule === m.id ? " hub-module-item--active" : ""}`}
                onClick={() => handleModuleSelect(m.id)}
              >
                <span className="hub-module-dot" style={{ background: m.dot }} />
                <span className="hub-module-info">
                  <span className="hub-module-name">{m.label}</span>
                  <span className="hub-module-desc">{m.desc}</span>
                </span>
                <span className="hub-module-badge" style={{ background: m.badgeColor }}>
                  {m.badge}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Theme toggle — always visible at bottom ── */}
        <div className="hub-sidebar-footer">
          {sidebarOpen ? (
            <div className="theme-toggle-row">
              <span className="theme-toggle-label">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </span>
              <button
                className={`theme-toggle-switch${theme === "dark" ? " on" : ""}`}
                onClick={toggleTheme}
                aria-label="Toggle theme"
              />
            </div>
          ) : (
            <button
              className="theme-toggle-icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              {theme === "dark" ? "○" : "◑"}
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="hub-content">
        {activeModule === null && <WelcomeScreen />}

        {activeModule !== null && moduleStatus === "starting" && (
          <LoadingScreen mod={activeMod} elapsed={elapsed} />
        )}

        {moduleStatus === "ready" && activeModule === "graphql" && (
          <ApolloProvider client={apolloClient}>
            <GraphQLApp />
          </ApolloProvider>
        )}
        {moduleStatus === "ready" && activeModule === "springboot" && (
          <SpringBootApp />
        )}
      </div>
    </div>
  );
}
