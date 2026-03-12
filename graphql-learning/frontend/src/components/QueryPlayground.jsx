import { useState, useRef, useEffect, useCallback } from "react";

const GRAPHQL_URL = "http://localhost:8000/graphql";

const DEFAULT_QUERY = `{
  employees(offset: 0, limit: 3) {
    items {
      id
      name
      designation
    }
    hasMore
  }
}`;

const SAMPLE_QUERIES = [
  {
    label: "List employees (paginated)",
    query: `{
  employees(offset: 0, limit: 5) {
    items { id name address designation team salary }
    nextOffset
    hasMore
  }
}`,
  },
  {
    label: "Get single employee",
    query: `{
  employee(id: 1) {
    id
    name
    designation
    team
    salary
  }
}`,
  },
  {
    label: "Search employees",
    query: `{
  searchEmployees(query: "engineer") {
    id
    name
    designation
    team
  }
}`,
  },
  {
    label: "Create employee",
    query: `mutation {
  createEmployee(input: {
    name: "Jane Doe"
    address: "123 Main St"
    designation: "Engineer"
    team: "Frontend"
    salary: 85000
  }) {
    id
    name
    designation
  }
}`,
  },
  {
    label: "Update employee",
    query: `mutation {
  updateEmployee(id: 1, input: {
    salary: 100000
    designation: "Senior Engineer"
  }) {
    id
    name
    salary
    designation
  }
}`,
  },
  {
    label: "Delete employee",
    query: `mutation {
  deleteEmployee(id: 1) {
    success
    message
  }
}`,
  },
];

// Schema knowledge for reverse-query inference
const SCHEMA = {
  employeeFields: ["id", "name", "address", "designation", "team", "salary"],
  paginatedFields: ["nextOffset", "hasMore"],
  deleteFields: ["success", "message"],
};

function inferQueryFromOutput(outputText) {
  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    return { error: "Invalid JSON — paste a valid JSON response shape." };
  }

  const data = parsed.data || parsed;

  if (data.employees) {
    const emp = data.employees;
    const itemFields = emp.items && emp.items.length > 0
      ? Object.keys(emp.items[0]).filter((k) => SCHEMA.employeeFields.includes(k))
      : SCHEMA.employeeFields;
    const metaFields = Object.keys(emp).filter((k) => k !== "items" && SCHEMA.paginatedFields.includes(k));
    return {
      query: `{
  employees(offset: 0, limit: 10) {
    items { ${itemFields.join(" ")} }
    ${metaFields.join("\n    ")}
  }
}`,
    };
  }

  if (data.employee) {
    const fields = Object.keys(data.employee).filter((k) => SCHEMA.employeeFields.includes(k));
    const idVal = data.employee.id || 1;
    return {
      query: `{
  employee(id: ${idVal}) {
    ${fields.join("\n    ")}
  }
}`,
    };
  }

  if (data.searchEmployees) {
    const arr = data.searchEmployees;
    const fields = arr.length > 0
      ? Object.keys(arr[0]).filter((k) => SCHEMA.employeeFields.includes(k))
      : SCHEMA.employeeFields;
    return {
      query: `{
  searchEmployees(query: "your_search_term") {
    ${fields.join("\n    ")}
  }
}`,
    };
  }

  if (data.createEmployee) {
    const fields = Object.keys(data.createEmployee).filter((k) => SCHEMA.employeeFields.includes(k));
    return {
      query: `mutation {
  createEmployee(input: {
    name: "Name"
    address: "Address"
    designation: "Title"
    team: "Team"
    salary: 0
  }) {
    ${fields.join("\n    ")}
  }
}`,
    };
  }

  if (data.updateEmployee) {
    const fields = Object.keys(data.updateEmployee).filter((k) => SCHEMA.employeeFields.includes(k));
    const idVal = data.updateEmployee.id || 1;
    return {
      query: `mutation {
  updateEmployee(id: ${idVal}, input: {
    name: "Updated Name"
  }) {
    ${fields.join("\n    ")}
  }
}`,
    };
  }

  if (data.deleteEmployee) {
    const fields = Object.keys(data.deleteEmployee).filter((k) => SCHEMA.deleteFields.includes(k));
    return {
      query: `mutation {
  deleteEmployee(id: 1) {
    ${fields.join("\n    ")}
  }
}`,
    };
  }

  return { error: `Could not infer query. Use a root key like "employees", "employee", "searchEmployees", "createEmployee", "updateEmployee", or "deleteEmployee".` };
}

