import { useState, useCallback } from "react";

const KEYWORDS = new Set([
  "def","class","return","if","else","elif","for","while","import","from","as",
  "with","try","except","finally","raise","and","or","not","in","is","lambda",
  "yield","async","await","pass","break","continue","global","nonlocal","del",
  "assert","True","False","self","cls","super","const","let","var","function",
  "new","this","typeof","instanceof","export","default","extends","static","of",
]);

const BUILTIN_TYPES = new Set([
  // Python primitives
  "int","str","float","bool","None","bytes","complex",
  // Python collections / typing
  "list","dict","tuple","set","frozenset",
  "Any","Optional","Union","List","Dict","Tuple","Set",
  "Type","Callable","Iterator","Generator","Awaitable",
  // GraphQL scalars
  "Int","Float","String","Boolean","ID",
  // JS/TS primitives
  "number","string","boolean","void","null","undefined","never","object",
]);

function isTypeName(word) {
  if (KEYWORDS.has(word)) return false;
  if (BUILTIN_TYPES.has(word)) return true;
  // PascalCase with at least one lowercase = user-defined type (EmployeeType, DataLoader…)
  // Excludes all-caps abbreviations like GET, POST, HTTP
  return /^[A-Z][a-zA-Z0-9]*$/.test(word) && /[a-z]/.test(word);
}

function expandCode(text) {
  const result = [];
  const re = /([A-Za-z_]\w*)|([^A-Za-z_]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) result.push({ type: isTypeName(m[1]) ? "type" : "code", text: m[1] });
    else      result.push({ type: "code", text: m[2] });
  }
  return result;
}

function tokenizeLine(line) {
  const tokens = [];
  let i = 0;
  let buf = "";

  while (i < line.length) {
    // Triple-quoted string (Python): """ or '''
    if (
      (line[i] === '"' || line[i] === "'") &&
      line[i + 1] === line[i] && line[i + 2] === line[i]
    ) {
      if (buf) { tokens.push({ type: "code", text: buf }); buf = ""; }
      const q = line[i].repeat(3);
      let str = q;
      i += 3;
      while (i < line.length) {
        if (line.slice(i, i + 3) === q) { str += q; i += 3; break; }
        str += line[i++];
      }
      tokens.push({ type: "string", text: str });
    }
    // Single or double quoted string
    else if (line[i] === '"' || line[i] === "'") {
      if (buf) { tokens.push({ type: "code", text: buf }); buf = ""; }
      const q = line[i];
      let str = q;
      i++;
      while (i < line.length) {
        if (line[i] === "\\" && i + 1 < line.length) { str += line[i] + line[i + 1]; i += 2; continue; }
        if (line[i] === q) { str += q; i++; break; }
        str += line[i++];
      }
      tokens.push({ type: "string", text: str });
    }
    // Comment: # or //
    else if (line[i] === "#" || (line[i] === "/" && line[i + 1] === "/")) {
      if (buf) { tokens.push({ type: "code", text: buf }); buf = ""; }
      tokens.push({ type: "comment", text: line.slice(i) });
      i = line.length;
    }
    // Opening paren — extract trailing identifier as function name
    else if (line[i] === "(") {
      const match = buf.match(/^([\s\S]*?)([A-Za-z_]\w*)$/);
      if (match) {
        if (match[1]) tokens.push({ type: "code", text: match[1] });
        tokens.push({ type: "function", text: match[2] });
      } else {
        if (buf) tokens.push({ type: "code", text: buf });
      }
      buf = "(";
      i++;
    }
    else {
      buf += line[i++];
    }
  }
  if (buf) tokens.push({ type: "code", text: buf });
  return tokens;
}

function renderToken(tok, key) {
  if (tok.type === "comment")  return <span key={key} style={{ color: "#6a9955" }}>{tok.text}</span>;
  if (tok.type === "string")   return <span key={key} style={{ color: "#ce9178" }}>{tok.text}</span>;
  if (tok.type === "function") return <span key={key} style={{ color: "#d3d3a4" }}>{tok.text}</span>;
  if (tok.type === "type")     return <span key={key} style={{ color: "#47af9a" }}>{tok.text}</span>;
  return <span key={key}>{tok.text}</span>;
}

function highlightCode(code) {
  return code.split("\n").map((line, i) => (
    <span key={i}>
      {tokenizeLine(line).flatMap((tok, j) =>
        tok.type === "code"
          ? expandCode(tok.text).map((sub, k) => renderToken(sub, `${j}-${k}`))
          : [renderToken(tok, j)]
      )}
      {"\n"}
    </span>
  ));
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const text = typeof children === "string" ? children : String(children);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="theory-code-wrap">
      <button className="theory-copy-btn" onClick={handleCopy} title="Copy code">
        {copied ? "✓ Copied" : "Copy"}
      </button>
      <pre className="theory-code">{highlightCode(text)}</pre>
    </div>
  );
}

const LEVELS = {
  beginner: { label: "Beginner", color: "#22c55e" },
  mid: { label: "Mid-level", color: "#f59e0b" },
  senior: { label: "Senior", color: "#ef4444" },
};

