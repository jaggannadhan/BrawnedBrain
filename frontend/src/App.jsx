import { useState } from "react";
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client/core";
import { ApolloProvider } from "@apollo/client/react";
import GraphQLApp from "../../graphql-learning/frontend/src/App";
import SpringBootApp from "../../springboot-learning/frontend/src/App";
import "./hub.css";

const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:8000/graphql" }),
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
  },
  {
    id: "springboot",
    label: "Spring Boot",
    desc: "Java · Spring · JPA · Cloud",
    badge: "REST",
    badgeColor: "#3d7030",
    dot: "#6db33f",
  },
];

function App() {
  const [activeModule, setActiveModule] = useState("graphql");
  const [open, setOpen] = useState(true);

  return (
    <div className="hub-root">
      <aside className={`hub-sidebar ${open ? "hub-sidebar--open" : "hub-sidebar--closed"}`}>
        <button className="hub-toggle" onClick={() => setOpen((o) => !o)}>
          {open ? "◀" : "▶"}
        </button>

        {open && (
          <div className="hub-sidebar-inner">
            <div className="hub-brand">
              <span className="hub-brand-text">BrawnedBrain</span>
            </div>

            <div className="hub-section-label">Modules</div>

            {MODULES.map((m) => (
              <button
                key={m.id}
                className={`hub-module-item${activeModule === m.id ? " hub-module-item--active" : ""}`}
                onClick={() => setActiveModule(m.id)}
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
      </aside>

      <div className="hub-content">
        {activeModule === "graphql" && (
          <ApolloProvider client={apolloClient}>
            <GraphQLApp />
          </ApolloProvider>
        )}
        {activeModule === "springboot" && <SpringBootApp />}
      </div>
    </div>
  );
}

export default App;
