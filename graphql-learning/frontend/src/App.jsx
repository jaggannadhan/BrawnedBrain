import { useState, useCallback } from "react";
import EmployeeList from "./components/EmployeeList";
import EmployeeForm from "./components/EmployeeForm";
import EditEmployeeModal from "./components/EditEmployeeModal";
import TeamList from "./components/TeamList";
import TeamForm from "./components/TeamForm";
import EditTeamModal from "./components/EditTeamModal";
import FlowDiagram from "./components/FlowDiagram";
import GraphQLTheory from "./components/GraphQLTheory";
import QueryPlayground from "./components/QueryPlayground";
import "./App.css";

const TABLES = [
  { key: "employees", label: "Employees" },
  { key: "teams", label: "Teams" },
];

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
  const [activeTable, setActiveTable] = useState("employees");
  const [operation, setOperation] = useState(null);
  const [flowKey, setFlowKey] = useState(0);
  const [editingRecord, setEditingRecord] = useState(null);

  const handleOperation = useCallback((op) => {
    setOperation(op);
    setFlowKey((k) => k + 1);
  }, []);

  const handleEdit = useCallback((record) => {
    setEditingRecord(record);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditingRecord(null);
  }, []);

  const tableLabel = TABLES.find((t) => t.key === activeTable)?.label || activeTable;

  return (
    <div className="layout">
      <div className="left-pane">
        <h1>
          <select
            className="table-selector"
            value={activeTable}
            onChange={(e) => { setActiveTable(e.target.value); setEditingRecord(null); }}
          >
            {TABLES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          {" "}Manager <span className="badge">GraphQL</span>
        </h1>

        <h2>Add {tableLabel.replace(/s$/, "")}</h2>
        {activeTable === "employees" && (
          <EmployeeForm onOperation={handleOperation} />
        )}
        {activeTable === "teams" && (
          <TeamForm onOperation={handleOperation} />
        )}

        <h2>{tableLabel}</h2>
        {activeTable === "employees" && (
          <EmployeeList onOperation={handleOperation} onEdit={handleEdit} />
        )}
        {activeTable === "teams" && (
          <TeamList onOperation={handleOperation} onEdit={handleEdit} />
        )}

        <div className="illustration-module">
          <FlowDiagram key={flowKey} operation={operation} />
        </div>
      </div>
      <div className="right-pane">
        <CollapsibleModule title="GraphQL Theory" defaultOpen={false}>
          <GraphQLTheory />
        </CollapsibleModule>
        <CollapsibleModule title="Query Playground" defaultOpen={true} fill>
          <QueryPlayground />
        </CollapsibleModule>
      </div>

      {editingRecord && activeTable === "employees" && (
        <EditEmployeeModal employee={editingRecord} onClose={handleEditClose} />
      )}
      {editingRecord && activeTable === "teams" && (
        <EditTeamModal team={editingRecord} onClose={handleEditClose} />
      )}
    </div>
  );
}

export default App;