const SUBJECTS = [
  {
    id: "what",
    title: "What is GraphQL?",
    level: "beginner",
    content: (
      <>
        <p>
          GraphQL is a <strong>query language for APIs</strong> and a runtime
          that executes those queries against your data. Created by Facebook in
          2012 and open-sourced in 2015.
        </p>
        <p>The core idea: <em>the client decides what data it gets back.</em></p>
        <div className="theory-example">
          <div className="theory-example-pair">
            <div>
              <div className="theory-label">Client sends</div>
              <CodeBlock>{`{
  employee(id: 3) {
    name
    salary
  }
}`}</CodeBlock>
            </div>
            <div className="theory-arrow">→</div>
            <div>
              <div className="theory-label">Server returns</div>
              <CodeBlock>{`{
  "data": {
    "employee": {
      "name": "Alice",
      "salary": 95000
    }
  }
}`}</CodeBlock>
            </div>
          </div>
        </div>
        <ul className="theory-points">
          <li><strong>Single endpoint</strong> — all operations go through <code>/graphql</code></li>
          <li><strong>Typed schema</strong> — server publishes a schema describing every type, field, and relationship</li>
          <li><strong>No over-fetching</strong> — you only get the fields you ask for, nothing extra</li>
          <li><strong>No under-fetching</strong> — get related data in one request instead of chaining multiple calls</li>
        </ul>

        <div className="theory-concept">
          <h4>Schema (SDL)</h4>
          <p>
            Every GraphQL API is defined by a <strong>strongly-typed schema</strong> written in the
            Schema Definition Language (SDL). It acts as a <em>contract</em> between client and server,
            describing all available types, fields, and relationships.
          </p>
          <CodeBlock>{`type Employee {
  id: Int!
  name: String!
  designation: String
  team: Team          # relationship!
  salary: Float
}

type Team {
  id: Int!
  name: String!
  location: String
  employees: [Employee]  # reverse relationship
}`}</CodeBlock>
          <p className="theory-note">
            The <code>!</code> means non-nullable. The schema guarantees these fields always have a value.
          </p>
          <p className="theory-note">
            <strong>Code-first vs Schema-first:</strong> This SDL is shown for illustration.
            In our app, we use a <em>code-first</em> approach — the schema is defined in Python
            using Strawberry decorators (<code>@strawberry.type</code>, <code>@strawberry.field</code>),
            and Strawberry auto-generates the SDL at runtime. In a <em>schema-first</em> approach,
            you'd write this SDL in a <code>.graphql</code> file and then write resolvers to match it.
          </p>
        </div>

        <div className="theory-concept">
          <h4>Single Endpoint</h4>
          <p>
            Unlike REST which uses multiple URLs for different resources
            (<code>/employees</code>, <code>/teams/5</code>, <code>/employees/3/team</code>),
            GraphQL exposes a <strong>single HTTP endpoint</strong>:
          </p>
          <CodeBlock>{`POST /graphql    ← every operation goes here

# Want employees?    → POST /graphql
# Want teams?        → POST /graphql
# Want nested data?  → POST /graphql`}</CodeBlock>
          <p className="theory-note">
            The request <em>body</em> determines what data you get, not the URL.
          </p>
        </div>

        <div className="theory-concept">
          <h4>Resolvers</h4>
          <p>
            Each field in the schema is backed by a <strong>resolver function</strong> on the server.
            Resolvers fetch data from databases, microservices, or even existing REST APIs.
          </p>
          <CodeBlock>{`# In our app (Strawberry + SQLAlchemy):

@strawberry.type
class Query:
    @strawberry.field
    def employee(self, id: int) -> EmployeeType:
        db = next(get_db())
        e = db.query(Employee).filter(
            Employee.id == id
        ).first()
        return EmployeeType.from_model(e)

# Strawberry auto-resolves nested fields:
# employee.team → follows the SQLAlchemy relationship to Team
`}</CodeBlock>
          <p className="theory-note">
            When you query <code>{"{ employee(id:3) { team { name } } }"}</code>, two resolvers run:
            one for <code>employee</code>, then one for <code>team</code> on the result.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "diff",
    title: "REST vs GraphQL",
    level: "beginner",
    content: (
      <>
        <table className="theory-table">
          <thead>
            <tr>
              <th></th>
              <th>REST</th>
              <th>GraphQL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Endpoints</strong></td>
              <td>One per resource<br /><code>/employees</code>, <code>/employees/3</code>, <code>/teams</code></td>
              <td>Single endpoint<br /><code>/graphql</code></td>
            </tr>
            <tr>
              <td><strong>Data shape</strong></td>
              <td>Server decides what fields are returned</td>
              <td>Client picks exactly which fields it needs</td>
            </tr>
            <tr>
              <td><strong>HTTP methods</strong></td>
              <td>GET, POST, PUT, PATCH, DELETE</td>
              <td>Always POST (queries + mutations)</td>
            </tr>
            <tr>
              <td><strong>Fetching related data</strong></td>
              <td>Multiple round-trips<br /><code>GET /employees/3</code><br /><code>GET /teams/5</code></td>
              <td>One request, nested query<br /><code>{"{ employee(id:3) { name team { name } } }"}</code></td>
            </tr>
            <tr>
              <td><strong>Over-fetching</strong></td>
              <td>Common — endpoint returns all fields</td>
              <td>Impossible — you only get what you ask for</td>
            </tr>
            <tr>
              <td><strong>Versioning</strong></td>
              <td><code>/api/v1/</code>, <code>/api/v2/</code></td>
              <td>No versioning needed — add fields, deprecate old ones</td>
            </tr>
            <tr>
              <td><strong>Caching</strong></td>
              <td>Easy — HTTP caching by URL</td>
              <td>Harder — needs client-side cache (Apollo, Relay)</td>
            </tr>
            <tr>
              <td><strong>Error handling</strong></td>
              <td>HTTP status codes (404, 500...)</td>
              <td>Always 200 OK, errors in response body</td>
            </tr>
          </tbody>
        </table>

        <div className="theory-example">
          <div className="theory-label">Example: Get employee name + team name</div>
          <div className="theory-example-pair">
            <div>
              <div className="theory-sublabel">REST — 2 requests</div>
              <CodeBlock>{`GET /employees/3
→ { id:3, name:"Alice", teamId:5,
    salary:95000, address:"...", ... }

GET /teams/5
→ { id:5, name:"Backend", lead:"Bob",
    budget:500000, ... }`}</CodeBlock>
            </div>
            <div className="theory-vs">vs</div>
            <div>
              <div className="theory-sublabel">GraphQL — 1 request</div>
              <CodeBlock>{`POST /graphql
{ employee(id: 3) {
    name
    team { name }
  }
}
→ { name:"Alice", team:{ name:"Backend" } }`}</CodeBlock>
            </div>
          </div>
        </div>

        <div className="theory-use-cards">
          <div className="theory-use-card use-graphql">
            <h4>Use GraphQL when...</h4>
            <ul>
              <li>Multiple clients (web, mobile, TV) need <strong>different data shapes</strong> from the same API</li>
              <li>Your UI requires <strong>deeply nested or related data</strong> in one view</li>
              <li>You want to avoid <strong>over-fetching</strong> on bandwidth-constrained clients (mobile)</li>
              <li>Your API evolves rapidly and you want to <strong>add fields without versioning</strong></li>
              <li>You need <strong>real-time updates</strong> (GraphQL subscriptions)</li>
            </ul>
          </div>
          <div className="theory-use-card use-rest">
            <h4>Use REST when...</h4>
            <ul>
              <li>Your API is <strong>simple CRUD</strong> with straightforward resources</li>
              <li>You rely heavily on <strong>HTTP caching</strong> (CDNs, browser cache)</li>
              <li><strong>File uploads/downloads</strong> are a core use case</li>
              <li>Your team is more familiar with REST and the project is <strong>small/time-constrained</strong></li>
              <li>You need <strong>maximum simplicity</strong> — no schema, no resolver layer</li>
            </ul>
          </div>
        </div>
        <div className="theory-tldr">
          <strong>TL;DR:</strong> REST is simpler for basic APIs. GraphQL shines when your data is relational,
          your clients are diverse, or your frontend team wants full control over what the server returns.
        </div>
      </>
    ),
  },
  {
    id: "operations",
    title: "Operations",
    level: "beginner",
    content: (
      <>
        <p>GraphQL supports three primary types of operations:</p>

        <div className="theory-ops">
          <div className="theory-op-card">
            <h4>Queries</h4>
            <p className="theory-op-analogy">analogous to <code>GET</code> in REST</p>
            <p>Used for <strong>fetching data</strong> from the server. The client specifies exactly which fields it needs.</p>
            <CodeBlock>{`query {
  employees(limit: 5) {
    items {
      name
      team { name }
    }
  }
}`}</CodeBlock>
          </div>

          <div className="theory-op-card">
            <h4>Mutations</h4>
            <p className="theory-op-analogy">analogous to <code>POST / PUT / DELETE</code> in REST</p>
            <p>Used for <strong>creating, updating, or deleting</strong> data. Returns the modified data so the client can update its cache.</p>
            <CodeBlock>{`mutation {
  createEmployee(input: {
    name: "Alice"
    teamId: 4
  }) {
    id
    name
    team { name }
  }
}`}</CodeBlock>
          </div>

          <div className="theory-op-card">
            <h4>Subscriptions</h4>
            <p className="theory-op-analogy">real-time via <code>WebSockets</code></p>
            <p>Establishes a <strong>persistent connection</strong> to receive live updates when data changes — useful for chat apps, dashboards, notifications.</p>
            <CodeBlock>{`subscription {
  employeeCreated {
    id
    name
    team { name }
  }
}
# Server pushes data whenever
# a new employee is added`}</CodeBlock>
          </div>
        </div>

        <div className="theory-tldr">
          <strong>In this app:</strong> We use <strong>queries</strong> (employee list, search) and <strong>mutations</strong> (create, update, delete).
          Subscriptions would require WebSocket setup with Strawberry.
        </div>
      </>
    ),
  },
  {
    id: "strawberry",
    title: "Strawberry (Server)",
    level: "beginner",
    content: (
      <>
        <div className="theory-concept">
          <h4>What is Strawberry?</h4>
          <p>
            <strong>Strawberry</strong> is a Python library for building GraphQL APIs using a <em>code-first</em> approach.
            You define your schema with Python classes and type annotations — Strawberry generates the GraphQL schema automatically.
          </p>
        </div>

        <div className="theory-concept">
          <h4>Alternatives to Strawberry</h4>
          <table className="theory-table">
            <thead>
              <tr>
                <th>Library</th>
                <th>Language</th>
                <th>Approach</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Strawberry</strong></td>
                <td>Python</td>
                <td>Code-first</td>
                <td>Modern, type-hint based, FastAPI/Django integration. <em>(this app)</em></td>
              </tr>
              <tr>
                <td><strong>Graphene</strong></td>
                <td>Python</td>
                <td>Code-first</td>
                <td>Older, class-based. More boilerplate than Strawberry.</td>
              </tr>
              <tr>
                <td><strong>Ariadne</strong></td>
                <td>Python</td>
                <td>Schema-first</td>
                <td>Write SDL in <code>.graphql</code> files, bind resolvers manually.</td>
              </tr>
              <tr>
                <td><strong>Apollo Server</strong></td>
                <td>JavaScript</td>
                <td>Schema-first</td>
                <td>Most popular JS server. SDL + resolver functions.</td>
              </tr>
              <tr>
                <td><strong>Nexus</strong></td>
                <td>JavaScript</td>
                <td>Code-first</td>
                <td>Code-first for JS/TS, pairs with Prisma ORM.</td>
              </tr>
              <tr>
                <td><strong>gqlgen</strong></td>
                <td>Go</td>
                <td>Schema-first</td>
                <td>Generates Go code from SDL. Type-safe.</td>
              </tr>
              <tr>
                <td><strong>Juniper</strong></td>
                <td>Rust</td>
                <td>Code-first</td>
                <td>Macro-based, compile-time schema validation.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-concept">
          <h4>Core Decorators</h4>
          <CodeBlock>{`# @strawberry.type → defines a GraphQL type
@strawberry.type
class EmployeeType:
    id: int
    name: str
    team: TeamType | None  # nested relationship

# @strawberry.field → defines a query resolver
@strawberry.type
class Query:
    @strawberry.field
    def employees(self, limit: int = 10) -> list[EmployeeType]:
        ...  # fetch from DB

# @strawberry.mutation → defines a mutation
@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_employee(self, input: EmployeeInput) -> EmployeeType:
        ...  # insert into DB

# @strawberry.input → defines input types for mutations
@strawberry.input
class EmployeeInput:
    name: str
    team_id: int | None = None`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Automatic snake_case → camelCase</h4>
          <p>
            Strawberry automatically converts Python's <code>snake_case</code> naming to
            GraphQL's standard <code>camelCase</code>:
          </p>
          <CodeBlock>{`# Python (graphql_api.py)     →  GraphQL schema
def create_employee(...)      →  createEmployee(...)
def search_employees(...)     →  searchEmployees(...)
team_id: int                  →  teamId: Int
next_offset: int              →  nextOffset: Int
has_more: bool                →  hasMore: Boolean`}</CodeBlock>
          <p className="theory-note">
            This lets you write idiomatic Python while clients see standard GraphQL naming.
            Override with <code>{"@strawberry.field(name=\"custom_name\")"}</code> if needed.
          </p>
        </div>

        <div className="theory-concept">
          <h4>Integration with FastAPI</h4>
          <CodeBlock>{`# main.py
from strawberry.fastapi import GraphQLRouter

schema = strawberry.Schema(
    query=Query,
    mutation=Mutation
)
graphql_router = GraphQLRouter(schema)

app = FastAPI()
app.include_router(
    graphql_router, prefix="/graphql"
)
# → visit localhost:8000/graphql for
#   GraphiQL playground`}</CodeBlock>
          <p className="theory-note">
            Strawberry provides a built-in GraphiQL UI at the <code>/graphql</code> endpoint
            for testing queries interactively in the browser.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "apollo",
    title: "Apollo Client (Frontend)",
    level: "beginner",
    content: (
      <>
        <div className="theory-concept">
          <h4>What is Apollo Client?</h4>
          <p>
            <strong>Apollo Client</strong> is a JavaScript library for consuming GraphQL APIs from the frontend.
            It handles sending queries, caching results, and updating React components when data changes.
          </p>
        </div>

        <div className="theory-concept">
          <h4>Alternatives to Apollo Client</h4>
          <table className="theory-table">
            <thead>
              <tr>
                <th>Library</th>
                <th>Caching</th>
                <th>Bundle Size</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Apollo Client</strong></td>
                <td>Normalized</td>
                <td>~40 KB</td>
                <td>Most popular, rich ecosystem, DevTools. <em>(this app)</em></td>
              </tr>
              <tr>
                <td><strong>urql</strong></td>
                <td>Document-based</td>
                <td>~7 KB</td>
                <td>Lighter, simpler API. Good for smaller apps.</td>
              </tr>
              <tr>
                <td><strong>Relay</strong></td>
                <td>Normalized</td>
                <td>~30 KB</td>
                <td>Facebook's client. Powerful but opinionated — requires specific schema patterns (node IDs, connections).</td>
              </tr>
              <tr>
                <td><strong>TanStack Query + graphql-request</strong></td>
                <td>Query-key based</td>
                <td>~12 KB</td>
                <td>Not GraphQL-specific. Use familiar React Query patterns with a thin GraphQL fetch layer.</td>
              </tr>
              <tr>
                <td><strong>Plain fetch</strong></td>
                <td>None</td>
                <td>0 KB</td>
                <td>Just <code>fetch("/graphql", ...)</code>. No caching, no hooks. Used in our Query Playground.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-concept">
          <h4>Setup</h4>
          <CodeBlock>{`import { ApolloClient, InMemoryCache, HttpLink }
  from "@apollo/client/core";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost:8000/graphql"
  }),
  cache: new InMemoryCache(),
});

// Wrap your app:
<ApolloProvider client={client}>
  <App />
</ApolloProvider>`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Key Hooks</h4>
          <CodeBlock>{`// useQuery — auto-fetches on mount, re-renders on change
const { data, loading, error } = useQuery(
  GET_EMPLOYEES,
  { variables: { offset: 0, limit: 5 } }
);

// useLazyQuery — fetches on demand (e.g. search)
const [search, { data }] = useLazyQuery(SEARCH_EMPLOYEES);
search({ variables: { query: "Alice" } });

// useMutation — for create/update/delete
const [createEmployee] = useMutation(CREATE_EMPLOYEE, {
  refetchQueries: [GET_EMPLOYEES],
  // ↑ re-fetches the list after mutation
});
await createEmployee({
  variables: { input: { name: "Alice", teamId: 4 } }
});`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Caching</h4>
          <p>
            Apollo's <code>InMemoryCache</code> automatically caches query results.
            When a mutation returns updated data, Apollo updates the cache so
            other components re-render with fresh data — often <strong>without an extra network request</strong>.
          </p>
          <CodeBlock>{`// refetchQueries: re-fetch from server
useMutation(DELETE_EMPLOYEE, {
  refetchQueries: [GET_EMPLOYEES],
});

// Apollo also normalizes by __typename + id,
// so updating employee #3 auto-updates it
// everywhere in the cache.`}</CodeBlock>
          <p className="theory-note">
            <code>refetchQueries</code> is the simplest approach. For more control,
            you can use <code>cache.modify()</code> or <code>update</code> functions.
          </p>
        </div>
      </>
    ),
  },
  // ── Mid-level subjects ──
  {
    id: "fragments",
    title: "Fragments",
    level: "mid",
    content: (
      <>
        <div className="theory-concept">
          <h4>What are Fragments?</h4>
          <p>
            A <strong>fragment</strong> is a reusable unit of fields that you define once and
            spread into multiple queries or mutations. They keep your queries <strong>DRY</strong> —
            if you need the same set of fields in several places, define them once.
          </p>
          <CodeBlock>{`# Define once
fragment EmployeeFields on Employee {
  id
  name
  designation
  team { name }
  salary
}

# Reuse everywhere
query GetAll {
  employees { items { ...EmployeeFields } }
}

query GetOne($id: Int!) {
  employee(id: $id) { ...EmployeeFields }
}

mutation Create($input: EmployeeInput!) {
  createEmployee(input: $input) { ...EmployeeFields }
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>When to use Fragments</h4>
          <ul className="theory-points">
            <li><strong>Shared field sets</strong> — multiple queries/mutations return the same type with the same fields</li>
            <li><strong>Component-driven data</strong> — each UI component declares its own fragment describing exactly what data it needs (co-location pattern used by Relay)</li>
            <li><strong>Polymorphic types</strong> — use <em>inline fragments</em> to handle interfaces/unions:
              <code>{" ...on Manager { directReports } "}</code>
            </li>
          </ul>
        </div>

        <div className="theory-concept">
          <h4>In Apollo Client</h4>
          <CodeBlock>{`const EMPLOYEE_FIELDS = gql\`
  fragment EmployeeFields on Employee {
    id
    name
    designation
    team { name }
    salary
  }
\`;

const GET_EMPLOYEES = gql\`
  \${EMPLOYEE_FIELDS}
  query GetEmployees {
    employees {
      items { ...EmployeeFields }
    }
  }
\`;`}</CodeBlock>
          <p className="theory-note">
            Apollo uses fragments for cache normalization too — updating a fragment's
            fields in the cache updates every query that spreads it.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "pagination",
    title: "Pagination",
    level: "mid",
    content: (
      <>
        <p>
          GraphQL doesn't prescribe a pagination strategy — it's up to you. The two main
          approaches are <strong>offset-based</strong> and <strong>cursor-based</strong>.
        </p>

        <div className="theory-concept">
          <h4>Offset-based Pagination</h4>
          <p>Pass <code>offset</code> and <code>limit</code> — simple and familiar from SQL.</p>
          <CodeBlock>{`query {
  employees(offset: 20, limit: 10) {
    items { id name }
    hasMore
    nextOffset   # 30
  }
}

# Server:
db.query(Employee)
  .offset(20).limit(10).all()`}</CodeBlock>
          <ul className="theory-points">
            <li><strong>Pros:</strong> Easy to implement, supports "jump to page N"</li>
            <li><strong>Cons:</strong> Unreliable with dynamic data — if a row is inserted/deleted between pages, items shift and you skip or duplicate entries</li>
          </ul>
          <p className="theory-note">This is what our app uses — good enough for admin dashboards with moderate data.</p>
        </div>

        <div className="theory-concept">
          <h4>Cursor-based Pagination (Relay spec)</h4>
          <p>
            Each item has an opaque <strong>cursor</strong> (usually a base64-encoded ID or timestamp).
            The client passes <code>after</code> (cursor) and <code>first</code> (count) to get the next page.
          </p>
          <CodeBlock>{`query {
  employees(first: 10, after: "YXJyYXk6MTk=") {
    edges {
      cursor
      node { id name }
    }
    pageInfo {
      hasNextPage
      endCursor     # pass as "after" for next page
    }
  }
}`}</CodeBlock>
          <ul className="theory-points">
            <li><strong>Pros:</strong> Stable with inserts/deletes — cursor anchors to a specific item, not a position</li>
            <li><strong>Cons:</strong> No "jump to page N", more complex to implement, requires a sortable unique column</li>
          </ul>
        </div>

        <div className="theory-tldr">
          <strong>Rule of thumb:</strong> Use <strong>offset</strong> for internal tools and small datasets.
          Use <strong>cursors</strong> for feeds, infinite scroll, and any data that changes frequently.
        </div>
      </>
    ),
  },
  {
    id: "n-plus-one",
    title: "The N+1 Problem",
    level: "mid",
    content: (
      <>
        <div className="theory-concept">
          <h4>What is it?</h4>
          <p>
            When a query fetches a <strong>list</strong> and each item has a <strong>related field</strong> resolved
            separately, you get <strong>1 query</strong> for the list + <strong>N queries</strong> for each item's
            relationship = <strong>N+1 total database calls</strong>.
          </p>
          <CodeBlock>{`query {
  employees(limit: 50) {   # 1 SQL query → 50 employees
    items {
      name
      team { name }          # 50 SQL queries → 1 per employee's team!
    }
  }
}

# Total: 51 database queries for 1 GraphQL query 😱`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>How to detect it</h4>
          <ul className="theory-points">
            <li><strong>SQL logging</strong> — enable <code>echo=True</code> on your SQLAlchemy engine and watch for repeated queries</li>
            <li><strong>Apollo Tracing</strong> — Strawberry supports tracing extensions that show per-resolver timing</li>
            <li><strong>Monitoring</strong> — sudden spikes in DB queries relative to GraphQL requests</li>
          </ul>
        </div>

        <div className="theory-concept">
          <h4>Solutions</h4>
          <table className="theory-table">
            <thead>
              <tr>
                <th>Approach</th>
                <th>How it works</th>
                <th>When to use</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>DataLoader</strong></td>
                <td>Batches all related IDs and loads them in a single query. Strawberry has built-in DataLoader support.</td>
                <td>Standard solution — use this by default</td>
              </tr>
              <tr>
                <td><strong>Eager loading</strong></td>
                <td>SQLAlchemy <code>joinedload()</code> or <code>selectinload()</code> — fetches relations upfront in the initial query.</td>
                <td>When you know relations are always needed</td>
              </tr>
              <tr>
                <td><strong>Query lookahead</strong></td>
                <td>Inspect the GraphQL AST to see which relations the client requested, then eager-load only those.</td>
                <td>Advanced — maximum efficiency</td>
              </tr>
            </tbody>
          </table>
          <CodeBlock>{`# DataLoader example (Strawberry)
from strawberry.dataloader import DataLoader

async def load_teams(ids: list[int]) -> list[Team]:
    return db.query(Team).filter(Team.id.in_(ids)).all()

team_loader = DataLoader(load_fn=load_teams)

# Now 50 employees → 1 batch query for all team IDs
# Total: 2 queries instead of 51`}</CodeBlock>
        </div>

        <div className="theory-note">
          Our app avoids this because SQLAlchemy's <code>relationship()</code> with lazy loading
          hits the same session, but at scale you'd switch to DataLoader for explicit batching.
        </div>
      </>
    ),
  },
  {
    id: "interfaces-unions",
    title: "Interfaces & Unions",
    level: "mid",
    content: (
      <>
        <p>
          Both let a single field return <strong>multiple possible types</strong>, but they
          work differently.
        </p>

        <div className="theory-concept">
          <h4>Interfaces</h4>
          <p>
            An interface defines a set of <strong>shared fields</strong> that multiple types must implement.
            You can query the shared fields directly, and use inline fragments for type-specific fields.
          </p>
          <CodeBlock>{`interface Person {
  id: Int!
  name: String!
  email: String
}

type Employee implements Person {
  id: Int!
  name: String!
  email: String

  # Employee-specific
  salary: Float       
  team: Team
}

type Contractor implements Person {
  id: Int!
  name: String!
  email: String

  # Contractor-specific
  company: String     
  hourlyRate: Float
}

query {
  people {
    name              # shared field — no need to use inline fragments
    ... on Employee { salary team { name } }
    ... on Contractor { company hourlyRate }
  }
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Unions (Disparate Types)</h4>
          <p>
            An union is a list of types with <strong>no shared fields</strong>. You <em>must</em> use
            inline fragments to access any field.
          </p>
          <CodeBlock>{`union SearchResult = Employee | Team | Project

query {
  search(query: "Alice") {
    ... on Employee { name salary }
    ... on Team { name location }
    ... on Project { title deadline }
  }
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Key Differences</h4>
          <table className="theory-table">
            <thead>
              <tr><th></th><th>Interface</th><th>Union</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Shared fields</strong></td>
                <td>Yes — all implementing types must have them</td>
                <td>No — types can be completely unrelated</td>
              </tr>
              <tr>
                <td><strong>Direct field access</strong></td>
                <td>Can query shared fields without fragments</td>
                <td>Must always use inline fragments</td>
              </tr>
              <tr>
                <td><strong>Use case</strong></td>
                <td>Types that share a common shape (Person → Employee, Contractor)</td>
                <td>Search results, activity feeds — heterogeneous lists</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-concept">
          <h4>In Strawberry</h4>
          <CodeBlock>{`import strawberry
from typing import Annotated

# First, define the types that will form the union
@strawberry.type
class EmployeeType:
    id: int
    name: str
    salary: float | None

    @staticmethod
    def from_model(e) -> "EmployeeType":
        return EmployeeType(id=e.id, name=e.name, salary=e.salary)

@strawberry.type
class TeamType:
    id: int
    name: str
    location: str | None

    @staticmethod
    def from_model(t) -> "TeamType":
        return TeamType(id=t.id, name=t.name, location=t.location)

# Then declare the union
SearchResult = Annotated[
    EmployeeType | TeamType,
    strawberry.union("SearchResult")
]

@strawberry.type
class Query:
    @strawberry.field
    def search(self, query: str) -> list[SearchResult]:
        results = [
            EmployeeType.from_model(e)
            for e in db.query(Employee).filter(
              Employee.name.ilike(f"%{query}%")
            ).all()
        ]
        results += [
            TeamType.from_model(t)
            for t in db.query(Team).filter(
              Team.name.ilike(f"%{query}%")
            ).all()
        ]
        return results

query { 
  search(query: "alice") {
    ... on EmployeeType { name salary }
    ... on TeamType     { name location }
  } 
}`}</CodeBlock>
        </div>
      </>
    ),
  },
  {
    id: "error-handling",
    title: "Error Handling",
    level: "mid",
    content: (
      <>
        <div className="theory-concept">
          <h4>How GraphQL errors work</h4>
          <p>
            Unlike REST (which uses HTTP status codes), GraphQL <strong>always returns 200 OK</strong>.
            Errors appear in the response body alongside partial data:
          </p>
          <CodeBlock>{`{
  "data": {
    "employee": null
  },
  "errors": [
    {
      "message": "Employee with id 999 not found",
      "path": ["employee"],
      "locations": [{ "line": 2, "column": 3 }],
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}`}</CodeBlock>
          <p className="theory-note">
            Partial responses are a feature — if one field fails, the rest of the query still returns data.
          </p>
        </div>

        <div className="theory-concept">
          <h4>Strategies for production APIs</h4>
          <table className="theory-table">
            <thead>
              <tr><th>Strategy</th><th>How</th><th>When</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Throw exceptions</strong></td>
                <td>Raise errors in resolvers → appears in <code>errors[]</code> array</td>
                <td>Unexpected failures (DB down, auth errors)</td>
              </tr>
              <tr>
                <td><strong>Error unions</strong></td>
                <td>Return a union type: <code>Employee | NotFoundError | ValidationError</code></td>
                <td>Expected errors the client should handle (form validation, not found)</td>
              </tr>
              <tr>
                <td><strong>Result types</strong></td>
                <td>Return <code>{"{ success, message, data }"}</code> wrapper</td>
                <td>Simple APIs — like our <code>DeleteResult</code></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-concept">
          <h4>Error unions (typed errors)</h4>
          <CodeBlock>{`# Strawberry
@strawberry.type
class ValidationError:
    field: str
    message: str

@strawberry.type
class NotFoundError:
    message: str

CreateResult = strawberry.union(
    "CreateResult",
    [EmployeeType, ValidationError, NotFoundError]
)

# Client handles each case:
mutation {
  createEmployee(input: { name: "" }) {
    ... on EmployeeType { id name }
    ... on ValidationError { field message }
    ... on NotFoundError { message }
  }
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Production best practices</h4>
          <ul className="theory-points">
            <li><strong>Use <code>extensions.code</code></strong> — machine-readable error codes (<code>NOT_FOUND</code>, <code>UNAUTHORIZED</code>, <code>VALIDATION_ERROR</code>)</li>
            <li><strong>Hide internal details</strong> — never expose stack traces or SQL errors to clients</li>
            <li><strong>Log server-side</strong> — log the full error with trace, return a sanitized message to the client</li>
            <li><strong>Use error unions for expected failures</strong> — they're type-safe and self-documenting in the schema</li>
          </ul>
        </div>
      </>
    ),
  },
  {
    id: "inputs-variables-scalars",
    title: "Input Types, Variables & Custom Scalars",
    level: "mid",
    content: (
      <>
        <div className="theory-concept">
          <h4>Input Types</h4>
          <p>
            GraphQL uses dedicated <code>input</code> types for mutation arguments instead of reusing
            output types. This separation exists because:
          </p>
          <ul className="theory-points">
            <li><strong>Output types</strong> can have fields with resolvers, relationships, and computed values — these don't make sense as inputs</li>
            <li><strong>Input types</strong> define only plain data — what the client sends to the server</li>
            <li>You often need different shapes for create vs. update (e.g., <code>name</code> required on create, optional on update)</li>
          </ul>
          <CodeBlock>{`# Output type — can have resolvers, relationships
type Employee {
  id: Int!
  name: String!
  team: Team          # resolved via DB join
  salary: Float
}

# Input type — plain data only
input EmployeeInput {
  name: String!         # required for creation
  teamId: Int           # just the FK, not the full Team
  salary: Float
}

input EmployeeUpdateInput {
  name: String           # optional for updates
  teamId: Int
  salary: Float
}`}</CodeBlock>
          <p className="theory-note">
            In our app: <code>EmployeeInput</code> (create, name required) vs <code>EmployeeUpdateInput</code>
            (update, all fields optional) — same pattern in Strawberry with <code>@strawberry.input</code>.
          </p>
        </div>

        <div className="theory-concept">
          <h4>Variables</h4>
          <p>
            Instead of hardcoding values in queries, use <strong>variables</strong> — they're
            sent as a separate JSON object alongside the query string.
          </p>
          <CodeBlock>{`# ❌ Hardcoded — hard to reuse, no type safety
query {
  employee(id: 3) { name salary }
}

# ✅ Variables — reusable, typed, safe
export const GET_EMPLOYEES = query GetEmployee($id: Int!) {
  employee(id: $id) { name salary }
}
# Invocation
import { useMutation, useQuery } from "@apollo/client/react";
useQuery(GET_EMPLOYEES, { variables: { offset, limit })
`}</CodeBlock>
          <ul className="theory-points">
            <li><strong>Type safety</strong> — variables are validated against the schema before execution</li>
            <li><strong>Security</strong> — prevents GraphQL injection; variables are never interpolated into the query string</li>
            <li><strong>Caching</strong> — Apollo caches by query + variables, so the same query with different variables gets separate cache entries</li>
            <li><strong>Reusability</strong> — same query definition, different variable values</li>
          </ul>
        </div>

        <div className="theory-concept">
          <h4>Custom Scalars</h4>
          <p>
            GraphQL has 5 built-in scalars: <code>Int</code>, <code>Float</code>, <code>String</code>,
            <code> Boolean</code>, <code>ID</code>. Custom scalars let you define your own (e.g., <code>DateTime</code>,
            <code> Email</code>, <code>JSON</code>).
          </p>
          <CodeBlock>{`# In the schema
scalar DateTime
scalar Email

type Employee {
  name: String!
  email: Email
  hiredAt: DateTime
}

# In Strawberry — use NewType or custom class
import datetime
from typing import NewType

Email = strawberry.scalar(
    NewType("Email", str),
    description="RFC 5322 email address",
    serialize=lambda v: str(v),
    parse_value=lambda v: validate_email(v),
)

@strawberry.type
class EmployeeType:
    email: Email
    hired_at: datetime.datetime
    # Strawberry auto-maps datetime → DateTime scalar`}</CodeBlock>
          <p className="theory-note">
            Custom scalars handle <strong>serialization</strong> (server → client) and <strong>parsing</strong>
            (client → server). Use them to enforce domain-specific validation at the schema level.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "introspection",
    title: "Introspection",
    level: "mid",
    content: (
      <>
        <div className="theory-concept">
          <h4>What is Introspection?</h4>
          <p>
            GraphQL schemas are <strong>self-documenting</strong>. Introspection is a built-in feature
            that lets clients query the schema itself — discover types, fields, arguments, and descriptions
            at runtime.
          </p>
          <CodeBlock>{`# Ask the schema what types exist
{
  __schema {
    types { name kind }
  }
}

# Inspect a specific type
{
  __type(name: "Employee") {
    fields {
      name
      type { name kind }
    }
  }
}

# Result:
{
  "fields": [
    { "name": "id", "type": { "name": null, "kind": "NON_NULL" } },
    { "name": "name", "type": { "name": null, "kind": "NON_NULL" } },
    { "name": "team", "type": { "name": "Team", "kind": "OBJECT" } }
  ]
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>What uses Introspection?</h4>
          <ul className="theory-points">
            <li><strong>GraphiQL / Apollo Sandbox</strong> — the interactive playground at <code>/graphql</code> uses introspection for autocomplete and docs</li>
            <li><strong>Code generation</strong> — tools like <code>graphql-codegen</code> introspect your schema to generate TypeScript types</li>
            <li><strong>Apollo Client DevTools</strong> — inspects the schema for cache visualization</li>
            <li><strong>IDE plugins</strong> — provide autocomplete in <code>.graphql</code> files</li>
          </ul>
        </div>

        <div className="theory-concept">
          <h4>Should it be enabled in production?</h4>
          <table className="theory-table">
            <thead>
              <tr><th></th><th>Enable</th><th>Disable</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>When</strong></td>
                <td>Development, internal APIs, public APIs where schema discovery is a feature</td>
                <td>Public-facing production APIs where you don't want to expose your full schema</td>
              </tr>
              <tr>
                <td><strong>Risk</strong></td>
                <td>Attackers can map your entire API surface — types, fields, mutations</td>
                <td>Breaks tooling that depends on introspection (GraphiQL, codegen)</td>
              </tr>
            </tbody>
          </table>
          <CodeBlock>{`# Strawberry — disable in production
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
)

# Use middleware or config to disable:
# - Strawberry: custom extension to block __schema/__type
# - Apollo Server: introspection: false
# - Production alternative: persist a schema.json artifact
#   at build time for tooling, disable runtime introspection`}</CodeBlock>
          <p className="theory-note">
            <strong>Best practice:</strong> Enable in dev/staging, disable in production for public APIs.
            For internal APIs behind auth, leaving it enabled is usually fine.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "file-uploads",
    title: "File Uploads",
    level: "mid",
    content: (
      <>
        <div className="theory-concept">
          <h4>The problem</h4>
          <p>
            GraphQL's transport is JSON — there's no native way to send binary files.
            The spec doesn't cover file uploads, so several community patterns exist.
          </p>
        </div>

        <div className="theory-concept">
          <h4>Common approaches</h4>
          <table className="theory-table">
            <thead>
              <tr><th>Approach</th><th>How</th><th>Pros / Cons</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Multipart upload (graphql-upload)</strong></td>
                <td>Uses the <a href="https://github.com/jaydenseric/graphql-multipart-request-spec">multipart request spec</a> to send files alongside the GraphQL operation in a single <code>multipart/form-data</code> request.</td>
                <td>Single request. Supported by Apollo Server, Strawberry. Can be tricky with CDNs/proxies.</td>
              </tr>
              <tr>
                <td><strong>Presigned URL (recommended)</strong></td>
                <td>1. Mutation returns a presigned upload URL (S3, GCS)<br/>2. Client uploads directly to storage<br/>3. Client sends a second mutation with the file URL</td>
                <td>Keeps GraphQL layer thin. Scales better. Works with any CDN. Two-step flow.</td>
              </tr>
              <tr>
                <td><strong>Base64 encoding</strong></td>
                <td>Encode the file as a base64 string and send it as a <code>String</code> variable.</td>
                <td>Simple but ~33% size overhead. Only viable for small files (avatars, thumbnails).</td>
              </tr>
              <tr>
                <td><strong>Separate REST endpoint</strong></td>
                <td>Use a traditional <code>POST /upload</code> endpoint for files, keep GraphQL for data.</td>
                <td>Pragmatic. Use the right tool for each job.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-concept">
          <h4>Multipart upload in Strawberry</h4>
          <CodeBlock>{`from strawberry.file_uploads import Upload

@strawberry.input
class ProfileInput:
    name: str
    avatar: Upload  # file handle

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def update_profile(
        self, input: ProfileInput
    ) -> EmployeeType:
        contents = await input.avatar.read()
        # save to disk / S3
        ...`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Presigned URL flow</h4>
          <CodeBlock>{`# Step 1: Get upload URL
mutation {
  requestUploadUrl(
    filename: "avatar.jpg"
    contentType: "image/jpeg"
  ) {
    uploadUrl    # presigned S3 URL
    fileKey      # "uploads/abc123.jpg"
  }
}

# Step 2: Client uploads directly to S3
PUT <uploadUrl> with file body

# Step 3: Save reference in GraphQL
mutation {
  updateEmployee(id: 3, input: {
    avatarUrl: "uploads/abc123.jpg"
  }) { id name }
}`}</CodeBlock>
          <p className="theory-note">
            The presigned URL approach is the most common in production — it offloads
            bandwidth from your GraphQL server to a dedicated storage service.
          </p>
        </div>
      </>
    ),
  },
  // ── Senior-level subjects ──
  {
    id: "dataloader-at-scale",
    title: "DataLoader at Scale",
    level: "senior",
    content: (
      <>
        {/* ── Step 1: The problem ── */}
        <div className="theory-concept">
          <h4>1. The problem — N+1 queries</h4>
          <p>
            When you fetch a list of employees and each one resolves its <code>team</code>,
            you get <strong>1 + N</strong> database calls — one to list employees, then one per employee to fetch their team.
          </p>
          <CodeBlock>{`# Without DataLoader — N+1 in action
# Fetching 50 employees fires 51 queries:
#   SELECT * FROM employees LIMIT 50          ← 1 query
#   SELECT * FROM teams WHERE id = 3          ← 1 per employee
#   SELECT * FROM teams WHERE id = 7          ← 1 per employee
#   SELECT * FROM teams WHERE id = 3          ← duplicate! cached? nope.
#   ...                                        ← 49 more

@staticmethod
def from_model(e: Employee) -> "EmployeeType":
    return EmployeeType(
        ...
        team=TeamType.from_model(e.team)  # ← hits DB right here, every time
    )`}</CodeBlock>
          <p className="theory-note">
            SQLAlchemy's <code>relationship()</code> lazy-loads <code>e.team</code> on first access —
            so each <code>e.team</code> in the loop fires a separate <code>SELECT</code>.
          </p>
        </div>

        {/* ── Step 2: Why team must become an async resolver ── */}
        <div className="theory-concept">
          <h4>2. Why <code>team</code> must become an async resolver</h4>
          <p>
            The fix requires <code>team</code> to be resolved <strong>lazily and on demand</strong> — not eagerly at object
            construction. That means converting it from a plain field to a <code>@strawberry.field</code> method.
          </p>
          <table className="theory-table">
            <thead>
              <tr><th></th><th>Plain field</th><th>Async resolver</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>When does it run?</strong></td>
                <td>Always, inside <code>from_model</code></td>
                <td>Only if the client requests it</td>
              </tr>
              <tr>
                <td><strong>Who calls it?</strong></td>
                <td>You, manually</td>
                <td>Strawberry, per field resolution</td>
              </tr>
              <tr>
                <td><strong>Has access to <code>info</code>?</strong></td>
                <td>No</td>
                <td>Yes — that's where the loader lives</td>
              </tr>
              <tr>
                <td><strong>Supports DataLoader?</strong></td>
                <td>No</td>
                <td>Yes</td>
              </tr>
            </tbody>
          </table>
          <CodeBlock>{`# BEFORE — plain field, always populated
@strawberry.type
class EmployeeType:
    team: TeamType | None          # value must exist at construction time

# AFTER — async resolver, called only when client requests team { ... }
@strawberry.type
class EmployeeType:
    team_id: int | None            # just store the FK

    @strawberry.field
    async def team(self, info: strawberry.types.Info) -> TeamType | None:
        if self.team_id is None:
            return None
        return await info.context["team_loader"].load(self.team_id)
        # ↑ doesn't fire a query yet — just registers the ID with the loader`}</CodeBlock>
          <p className="theory-note">
            <code>info</code> is auto-injected by Strawberry into every field resolver.
            It carries <code>info.context</code> — the dict returned by <code>get_context()</code> — along with
            schema, path, and field metadata.
          </p>
        </div>

        {/* ── Step 3: How DataLoader batches ── */}
        <div className="theory-concept">
          <h4>3. How DataLoader batches — the internal mechanism</h4>
          <p>
            Every <code>.load(id)</code> call is a <em>promise</em>. DataLoader collects all of them
            during the current event-loop tick, then fires the batch function exactly once.
          </p>
          <CodeBlock>{`# Event-loop tick while resolving 50 employees:
#
#   employee[0].team resolver  →  loader.load(3)   ← queued
#   employee[1].team resolver  →  loader.load(7)   ← queued
#   employee[2].team resolver  →  loader.load(3)   ← deduplicated (same id)
#   ...
#   employee[49].team resolver →  loader.load(12)  ← queued
#
# End of tick — DataLoader fires ONE call:
#   batch_load_teams([3, 7, 12, ...])
#     → SELECT * FROM teams WHERE id IN (3, 7, 12, ...)
#     → returns [team3, team7, team12, ...]  ← MUST match input order`}</CodeBlock>
          <CodeBlock>{`async def batch_load_teams(ids: list[int]) -> list[TeamType | None]:
    teams = db.query(Team).filter(Team.id.in_(ids)).all()
    team_map = {t.id: t for t in teams}
    # CRITICAL: result list must be in the same order as input ids
    # Include None for any id that had no matching row
    return [team_map.get(id) for id in ids]

loader = DataLoader(load_fn=batch_load_teams)`}</CodeBlock>
          <p className="theory-note">
            The <strong>order guarantee</strong> is the most common pitfall — if you return results
            in DB order instead of input order, employees get the wrong team.
          </p>
        </div>

        {/* ── Step 4: Full integration in our app ── */}
        <div className="theory-concept">
          <h4>4. Full integration — in our app</h4>
          <p>
            Our app uses <strong>sync SQLAlchemy</strong>. Since DataLoader is async, we wrap the DB
            call in <code>run_in_executor</code> so it doesn't block the event loop.
          </p>
          <CodeBlock>{`# graphql_api.py
import asyncio
import strawberry
from strawberry.dataloader import DataLoader
from strawberry.fastapi import GraphQLRouter
from database import Employee, Team, SessionLocal

# ── TeamType (unchanged) ──────────────────────────────────
@strawberry.type
class TeamType:
    id: int
    name: str
    location: str | None
    budget: float | None
    head: str | None

    @staticmethod
    def from_model(d: Team) -> "TeamType":
        return TeamType(
            id=int(d.id), name=str(d.name),
            location=str(d.location) if d.location else None,
            budget=float(d.budget) if d.budget else None,
            head=str(d.head) if d.head else None,
        )

# ── Batch function ────────────────────────────────────────
async def batch_load_teams(ids: list[int]) -> list[TeamType | None]:
    def _sync_fetch():
        db = SessionLocal()
        try:
            teams = db.query(Team).filter(Team.id.in_(ids)).all()
            team_map = {t.id: TeamType.from_model(t) for t in teams}
            return [team_map.get(id) for id in ids]   # order must match ids
        finally:
            db.close()
    return await asyncio.get_event_loop().run_in_executor(None, _sync_fetch)

# ── EmployeeType — team is now an async resolver ──────────
@strawberry.type
class EmployeeType:
    id: int
    name: str
    address: str | None
    designation: str | None
    team_id: int | None          # store FK, not the resolved object
    salary: float | None

    @strawberry.field
    async def team(self, info: strawberry.types.Info) -> TeamType | None:
        if self.team_id is None:
            return None
        return await info.context["team_loader"].load(self.team_id)

    @staticmethod
    def from_model(e: Employee) -> "EmployeeType":
        return EmployeeType(
            id=int(e.id), name=str(e.name),
            address=str(e.address) if e.address else None,
            designation=str(e.designation) if e.designation else None,
            team_id=int(e.team_id) if e.team_id else None,
            salary=float(e.salary) if e.salary else None,
            # ← team no longer populated here; async resolver handles it
        )

# ── Context — fresh loader per request ───────────────────
# get_context() is called automatically by Strawberry once per HTTP request.
# Never define it in main.py or any other file — only here, next to the router.
async def get_context() -> dict:
    return {
        "team_loader": DataLoader(load_fn=batch_load_teams),
    }

# ── Schema & router ───────────────────────────────────────
schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema, context_getter=get_context)
#                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^
#  Strawberry registers get_context as a FastAPI dependency.
#  It fires once per request → result goes into info.context`}</CodeBlock>
          <p><strong>main.py — no changes needed</strong></p>
          <CodeBlock>{`from graphql_api import graphql_router   # same import, nothing else changes
app.include_router(graphql_router, prefix="/graphql")`}</CodeBlock>
          <p className="theory-note">
            Before: 50 employees = <strong>51 queries</strong>. After: <strong>2 queries</strong> — one for
            employees, one batched <code>WHERE id IN (...)</code>. If the client doesn't request <code>team</code>
            at all, the loader <strong>never fires</strong>.
          </p>
        </div>

        {/* ── Step 5: DataLoader vs Eager loading ── */}
        <div className="theory-concept">
          <h4>5. DataLoader vs. Eager loading</h4>
          <CodeBlock>{`# Eager loading — always joins, even if client didn't request the relation
db.query(Employee).options(
    joinedload(Employee.team)   # always fetched, no matter the query
).all()

# DataLoader — demand-driven
# Client asks { employees { name } }           → team loader never fires
# Client asks { employees { name team { name } } } → 1 batched query`}</CodeBlock>
          <p className="theory-note">
            Eager loading is simpler but wastes work when relations aren't requested.
            DataLoader respects GraphQL's "only fetch what's asked for" principle.
          </p>
        </div>

        {/* ── Step 6: Scaling considerations ── */}
        <div className="theory-concept">
          <h4>6. Scaling considerations</h4>
          <table className="theory-table">
            <thead>
              <tr><th>Challenge</th><th>Solution</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Loader per request</strong></td>
                <td>Always create a new DataLoader instance per request — sharing across requests leaks data between users and causes stale cache</td>
              </tr>
              <tr>
                <td><strong>Nested batching</strong></td>
                <td>If <code>Employee → Team → Company</code>, each level needs its own loader. DataLoader batches per tick, so nested resolvers batch at their respective depth.</td>
              </tr>
              <tr>
                <td><strong>Large batch sizes</strong></td>
                <td>Set <code>max_batch_size</code> to avoid <code>WHERE id IN (...10000 ids...)</code> — chunk into multiple queries</td>
              </tr>
              <tr>
                <td><strong>Cache invalidation</strong></td>
                <td>DataLoader's cache is request-scoped by default (no cross-request staleness). For shared caching, layer Redis/Memcached on top.</td>
              </tr>
              <tr>
                <td><strong>Error handling</strong></td>
                <td>If one ID fails, return an <code>Error</code> for that index — other results still resolve. Don't let one failure break the entire batch.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "federation-vs-stitching",
    title: "Federation vs Schema Stitching",
    level: "senior",
    content: (
      <>
        {/* ── Step 1: The problem ── */}
        <div className="theory-concept">
          <h4>1. The problem — composing multiple services</h4>
          <p>
            As your backend grows, different teams own different domains — employees, teams, payroll, auth.
            Each might run its own GraphQL service. But clients want <strong>one unified graph</strong>.
            You need a way to compose them.
          </p>
          <CodeBlock>{`# Without composition — clients must query each service separately:
#   GET http://employees:4001/graphql  → { employee { name salary } }
#   GET http://teams:4002/graphql      → { team { name location } }

# With composition — one endpoint, one query:
#   GET http://gateway/graphql
#   → { employee(id: 1) { name salary team { name location } } }`}</CodeBlock>
          <p>
            The two main approaches to build this composition layer are <strong>Schema Stitching</strong> (older)
            and <strong>Apollo Federation</strong> (modern standard).
          </p>
        </div>

        {/* ── Step 2: Architecture overview ── */}
        <div className="theory-concept">
          <h4>2. Architecture — gateway + subgraphs</h4>
          <p>
            Both approaches share the same high-level shape: a <strong>gateway/router</strong> sits in front
            of multiple <strong>subgraph services</strong>. The difference is <em>who</em> owns the composition logic.
          </p>
          <CodeBlock>{`Client
  ↓
Apollo Gateway / Router      ← the "composer" — one public endpoint
  ↓               ↓
Employee Service   Team Service
(Strawberry)       (any GraphQL server)

# Schema Stitching → gateway owns ALL merge logic
# Apollo Federation → each subgraph declares its own ownership rules`}</CodeBlock>
        </div>

        {/* ── Step 3: Schema Stitching ── */}
        <div className="theory-concept">
          <h4>3. Schema Stitching — centralized composition</h4>
          <p>
            The original approach: a gateway merges multiple GraphQL schemas into one by
            delegating fields to the appropriate subschema. <strong>All merge logic lives in the gateway.</strong>
          </p>
          <CodeBlock>{`# Gateway config (graphql-tools, JS):
const gateway = stitchSchemas({
  subschemas: [
    { schema: employeeSchema, url: "http://employees:4001/graphql" },
    { schema: teamSchema,     url: "http://teams:4002/graphql" },
  ],
  typeMergingConfig: {
    Employee: {
      selectionSet: "{ id }",   // gateway fetches id as the join key
      fieldName: "employee",    // then calls employee(id: ...) on employee service
    }
  }
});`}</CodeBlock>
          <ul className="theory-points">
            <li><strong>Pro:</strong> Works with any GraphQL server — subgraphs need no special directives</li>
            <li><strong>Con:</strong> Gateway becomes a bottleneck — every schema change requires a gateway update. Tight coupling.</li>
          </ul>
        </div>

        {/* ── Step 4: Apollo Federation ── */}
        <div className="theory-concept">
          <h4>4. Apollo Federation — distributed composition</h4>
          <p>
            A <strong>specification</strong> (not just a tool) where each subgraph declares what it owns
            using special directives. The router auto-composes without any manual merge config.
            Three things the spec requires every subgraph to support:
          </p>
          <ul className="theory-points">
            <li><code>@key</code> directive — marks which field uniquely identifies a type across services</li>
            <li><code>_entities</code> query — the router uses this to fetch objects by key from a subgraph</li>
            <li><code>_service</code> query — exposes the subgraph's SDL so the router can auto-compose</li>
          </ul>
          <CodeBlock>{`# Employee subgraph — owns Employee type
type Employee @key(fields: "id") {
  id: ID!
  name: String!
  salary: Float
}

# Team subgraph — owns Team, and adds team field to Employee
type Team @key(fields: "id") {
  id: ID!
  name: String!
  location: String
}

# Team subgraph extends Employee (owned by another service)
extend type Employee @key(fields: "id") {
  id: ID! @external       # @external = "this field comes from another subgraph"
  team: Team              # Team subgraph adds this field
}`}</CodeBlock>
          <ul className="theory-points">
            <li><strong>Pro:</strong> Subgraphs deploy independently — no gateway changes needed when a service evolves its schema</li>
            <li><strong>Con:</strong> Requires federation-aware servers (Apollo Server, Strawberry federation plugin)</li>
          </ul>
        </div>

        {/* ── Step 5: Request flow ── */}
        <div className="theory-concept">
          <h4>5. How a federated query actually executes</h4>
          <CodeBlock>{`# Client sends: { employee(id: 1) { name team { name } } }

# Step 1 — Router splits the query by ownership:
#   "name"        → employee service owns it
#   "team { name }" → team service owns it

# Step 2 — Router calls employee service:
#   query { employee(id: 1) { name id } }
#                                ^^^ id fetched too — it's the @key join field
#   Returns: { name: "Alice", id: "1" }

# Step 3 — Router calls team service _entities with the key:
#   { _entities(representations: [{ __typename: "Employee", id: "1" }]) {
#       ... on Employee { team { name } }
#   }}
#   Team service calls resolve_reference(id="1") → fetches team

# Step 4 — Router merges both results → returns to client:
#   { employee: { name: "Alice", team: { name: "Engineering" } } }`}</CodeBlock>
        </div>

        {/* ── Step 6: Strawberry Federation ── */}
        <div className="theory-concept">
          <h4>6. Strawberry Federation — Python implementation</h4>
          <CodeBlock>{`# employee_service/schema.py
import strawberry
from strawberry.federation.schema_directives import Key

@strawberry.federation.type(keys=[Key(fields="id")])
class Employee:
    id: strawberry.ID
    name: str
    salary: float

@strawberry.type
class Query:
    @strawberry.field
    def employee(self, id: strawberry.ID) -> Employee | None:
        return get_employee_from_db(id)

schema = strawberry.federation.Schema(query=Query, enable_federation_2=True)`}</CodeBlock>

          <CodeBlock>{`# team_service/schema.py — extends Employee from the employee service
import strawberry
from strawberry.federation.schema_directives import Key, External

@strawberry.federation.type(keys=[Key(fields="id")])
class Employee:
    id: strawberry.ID       # @key field — owned by employee service

    @classmethod
    def resolve_reference(cls, id: strawberry.ID) -> "Employee":
        # Router calls this when it needs to resolve Employee fields
        # from THIS service, given only the id from the other service.
        return Employee(id=id, team=get_team_for_employee(id))

    team: "Team"            # team service adds this field to Employee

@strawberry.federation.type(keys=[Key(fields="id")])
class Team:
    id: strawberry.ID
    name: str
    location: str | None

schema = strawberry.federation.Schema(query=Query, enable_federation_2=True)`}</CodeBlock>
          <p className="theory-note">
            <code>resolve_reference</code> is the federation equivalent of a resolver — it's called by the
            router when it needs to "re-hydrate" an entity from just its <code>@key</code> value.
            You define it once per federated type; the router handles calling it.
          </p>
        </div>

        {/* ── Step 7: Comparison ── */}
        <div className="theory-concept">
          <h4>7. Side-by-side comparison</h4>
          <table className="theory-table">
            <thead>
              <tr><th></th><th>Schema Stitching</th><th>Apollo Federation</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Composition logic lives in</strong></td>
                <td>Gateway (centralized)</td>
                <td>Subgraphs (distributed)</td>
              </tr>
              <tr>
                <td><strong>Type ownership</strong></td>
                <td>Gateway resolves conflicts</td>
                <td>Each subgraph owns its types via <code>@key</code></td>
              </tr>
              <tr>
                <td><strong>Independent deploys</strong></td>
                <td>Gateway must be updated on schema changes</td>
                <td>Subgraphs deploy independently</td>
              </tr>
              <tr>
                <td><strong>Cross-service types</strong></td>
                <td>Manual merge config in gateway</td>
                <td><code>@key</code>, <code>@external</code>, <code>resolve_reference</code></td>
              </tr>
              <tr>
                <td><strong>Tooling</strong></td>
                <td>graphql-tools (JS)</td>
                <td>Apollo Router (Rust), Strawberry federation plugin</td>
              </tr>
              <tr>
                <td><strong>Best for</strong></td>
                <td>Small teams, few services, migrating from monolith</td>
                <td>Large orgs, many teams, independent deployment</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-tldr">
          <strong>TL;DR:</strong> Use <strong>Federation</strong> when multiple teams own different parts
          of the graph and need to deploy independently. Use <strong>Stitching</strong> for simpler setups
          or when you can't modify subgraph schemas. Most new projects choose Federation.
        </div>
      </>
    ),
  },
  {
    id: "query-security-performance",
    title: "Query Cost Analysis, Depth Limiting & Persisted Queries",
    level: "senior",
    content: (
      <>
        <p>
          GraphQL's flexibility is a double-edged sword — clients can craft <strong>expensive</strong> or
          <strong>deeply nested</strong> queries that overload your server. These techniques protect against abuse.
        </p>

        <div className="theory-concept">
          <h4>Depth Limiting</h4>
          <p>
            Reject queries that nest beyond a maximum depth, preventing recursive attacks.
          </p>
          <CodeBlock>{`# Malicious query — infinite depth
{
  employee(id: 1) {
    team {
      members {
        team {
          members {
            team { ... }  # keeps going
          }
        }
      }
    }
  }
}

# Strawberry — set max depth
schema = strawberry.Schema(
    query=Query,
    extensions=[
        DepthLimitExtension(max_depth=10)
    ]
)`}</CodeBlock>
          <p className="theory-note">
            A depth of <strong>10-15</strong> is typical. Set it based on your deepest legitimate query.
          </p>
        </div>

        <div className="theory-concept">
          <h4>Query Cost Analysis</h4>
          <p>
            Assign a <strong>cost</strong> to each field and reject queries that exceed a budget.
            List fields are multiplied by their <code>limit</code> argument.
          </p>
          <CodeBlock>{`# Cost calculation example:
# employees(limit: 50) → cost = 50
#   name               → cost = 50 × 1 = 50
#   team               → cost = 50 × 1 = 50
#     members(limit: 20) → cost = 50 × 20 = 1000
#       name            → cost = 1000 × 1 = 1000
# Total: 2150

# Reject if total > max_cost (e.g. 5000)

# Strawberry custom extension:
class CostAnalysis(strawberry.extensions.Extension):
    def on_validate(self):
        cost = calculate_cost(self.execution_context.query)
        if cost > MAX_COST:
            raise ValueError(
                f"Query cost {cost} exceeds max {MAX_COST}"
            )`}</CodeBlock>
          <table className="theory-table">
            <thead>
              <tr><th>Field type</th><th>Typical cost</th></tr>
            </thead>
            <tbody>
              <tr><td>Scalar field</td><td>0 or 1</td></tr>
              <tr><td>Object field</td><td>1</td></tr>
              <tr><td>List field</td><td>limit × child cost</td></tr>
              <tr><td>Mutation</td><td>10 (higher base cost)</td></tr>
            </tbody>
          </table>
        </div>

        <div className="theory-concept">
          <h4>Persisted Queries</h4>
          <p>
            Instead of sending the full query string on every request, the client sends a <strong>hash</strong>.
            The server looks up the hash in a registry and executes the pre-stored query.
          </p>
          <CodeBlock>{`# Without persisted queries:
POST /graphql
{ "query": "{ employees { items { name team { name } } } }" }

# With persisted queries:
POST /graphql
{ "extensions": {
    "persistedQuery": {
      "sha256Hash": "abc123def456..."
    }
  }
}

# Server looks up hash → executes stored query`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Why use Persisted Queries?</h4>
          <table className="theory-table">
            <thead>
              <tr><th>Benefit</th><th>How</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Security</strong></td>
                <td>Only pre-approved queries can run — blocks arbitrary/malicious queries entirely</td>
              </tr>
              <tr>
                <td><strong>Performance</strong></td>
                <td>Smaller payloads (hash vs full query), skip parsing/validation on server</td>
              </tr>
              <tr>
                <td><strong>CDN caching</strong></td>
                <td>GET requests with hash as query param → cacheable at the CDN edge</td>
              </tr>
              <tr>
                <td><strong>Bandwidth</strong></td>
                <td>Mobile clients save data by not sending full query strings</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-concept">
          <h4>Automatic Persisted Queries (APQ)</h4>
          <CodeBlock>{`# Apollo Client sends hash first
# If server doesn't have it → client retries with full query
# Server stores it → next time, hash is enough

# Apollo Client setup:
import { createPersistedQueryLink } from
  "@apollo/client/link/persisted-queries";
import { sha256 } from "crypto-hash";

const link = createPersistedQueryLink({ sha256 })
  .concat(httpLink);`}</CodeBlock>
          <p className="theory-note">
            APQ is a middle ground — no build step needed, queries are registered on first use.
            For maximum security, use a <strong>static allowlist</strong> extracted at build time.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "authorization",
    title: "Authorization Strategies",
    level: "senior",
    content: (
      <>
        {/* ── Step 1: The distinction ── */}
        <div className="theory-concept">
          <h4>1. Authentication vs Authorization</h4>
          <p>
            These are two separate steps that must both happen on every request:
          </p>
          <table className="theory-table">
            <thead>
              <tr><th></th><th>Authentication</th><th>Authorization</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Question</strong></td>
                <td><em>Who are you?</em></td>
                <td><em>What can you access?</em></td>
              </tr>
              <tr>
                <td><strong>Input</strong></td>
                <td>Token / credentials from request header</td>
                <td>Verified user identity + resource being accessed</td>
              </tr>
              <tr>
                <td><strong>Output</strong></td>
                <td>User object placed in <code>info.context</code></td>
                <td>Allow / deny / filter the response</td>
              </tr>
              <tr>
                <td><strong>Where in Strawberry</strong></td>
                <td><code>get_context()</code> — runs once per request</td>
                <td>Inside resolvers — runs per field/object</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Step 2: Authentication ── */}
        <div className="theory-concept">
          <h4>2. Authentication — validating the token in <code>get_context</code></h4>
          <p>
            In Strawberry + FastAPI, <code>get_context</code> receives the raw <code>Request</code> object.
            That's where you extract and verify the token — <strong>before any resolver runs</strong>.
            The verified user is then available in every resolver via <code>info.context["user"]</code>.
          </p>
          <CodeBlock>{`# graphql_api.py
from fastapi import Request
from strawberry.fastapi import GraphQLRouter
import jwt   # pip install PyJWT

SECRET_KEY = "your-secret"

def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None   # unauthenticated

    token = auth_header.removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return {
            "id": payload["sub"],
            "role": payload.get("role", "viewer"),
        }
    except jwt.ExpiredSignatureError:
        return None   # treat expired token as unauthenticated
    except jwt.InvalidTokenError:
        return None

async def get_context(request: Request) -> dict:
    return {
        "user": get_current_user(request),   # None if not authenticated
        "team_loader": DataLoader(load_fn=batch_load_teams),
    }

schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema, context_getter=get_context)`}</CodeBlock>
          <p className="theory-note">
            <code>get_context</code> never raises for invalid tokens — it sets <code>user</code> to <code>None</code>.
            Individual resolvers then decide whether to allow anonymous access or reject the request.
            This way a single invalid token doesn't block public fields on the same request.
          </p>
        </div>

        {/* ── Step 3: Requiring authentication ── */}
        <div className="theory-concept">
          <h4>3. Requiring authentication in resolvers</h4>
          <p>
            Once the user is in context, resolvers check it before doing any work.
            A helper keeps this consistent:
          </p>
          <CodeBlock>{`def require_auth(info) -> dict:
    user = info.context["user"]
    if user is None:
        raise PermissionError("Authentication required")
    return user

@strawberry.type
class Query:
    @strawberry.field
    def me(self, info) -> EmployeeType:
        user = require_auth(info)   # raises if no token
        return get_employee(user["id"])

    @strawberry.field
    def public_teams(self, info) -> list[TeamType]:
        # No auth check — open to everyone
        return get_all_teams()`}</CodeBlock>
        </div>

        {/* ── Step 4: Field-level authorization ── */}
        <div className="theory-concept">
          <h4>4. Field-Level Authorization</h4>
          <p>
            Control access to <strong>specific fields</strong> within a type regardless of how the object was fetched.
            Example: only admins can see <code>salary</code>.
          </p>
          <CodeBlock>{`@strawberry.type
class EmployeeType:
    id: int
    name: str   # everyone who can see this employee can see name

    @strawberry.field
    def salary(self, info) -> float | None:
        user = info.context["user"]
        if user is None or user["role"] not in ("admin", "hr"):
            return None   # silently hide — or raise PermissionError
        return self._salary

# Or use a role-check decorator for cleaner syntax:
def requires_role(*roles):
    def decorator(fn):
        def wrapper(self, info, **kwargs):
            user = info.context.get("user")
            if not user or user["role"] not in roles:
                raise PermissionError(f"Requires role: {roles}")
            return fn(self, info, **kwargs)
        return wrapper
    return decorator

@strawberry.type
class Query:
    @strawberry.field
    @requires_role("admin")
    def all_salaries(self, info) -> list[float]:
        ...`}</CodeBlock>
          <ul className="theory-points">
            <li>Good for: sensitive fields (salary, SSN, email) that appear on many types</li>
            <li>Granular but can scatter auth logic — consider a shared decorator</li>
          </ul>
        </div>

        {/* ── Step 5: Object-level authorization ── */}
        <div className="theory-concept">
          <h4>5. Object-Level Authorization</h4>
          <p>
            Control which <strong>records</strong> a user can access at all, based on ownership or role.
            Example: users can only see employees in their own team.
          </p>
          <CodeBlock>{`@strawberry.type
class Query:
    @strawberry.field
    def employee(self, id: int, info) -> EmployeeType | None:
        user = require_auth(info)
        emp = db.query(Employee).get(id)
        if emp is None:
            return None
        # Object-level check — can this user see this employee?
        if user["role"] != "admin" and emp.team_id != user["team_id"]:
            raise PermissionError("Not authorized")
        return EmployeeType.from_model(emp)

    @strawberry.field
    def employees(self, info) -> list[EmployeeType]:
        user = require_auth(info)
        query = db.query(Employee)
        # Filter at DB level — never fetch rows the user can't see
        if user["role"] != "admin":
            query = query.filter(Employee.team_id == user["team_id"])
        return [EmployeeType.from_model(e) for e in query]`}</CodeBlock>
          <ul className="theory-points">
            <li>Good for: multi-tenant apps, row-level security, ownership-based access</li>
            <li>Filter at the DB query level — don't fetch rows and then discard them in Python</li>
          </ul>
        </div>

        {/* ── Step 6: Comparison ── */}
        <div className="theory-concept">
          <h4>6. Field-level vs Object-level comparison</h4>
          <table className="theory-table">
            <thead>
              <tr><th></th><th>Field-Level</th><th>Object-Level</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Granularity</strong></td>
                <td>Per-field — hide <code>salary</code> but show <code>name</code></td>
                <td>Per-record — can or can't see the entire employee</td>
              </tr>
              <tr>
                <td><strong>Implementation</strong></td>
                <td>Field resolvers, decorators, directives</td>
                <td>Query filters, resolver guards</td>
              </tr>
              <tr>
                <td><strong>Leakage risk</strong></td>
                <td>Low — field is blocked everywhere it appears</td>
                <td>Higher — same object reachable via a different query path</td>
              </tr>
              <tr>
                <td><strong>Performance</strong></td>
                <td>Runs after data is fetched</td>
                <td>More efficient — filter at DB level, fetch less data</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-tldr">
          <strong>Best practice:</strong> Authenticate in <code>get_context</code> (once per request).
          Use <strong>object-level</strong> auth to filter what records are accessible (DB query).
          Use <strong>field-level</strong> auth to hide sensitive fields within those records.
          Never trust the client to omit fields — always enforce server-side.
        </div>
      </>
    ),
  },
  {
    id: "caching-cdn-gateway",
    title: "Caching at CDN & Gateway Level",
    level: "senior",
    content: (
      <>
        <div className="theory-concept">
          <h4>Why GraphQL caching is hard</h4>
          <p>
            REST APIs cache naturally — each URL is a cache key. GraphQL uses a <strong>single endpoint</strong>
            with <code>POST</code> requests, so traditional HTTP caching doesn't work out of the box.
          </p>
          <CodeBlock>{`# REST — trivially cacheable
GET /employees/3        → Cache-Control: max-age=60
GET /teams/5            → Cache-Control: max-age=300

# GraphQL — one URL, POST body varies
POST /graphql           → can't cache by URL alone
  { query: "{ employee(id:3) { name } }" }
POST /graphql
  { query: "{ teams { items { name } } }" }`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Strategies</h4>
          <table className="theory-table">
            <thead>
              <tr><th>Layer</th><th>Technique</th><th>How it works</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Client</strong></td>
                <td>Apollo InMemoryCache</td>
                <td>Normalized cache by <code>__typename + id</code>. Automatic for queries; mutations need <code>refetchQueries</code> or cache updates.</td>
              </tr>
              <tr>
                <td><strong>CDN edge</strong></td>
                <td>GET + Persisted Queries</td>
                <td>Convert queries to GET requests with hash as param → standard CDN caching. Set <code>Cache-Control</code> per query.</td>
              </tr>
              <tr>
                <td><strong>Gateway</strong></td>
                <td>Response caching</td>
                <td>Cache full responses keyed by query hash + variables. Apollo Router and Stellate do this.</td>
              </tr>
              <tr>
                <td><strong>Resolver</strong></td>
                <td>DataLoader + Redis</td>
                <td>Cache individual entity lookups in Redis. DataLoader provides request-level caching; Redis provides cross-request caching.</td>
              </tr>
              <tr>
                <td><strong>Database</strong></td>
                <td>Query result cache</td>
                <td>Cache expensive SQL queries. Invalidate on mutations.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-concept">
          <h4>Cache hints (Apollo Server / Router)</h4>
          <CodeBlock>{`# Set cache hints per field/type
@strawberry.type
class TeamType:
    id: int
    name: str       # rarely changes → long cache

    @strawberry.field(
        extensions=[CacheControl(max_age=300)]  # 5 min
    )
    def name(self) -> str:
        return self._name

# Apollo Router computes overall max-age as
# the MINIMUM across all fields in the response.
# If any field is uncacheable → whole response is uncacheable.

# Response header:
# Cache-Control: max-age=300, public`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Partial caching with @defer and @stream</h4>
          <p>
            Both are <strong>incremental delivery directives</strong> — the server sends the response in
            multiple chunks over a single HTTP connection instead of waiting for everything to be ready.
            The difference is what they target:
          </p>
          <table className="theory-table">
            <thead>
              <tr><th></th><th><code>@defer</code></th><th><code>@stream</code></th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Applies to</strong></td>
                <td>A fragment (object / group of fields)</td>
                <td>A list field</td>
              </tr>
              <tr>
                <td><strong>When to use</strong></td>
                <td>One slow field shouldn't block faster fields on the same object</td>
                <td>A large list — send items as they resolve instead of waiting for all</td>
              </tr>
              <tr>
                <td><strong>Delivery</strong></td>
                <td>Initial response + one deferred patch</td>
                <td>Initial response + one patch per item (or batch)</td>
              </tr>
            </tbody>
          </table>

          <p><strong>@defer — client query</strong></p>
          <CodeBlock>{`# @defer — don't block name/designation on slow salary/team join
query GetEmployee {
  employee(id: 3) {
    name          # fast — sent in the initial response
    designation
    ... @defer {
      salary      # slow (ACL check) — arrives in a second chunk
      team {
        budget    # requires DB join — also deferred
      }
    }
  }
}`}</CodeBlock>

          <p><strong>@defer — what the server actually sends (multipart)</strong></p>
          <CodeBlock>{`# Chunk 1 — arrives immediately
--graphql
Content-Type: application/json

{ "data": { "employee": { "name": "Alice", "designation": "Engineer" } },
  "hasNext": true }

# Chunk 2 — arrives when salary/team are ready
--graphql
Content-Type: application/json

{ "incremental": [{ "path": ["employee"],
                    "data": { "salary": 95000, "team": { "budget": 500000 } } }],
  "hasNext": false }`}</CodeBlock>

          <p><strong>@stream — client query</strong></p>
          <CodeBlock>{`# @stream — start rendering the list before all 500 employees are fetched
query GetEmployees {
  employees(limit: 500) {
    items @stream(initialCount: 10) {
      # Send first 10 items immediately, then stream the rest
      id
      name
      designation
    }
  }
}`}</CodeBlock>

          <p><strong>@stream — what the server sends</strong></p>
          <CodeBlock>{`# Chunk 1 — first 10 items immediately
{ "data": { "employees": { "items": [ ...first 10... ] } }, "hasNext": true }

# Chunks 2..N — one patch per remaining item (or batch)
{ "incremental": [{ "items": [{ "id": 11, "name": "Bob", ... }],
                    "path": ["employees", "items"] }],
  "hasNext": true }
...
{ "incremental": [...], "hasNext": false }  ← last chunk`}</CodeBlock>

          <p><strong>Strawberry support</strong></p>
          <CodeBlock>{`# Strawberry supports @defer and @stream via the experimental
# incremental_delivery extension (Strawberry >= 0.200)
import strawberry
from strawberry.extensions import SchemaExtensions

schema = strawberry.Schema(
    query=Query,
    extensions=[SchemaExtensions],   # enables incremental delivery
)

# Your resolver stays the same — Strawberry handles the chunking.
# The client must use multipart/mixed or SSE transport (not plain POST).`}</CodeBlock>

          <p><strong>Client — using Apollo Client (multipart/mixed)</strong></p>
          <CodeBlock>{`// Apollo Client v3.7+ handles multipart/mixed automatically
// when @defer or @stream is present in the query.
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost:8000/graphql",
    // Apollo detects @defer/@stream and switches to multipart/mixed internally
    // No extra config needed — just write the query with @defer or @stream
  }),
  cache: new InMemoryCache(),
});

// Query with @defer — Apollo delivers the first chunk immediately,
// then updates the cache when the deferred patch arrives
const GET_EMPLOYEE = gql\`
  query GetEmployee($id: Int!) {
    employee(id: $id) {
      name
      designation
      ... @defer {
        salary
        team { name }
      }
    }
  }
\`;

// useQuery works as normal — React re-renders when each chunk arrives
function EmployeeCard({ id }) {
  const { data } = useQuery(GET_EMPLOYEE, { variables: { id } });
  return (
    <div>
      <h2>{data?.employee?.name}</h2>
      {/* renders immediately from chunk 1 */}
      <p>{data?.employee?.salary ?? "Loading..."}</p>
      {/* fills in when deferred chunk arrives */}
    </div>
  );
}`}</CodeBlock>

          <p><strong>Client — using fetch directly (SSE / multipart)</strong></p>
          <CodeBlock>{`// Raw fetch — set Accept header to request incremental delivery
const response = await fetch("http://localhost:8000/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "multipart/mixed; deferSpec=20220824, application/json",
    // ↑ tells the server the client supports incremental delivery
  },
  body: JSON.stringify({
    query: \`
      query {
        employee(id: 3) {
          name
          ... @defer { salary team { name } }
        }
      }
    \`,
  }),
});

// Read the multipart stream chunk by chunk
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Each chunk is a JSON payload — parse and merge into your UI state
  console.log("Received chunk:", JSON.parse(chunk.match(/\{[\s\S]*\}/)?.[0]));
}`}</CodeBlock>

          <p className="theory-note">
            <code>@defer</code> and <code>@stream</code> let you mix cached and uncached data in one
            query — cache the fast fields at the CDN edge, stream the rest fresh from the server,
            without blocking the initial paint. The key is the <code>Accept: multipart/mixed</code> header
            — without it the server falls back to a plain single-response POST.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "schema-governance",
    title: "Schema Design & Governance",
    level: "senior",
    content: (
      <>
        <div className="theory-concept">
          <h4>Schema-First vs Code-First</h4>
          <table className="theory-table">
            <thead>
              <tr><th></th><th>Schema-First</th><th>Code-First</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>How</strong></td>
                <td>Write SDL in <code>.graphql</code> files, then implement resolvers to match</td>
                <td>Write code (decorators, classes), schema is generated automatically</td>
              </tr>
              <tr>
                <td><strong>Source of truth</strong></td>
                <td>The <code>.graphql</code> files</td>
                <td>The code itself</td>
              </tr>
              <tr>
                <td><strong>Design collaboration</strong></td>
                <td>Frontend + backend can agree on schema before implementation</td>
                <td>Schema emerges from implementation — harder to review in PRs</td>
              </tr>
              <tr>
                <td><strong>Type safety</strong></td>
                <td>Needs codegen to get types in your language</td>
                <td>Types are in your language natively (Python type hints, TS types)</td>
              </tr>
              <tr>
                <td><strong>Tooling</strong></td>
                <td>Apollo Server, Ariadne, gqlgen</td>
                <td>Strawberry, Nexus, Juniper</td>
              </tr>
              <tr>
                <td><strong>Best for</strong></td>
                <td>API-first orgs, public APIs, cross-team contracts</td>
                <td>Full-stack teams, rapid iteration, strong type systems</td>
              </tr>
            </tbody>
          </table>
          <p className="theory-note">
            Our app uses <strong>code-first</strong> (Strawberry) — ideal for a Python team iterating quickly.
            For a public API consumed by external clients, schema-first gives more control over the contract.
          </p>
        </div>

        <div className="theory-concept">
          <h4>Managing breaking changes</h4>
          <p>
            GraphQL's "no versioning" promise only works if you <strong>never break existing clients</strong>.
            This requires discipline:
          </p>
          <CodeBlock>{`# ✅ Non-breaking: add new fields
type Employee {
  id: Int!
  name: String!
  hiredAt: DateTime      # new field — old clients ignore it
}

# ✅ Non-breaking: deprecate old fields
type Employee {
  department: String @deprecated(reason: "Use team { name }")
  team: Team
}

# ❌ Breaking: remove or rename fields
type Employee {
  # removed 'department' — old clients break
  team: Team
}

# ❌ Breaking: change field types
type Employee {
  salary: Int    # was Float — clients expecting Float break
}`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Schema governance process</h4>
          <ul className="theory-points">
            <li><strong>Schema registry</strong> — Apollo Studio, Hive, or a Git-based registry. Every schema change is versioned and reviewed.</li>
            <li><strong>Schema checks in CI</strong> — automatically diff the schema on every PR. Flag breaking changes before merge.</li>
            <li><strong>Deprecation lifecycle</strong> — mark deprecated → monitor usage → remove after N months when no clients use it.</li>
            <li><strong>Usage tracking</strong> — collect field-level analytics to know which fields are actually used before removing them.</li>
            <li><strong>Schema linting</strong> — enforce naming conventions (camelCase fields, PascalCase types), require descriptions on all types/fields.</li>
          </ul>
          <CodeBlock>{`# CI schema check (Apollo Rover CLI)
rover subgraph check my-graph@production \\
  --name employees \\
  --schema ./schema.graphql

# Output:
# ✗ BREAKING: field Employee.department removed
#   Used by 3 clients in the last 7 days
# ✓ SAFE: field Employee.hiredAt added`}</CodeBlock>
        </div>

        <div className="theory-tldr">
          <strong>Rule:</strong> Add fields freely. Deprecate before removing. Never change types.
          Automate checks in CI so broken schemas can't reach production.
        </div>
      </>
    ),
  },
  {
    id: "subscriptions-at-scale",
    title: "Real-time Subscriptions at Scale",
    level: "senior",
    content: (
      <>
        <div className="theory-concept">
          <h4>How subscriptions work</h4>
          <p>
            Subscriptions use <strong>WebSockets</strong> (or SSE) to maintain a persistent connection.
            When the server-side event fires, data is pushed to all subscribed clients.
          </p>
          <CodeBlock>{`# Client subscribes
subscription {
  employeeCreated {
    id
    name
    team { name }
  }
}

# Server publishes when mutation fires
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_employee(self, input: EmployeeInput) -> EmployeeType:
        emp = create_in_db(input)
        # Publish to all subscribers
        await broadcast("employeeCreated", emp)
        return emp`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>The multi-node challenge</h4>
          <p>
            With a <strong>single server</strong>, subscriptions are simple — the server keeps all WebSocket
            connections in memory. With <strong>multiple nodes</strong> behind a load balancer, the node
            that handles the mutation may not be the node holding the subscriber's WebSocket.
          </p>
          <CodeBlock>{`# Problem:
# Node A: has WebSocket for User X (subscriber)
# Node B: receives mutation from User Y
# Node B publishes event... but User X is on Node A!

# Node A ──[WS]── User X (subscriber)
# Node B ──[HTTP]── User Y (mutation)
#   └─ publishes event → only Node B's local
#      subscribers get it ❌`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Solutions for multi-node</h4>
          <table className="theory-table">
            <thead>
              <tr><th>Approach</th><th>How</th><th>Trade-offs</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Redis Pub/Sub</strong></td>
                <td>All nodes subscribe to Redis channels. Mutation publishes to Redis → all nodes receive → push to their local WebSockets.</td>
                <td>Simple, proven. Redis is a single point of failure (use Redis Cluster). No persistence — missed events are lost.</td>
              </tr>
              <tr>
                <td><strong>Kafka / NATS</strong></td>
                <td>Events published to a topic. Each node consumes from the topic and pushes to local subscribers.</td>
                <td>Durable, ordered, replayable. More infrastructure. Better for high-throughput systems.</td>
              </tr>
              <tr>
                <td><strong>Dedicated subscription service</strong></td>
                <td>Offload WebSocket management to a service like Ably, Pusher, or AWS AppSync.</td>
                <td>No WebSocket scaling headaches. Vendor lock-in. Added latency.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-concept">
          <h4>Architecture pattern</h4>
          <CodeBlock>{`┌─────────┐     ┌─────────┐
│ Node A  │     │ Node B  │
│ [WS×100]│     │ [WS×100]│
└────┬────┘     └────┬────┘
     │               │
     └───── Redis ────┘
          Pub/Sub
             │
     ┌───────┴───────┐
     │  Mutation on  │
     │  any node     │
     │  publishes to │
     │  Redis channel│
     └───────────────┘

# Strawberry + Redis broadcast:
from strawberry.subscriptions import GRAPHQL_WS
from broadcaster import Broadcast

broadcast = Broadcast("redis://localhost:6379")

@strawberry.type
class Subscription:
    @strawberry.subscription
    async def employee_created(self) -> EmployeeType:
        async with broadcast.subscribe("employees") as sub:
            async for event in sub:
                yield EmployeeType.from_json(event.message)`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Scaling considerations</h4>
          <ul className="theory-points">
            <li><strong>Connection limits</strong> — each WebSocket is a persistent TCP connection. Plan for 10k-100k per node (OS tuning needed).</li>
            <li><strong>Sticky sessions</strong> — load balancer must route WebSocket upgrades to the same node (or use shared state).</li>
            <li><strong>Heartbeats</strong> — detect dead connections. Both <code>graphql-ws</code> and <code>subscriptions-transport-ws</code> support ping/pong.</li>
            <li><strong>Filtering</strong> — don't broadcast everything to everyone. Filter events server-side by user permissions and subscription variables.</li>
          </ul>
        </div>
      </>
    ),
  },
  {
    id: "tracing-observability",
    title: "Distributed Tracing & Observability",
    level: "senior",
    content: (
      <>
        <div className="theory-concept">
          <h4>Why GraphQL needs special observability</h4>
          <p>
            In REST, each endpoint is a natural unit of monitoring — you track latency, errors, and throughput
            per route. In GraphQL, <strong>everything hits <code>/graphql</code></strong>, so traditional
            HTTP monitoring gives you one giant blob.
          </p>
          <CodeBlock>{`# REST monitoring — clear per-endpoint metrics
GET /employees    → p99: 45ms, errors: 0.1%
GET /employees/3  → p99: 12ms, errors: 0.3%
POST /employees   → p99: 80ms, errors: 1.2%

# GraphQL monitoring — useless without decomposition
POST /graphql     → p99: ???ms, errors: ???%
# Which query was slow? Which resolver failed?`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Per-resolver tracing</h4>
          <p>
            Break down each GraphQL operation into <strong>per-resolver spans</strong> to see exactly
            where time is spent.
          </p>
          <CodeBlock>{`# Apollo Tracing format (built into Strawberry)
{
  "data": { ... },
  "extensions": {
    "tracing": {
      "duration": 85000000,    # 85ms total
      "execution": {
        "resolvers": [
          {
            "path": ["employees"],
            "duration": 42000000,  # 42ms — DB query
          },
          {
            "path": ["employees", 0, "team"],
            "duration": 3000000,   # 3ms each
          }
        ]
      }
    }
  }
}

# Enable in Strawberry:
from strawberry.extensions.tracing import ApolloTracingExtension
schema = strawberry.Schema(
    query=Query,
    extensions=[ApolloTracingExtension]
)`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>Distributed tracing across services</h4>
          <p>
            In a federated graph, a single query may hit multiple subgraphs. Use <strong>OpenTelemetry</strong>
            to trace the full journey:
          </p>
          <CodeBlock>{`Client → Router → Employee Subgraph → DB
                → Team Subgraph → DB
                → Auth Service

# Each hop gets a span, linked by trace ID:
Trace: abc-123
├─ Router: parse + plan (2ms)
├─ Employee Subgraph: resolve (35ms)
│  └─ PostgreSQL query (28ms)
├─ Team Subgraph: resolve (15ms)
│  └─ PostgreSQL query (10ms)
└─ Total: 52ms`}</CodeBlock>
        </div>

        <div className="theory-concept">
          <h4>What to monitor</h4>
          <table className="theory-table">
            <thead>
              <tr><th>Metric</th><th>Why</th><th>Tool</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Operation latency</strong></td>
                <td>p50/p95/p99 per named operation (e.g., <code>GetEmployees</code>)</td>
                <td>Apollo Studio, Grafana</td>
              </tr>
              <tr>
                <td><strong>Resolver latency</strong></td>
                <td>Find slow resolvers — usually points to missing DataLoader or slow DB queries</td>
                <td>Apollo Tracing, OpenTelemetry</td>
              </tr>
              <tr>
                <td><strong>Error rate by field</strong></td>
                <td>Which fields fail most? Partial errors hide behind 200 OK.</td>
                <td>Custom logging, Sentry</td>
              </tr>
              <tr>
                <td><strong>Query depth / cost</strong></td>
                <td>Detect abuse or inefficient client queries</td>
                <td>Custom extensions</td>
              </tr>
              <tr>
                <td><strong>Field usage</strong></td>
                <td>Which fields are actually used? Safe to deprecate unused ones.</td>
                <td>Apollo Studio, custom analytics</td>
              </tr>
              <tr>
                <td><strong>N+1 detection</strong></td>
                <td>Count DB queries per GraphQL operation — spikes indicate N+1</td>
                <td>SQL logging + correlation</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="theory-tldr">
          <strong>Key insight:</strong> Name your operations (<code>query GetEmployees</code>, not anonymous <code>{"{ employees { ... } }"}</code>).
          Named operations are the foundation of all GraphQL monitoring — they're your equivalent of REST endpoint paths.
        </div>
      </>
    ),
  },
];

function SubjectModal({ subject, onClose, onPrev, onNext, hasPrev, hasNext, currentIndex, total }) {
  const level = LEVELS[subject.level];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="theory-modal" onClick={(e) => e.stopPropagation()}>
        <div className="theory-modal-header">
          <div className="theory-modal-title-row">
            <span className="theory-level-badge" style={{ background: level.color }}>{level.label}</span>
            <h3>{subject.title}</h3>
          </div>
          <div className="theory-modal-meta">
            <span className="theory-modal-counter">{currentIndex + 1} / {total}</span>
            <button className="theory-modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="theory-modal-body">
          {subject.content}
        </div>
        <div className="modal-nav-row">
          <button className="modal-nav-btn" disabled={!hasPrev} onClick={onPrev}>
            ← Previous
          </button>
          <button className="modal-nav-btn" disabled={!hasNext} onClick={onNext}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GraphQLTheory() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [filterLevel, setFilterLevel] = useState("all");

  const filtered = filterLevel === "all"
    ? SUBJECTS
    : SUBJECTS.filter((s) => s.level === filterLevel);

  const openSubject = useCallback((idx) => setActiveIndex(idx), []);
  const closeSubject = useCallback(() => setActiveIndex(null), []);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : i));
  }, [filtered.length]);

  const activeSubject = activeIndex !== null ? filtered[activeIndex] : null;

  return (
    <div className="theory-module">
      <div className="theory-level-filter">
        <button
          className={`theory-filter-btn ${filterLevel === "all" ? "active" : ""}`}
          onClick={() => { setFilterLevel("all"); setActiveIndex(null); }}
        >
          All
        </button>
        {Object.entries(LEVELS).map(([key, { label, color }]) => {
          const count = SUBJECTS.filter((s) => s.level === key).length;
          return (
            <button
              key={key}
              className={`theory-filter-btn ${filterLevel === key ? "active" : ""}`}
              style={filterLevel === key ? { borderColor: color, color } : {}}
              onClick={() => { setFilterLevel(key); setActiveIndex(null); }}
            >
              <span className="theory-filter-dot" style={{ background: color }} />
              {label} ({count})
            </button>
          );
        })}
      </div>

      <div className="theory-subject-list">
        {filtered.map((s, i) => {
          const level = LEVELS[s.level];
          return (
            <button
              key={s.id}
              className="theory-subject-btn"
              onClick={() => openSubject(i)}
            >
              <span className="theory-subject-dot" style={{ background: level.color }} />
              <span className="theory-subject-title">{s.title}</span>
              <span className="theory-subject-arrow">→</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="theory-empty">No subjects at this level yet.</p>
        )}
      </div>

      {activeSubject && (
        <SubjectModal
          subject={activeSubject}
          onClose={closeSubject}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={activeIndex > 0}
          hasNext={activeIndex < filtered.length - 1}
          currentIndex={activeIndex}
          total={filtered.length}
        />
      )}
    </div>
  );
}
