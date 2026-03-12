import { useState } from "react";
import SpringBootTheory from "./components/SpringBootTheory";
import "./App.css";

function CollapsibleModule({ title, defaultOpen = true, fill = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`collapsible-module${fill ? " collapsible-fill" : ""}`}>
      <button className="collapsible-header" onClick={() => setOpen((o) => !o)}>
        <span className="collapsible-arrow">{open ? "▼" : "▶"}</span>
        <span className="collapsible-title">{title}</span>
      </button>
      {open && <div className={`collapsible-body${fill ? " collapsible-body-fill" : ""}`}>{children}</div>}
    </div>
  );
}

function App() {
  return (
    <div className="layout">
      <div className="left-pane">
        <h1>
          Spring Boot Manager <span className="badge">REST</span>
        </h1>
        <p className="module-placeholder">Interactive demo coming soon.</p>
      </div>
      <div className="right-pane">
        <CollapsibleModule title="Spring Boot Theory" defaultOpen={true}>
          <SpringBootTheory />
        </CollapsibleModule>
      </div>
    </div>
  );
}

export default App;