function LineNumbers({ text }) {
  const lines = text.split("\n").length;
  return (
    <div className="qp-line-numbers" aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

export default function QueryPlayground() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [variables, setVariables] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("query"); // "query" or "reverse"
  const [reverseInput, setReverseInput] = useState("");
  const textareaRef = useRef(null);
  const lineRef = useRef(null);

  const syncScroll = useCallback(() => {
    if (lineRef.current && textareaRef.current) {
      lineRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const runQuery = async () => {
    setLoading(true);
    setError(null);
    setResult("");
    try {
      let vars = {};
      if (variables.trim()) {
        try {
          vars = JSON.parse(variables);
        } catch {
          setError("Variables must be valid JSON");
          setLoading(false);
          return;
        }
      }

      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: vars }),
      });

      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));

      if (json.errors) {
        setError(json.errors.map((e) => e.message).join("\n"));
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = () => {
    const { query: inferred, error: err } = inferQueryFromOutput(reverseInput);
    if (err) {
      setError(err);
    } else {
      setQuery(inferred);
      setMode("query");
      setError(null);
    }
  };

  const loadSample = (sample) => {
    setQuery(sample.query);
    setResult("");
    setError(null);
  };

  // Handle tab key in textarea
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      setQuery(val.substring(0, start) + "  " + val.substring(end));
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      runQuery();
    }
  };

  return (
    <div className="qp-container">
      {/* Toolbar */}
      <div className="qp-toolbar">
        <div className="qp-mode-toggle">
          <button
            className={`qp-mode-btn ${mode === "query" ? "active" : ""}`}
            onClick={() => setMode("query")}
          >
            Query → Result
          </button>
          <button
            className={`qp-mode-btn ${mode === "reverse" ? "active" : ""}`}
            onClick={() => setMode("reverse")}
          >
            Result → Query
          </button>
        </div>
        {mode === "query" && (
          <div className="qp-samples">
            <select
              onChange={(e) => {
                if (e.target.value !== "") loadSample(SAMPLE_QUERIES[e.target.value]);
                e.target.value = "";
              }}
              defaultValue=""
            >
              <option value="" disabled>Sample queries...</option>
              {SAMPLE_QUERIES.map((s, i) => (
                <option key={i} value={i}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {mode === "query" ? (
        /* Normal mode: query → result */
        <div className="qp-split">
          <div className="qp-editor-pane">
            <div className="qp-pane-label">QUERY</div>
            <div className="qp-editor">
              <LineNumbers text={query} />
              <textarea
                ref={textareaRef}
                className="qp-textarea"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onScroll={syncScroll}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder="Write your GraphQL query..."
              />
            </div>
            <div className="qp-run-bar">
              <button className="qp-run-btn" onClick={runQuery} disabled={loading}>
                {loading ? "Running..." : "▶ Run (Ctrl+Enter)"}
              </button>
            </div>
          </div>
          <div className="qp-result-pane">
            <div className="qp-pane-label">RESULT</div>
            <pre className={`qp-result ${error && !result ? "qp-result-error" : ""}`}>
              {error && !result ? error : result || "Run a query to see results..."}
            </pre>
          </div>
        </div>
      ) : (
        /* Reverse mode: result → query */
        <div className="qp-split">
          <div className="qp-editor-pane">
            <div className="qp-pane-label">DESIRED OUTPUT</div>
            <div className="qp-editor">
              <LineNumbers text={reverseInput} />
              <textarea
                className="qp-textarea"
                value={reverseInput}
                onChange={(e) => setReverseInput(e.target.value)}
                spellCheck={false}
                placeholder={`Paste your desired JSON output, e.g.:\n{\n  "data": {\n    "employee": {\n      "id": 1,\n      "name": "Alice",\n      "salary": 95000\n    }\n  }\n}`}
              />
            </div>
            <div className="qp-run-bar">
              <button className="qp-run-btn" onClick={handleReverse}>
                ← Generate Query
              </button>
            </div>
          </div>
          <div className="qp-result-pane">
            <div className="qp-pane-label">INFERRED QUERY</div>
            <pre className="qp-result">
              {query || "Paste a JSON output shape and click Generate..."}
            </pre>
          </div>
        </div>
      )}

      {error && result && <div className="qp-error-banner">{error}</div>}
    </div>
  );
}
