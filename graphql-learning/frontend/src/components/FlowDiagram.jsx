import { useEffect, useState, useRef, useCallback } from "react";

// Rich modal content for each step with code snippets and highlights
const STEP_MODALS = {
  // === QUERY flow modals ===
  "query:react": {
    title: "React Component - useQuery Hook",
    file: "EmployeeList.jsx",
    code: `import { useQuery } from "@apollo/client/react";
import { GET_EMPLOYEES } from "../graphql/queries";

export default function EmployeeList() {
  const [offset, setOffset] = useState(0);
  const limit = 5;

  // ★ This hook triggers the GraphQL request
  const { data, loading, error } = useQuery(
    GET_EMPLOYEES,
    { variables: { offset, limit } }
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // data.employees.items is the result
  return <table>...</table>;
}`,
    highlights: [
      "useQuery() automatically runs the query when the component mounts",
      "It returns { data, loading, error } — React re-renders on each state change",
      "variables: { offset, limit } are passed as GraphQL variables",
    ],
  },
  "query:apollo": {
    title: "Apollo Client - Cache Check & Request Build",
    file: "graphql/client.js",
    code: `import { ApolloClient, InMemoryCache, HttpLink }
  from "@apollo/client/core";

const client = new ApolloClient({
  // ★ HttpLink sends requests to our GraphQL endpoint
  link: new HttpLink({
    uri: "http://localhost:8000/graphql"
  }),

  // ★ InMemoryCache stores query results
  cache: new InMemoryCache(),
});`,
    highlights: [
      "Apollo first checks InMemoryCache for a matching query + variables",
      "On cache miss, it builds a POST request with the query string",
      "Cache key = query document + variables (offset=0, limit=5)",
    ],
  },
  "query:http": {
    title: "HTTP Request - POST to /graphql",
    file: "Network",
    code: `POST http://localhost:8000/graphql
Content-Type: application/json

{
  "query": "query GetEmployees(
    $offset: Int = 0, $limit: Int = 10
  ) {
    employees(offset: $offset, limit: $limit) {
      items {
        id        ← ★ Client chooses which
        name         fields to receive
        address
        salary
      }
      nextOffset
      hasMore
    }
  }",
  "variables": { "offset": 0, "limit": 5 }
}`,
    highlights: [
      "Every GraphQL request is a POST — never GET, PUT, or DELETE",
      "Single endpoint /graphql handles ALL operations (queries + mutations)",
      "The client decides which fields to request — not the server",
    ],
  },
  "query:fastapi": {
    title: "FastAPI Router - Request Routing",
    file: "main.py",
    code: `from fastapi import FastAPI
from graphql_api import graphql_router

app = FastAPI()

# ★ All POST /graphql requests go to Strawberry
app.include_router(
    graphql_router,
    prefix="/graphql"
)

# REST routes are separate
app.include_router(employee_router)`,
    highlights: [
      "FastAPI matches POST /graphql to the Strawberry GraphQLRouter",
      "GraphQLRouter is a standard FastAPI router — integrates seamlessly",
      "REST and GraphQL coexist on the same FastAPI app",
    ],
  },
  "query:strawberry": {
    title: "Strawberry Engine - Query Parsing & Field Matching",
    file: "graphql_api.py",
    code: `import strawberry

# ★ Strawberry parses the query string and finds
# the field name "employees" — then looks for a
# matching method in the Query class:

@strawberry.type
class Query:
    @strawberry.field
    def employees(self, offset, limit):
    #   ^^^^^^^^^ matches "employees" in the query
        ...

    @strawberry.field
    def employee(self, id: int):
    #   ^^^^^^^^ matches "employee" in the query
        ...`,
    highlights: [
      'GraphQL field name "employees" → Python method name "employees"',
      "Strawberry uses graphql-core to parse and validate the query",
      "Query arguments (offset, limit) are mapped to Python function parameters",
    ],
  },
  "query:resolver": {
    title: "Python Resolver - Database Query",
    file: "graphql_api.py",
    code: `@strawberry.field
def employees(self, offset: int = 0,
              limit: int = 10) -> PaginatedEmployees:
    db: Session = next(get_db())
    try:
        # ★ Count total for pagination
        total = db.query(Employee).count()

        # ★ Fetch page of employees
        rows = (
            db.query(Employee)
            .order_by(Employee.id)
            .offset(offset)
            .limit(limit)
            .all()
        )

        items = [EmployeeType.from_model(e)
                 for e in rows]
        has_more = (offset + limit) < total

        return PaginatedEmployees(
            items=items,
            next_offset=offset + limit
                        if has_more else None,
            has_more=has_more,
        )
    finally:
        db.close()`,
    highlights: [
      "This is the 'resolver' — the actual business logic that runs",
      "Uses SQLAlchemy ORM to query PostgreSQL",
      "Returns Strawberry types (PaginatedEmployees, EmployeeType)",
    ],
  },
  "query:postgres": {
    title: "PostgreSQL - SQL Execution",
    file: "Database",
    code: `-- SQLAlchemy generates this SQL:

-- ★ Count query (for pagination)
SELECT count(*) AS count_1
FROM employees;

-- ★ Data query (with offset/limit)
SELECT employees.id,
       employees.name,
       employees.address,
       employees.designation,
       employees.team,
       employees.salary
FROM employees
ORDER BY employees.id
OFFSET 0 LIMIT 5;`,
    highlights: [
      "SQLAlchemy translates ORM calls to raw SQL automatically",
      "OFFSET/LIMIT handles pagination at the database level",
      "PostgreSQL returns ALL columns — field filtering happens in Strawberry (step 9)",
    ],
  },
  "query:resolver_back": {
    title: "Resolver Returns - Python Objects",
    file: "graphql_api.py",
    code: `# The resolver returns Strawberry types:

@strawberry.type
class EmployeeType:
    id: int
    name: str
    address: str | None
    ...

    @staticmethod
    def from_model(e: Employee) -> "EmployeeType":
        # ★ Converts SQLAlchemy model → Strawberry type
        return EmployeeType(
            id=int(e.id),
            name=str(e.name),
            address=str(e.address) if e.address
                    else None,
            ...
        )

# ★ Returned: PaginatedEmployees(
#     items=[EmployeeType(id=24, name="Alice", ...),
#            EmployeeType(id=25, name="Bob", ...)],
#     has_more=True
# )`,
    highlights: [
      "from_model() converts DB rows to GraphQL types",
      "Strawberry types are plain Python dataclasses under the hood",
      "The return type must match the @strawberry.field return annotation",
    ],
  },
  "query:strawberry_back": {
    title: "Strawberry Filters - Response Shaping",
    file: "Strawberry Engine",
    code: `# The query asked for specific fields:
# { items { id name address salary } nextOffset hasMore }

# ★ Strawberry strips fields NOT requested:
# If EmployeeType has: id, name, address,
#   designation, team, salary
# But query only asked: id, name, address, salary
#
# → designation and team are REMOVED
#   from the response

# This is the key GraphQL advantage:
# REST: server decides what to return (all fields)
# GraphQL: client decides what to receive`,
    highlights: [
      "Field filtering is automatic — Strawberry handles it",
      "The resolver still fetches all fields from DB, but only requested ones are serialized",
      "This reduces payload size — client gets exactly what it needs",
    ],
  },
  "query:http_back": {
    title: "JSON Response - Back to Browser",
    file: "Network",
    code: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "employees": {
      "items": [
        {
          "id": 24,
          "name": "Alice Johnson",
          "address": "101 Oak St, Austin TX",
          "salary": 125000.0
        },
        // ... 4 more employees
      ],
      "nextOffset": 5,
      "hasMore": true
    }
  }
}

// ★ On error, response includes "errors" array:
// { "errors": [{ "message": "..." }], "data": null }`,
    highlights: [
      'GraphQL always returns 200 OK — errors are in the "errors" field, not HTTP status codes',
      'Response is always wrapped in { "data": { ... } }',
      "Field names are camelCase (Strawberry auto-converts snake_case)",
    ],
  },
  "query:apollo_back": {
    title: "Apollo Cache - Store & Update React",
    file: "Apollo Client",
    code: `// ★ Apollo stores the result in InMemoryCache:
// Cache key: GetEmployees({"offset":0,"limit":5})

// On next request with SAME variables:
//   → Returns cached data instantly (no network)

// Cache policies:
//   "cache-first"     ← default, use cache if available
//   "network-only"    ← always fetch from server
//   "cache-and-network" ← use cache + fetch in bg

// ★ After storing, Apollo triggers React re-render
// by updating the observable that useQuery watches`,
    highlights: [
      "Cache key = query name + variables hash",
      "Default cache-first policy means repeated queries are instant",
      "Apollo notifies React via internal observables (not setState)",
    ],
  },
  "query:react_back": {
    title: "React Re-render - UI Updates",
    file: "EmployeeList.jsx",
    code: `// ★ useQuery updates its return values:
// loading: false  (was true)
// data: { employees: { items: [...], ... } }
// error: undefined

// React re-renders the component with new data:
const { items, nextOffset, hasMore } = data.employees;

return (
  <table>
    <tbody>
      {items.map((emp) => (
        <tr key={emp.id}>
          <td>{emp.name}</td>
          <td>{emp.salary}</td>
          {/* only fields we requested! */}
        </tr>
      ))}
    </tbody>
  </table>
);`,
    highlights: [
      "loading flips from true→false, triggering a re-render",
      "data now contains the GraphQL response — components access it directly",
      "No manual state management needed — Apollo handles it all",
    ],
  },

  // === SEARCH flow modals ===
  "search:react": {
    title: "React Component - Search Input",
    file: "EmployeeList.jsx",
    code: `const [searchEmployees, { data: searchData, loading }] =
  useLazyQuery(SEARCH_EMPLOYEES);

const handleSearch = (e) => {
  const value = e.target.value;
  setSearchTerm(value);
  if (value.trim().length >= 2) {
    setIsSearching(true);
    // ★ Fires only when user types 2+ characters
    searchEmployees({
      variables: { query: value.trim() }
    });
  } else {
    setIsSearching(false);
  }
};`,
    highlights: [
      "useLazyQuery — query runs on demand, not on component mount",
      "Debounce-like behavior: only fires at 2+ characters",
      "Returns [triggerFn, result] — same pattern as useMutation",
    ],
  },
  "search:apollo": {
    title: "Apollo Client - Lazy Query Execution",
    file: "Apollo Client",
    code: `// ★ useLazyQuery vs useQuery:
//
// useQuery:     runs immediately on mount
// useLazyQuery: runs only when you call it
//
// Perfect for search — you don't want to search
// with an empty string on page load!

// Apollo builds the POST request when
// searchEmployees() is called:
const SEARCH_EMPLOYEES = gql\`
  query SearchEmployees($query: String!) {
    searchEmployees(query: $query) {
      id name address designation team salary
    }
  }
\`;`,
    highlights: [
      "useLazyQuery is ideal for user-triggered operations like search",
      "No cache check — search queries always go to the server",
      "The $query variable is a required String (non-null)",
    ],
  },
  "search:http": {
    title: "HTTP Request - Search Query",
    file: "Network",
    code: `POST http://localhost:8000/graphql
Content-Type: application/json

{
  "query": "query SearchEmployees(
    $query: String!
  ) {
    searchEmployees(query: $query) {
      id
      name
      address
      designation
      team
      salary
    }
  }",
  "variables": { "query": "eng" }
}`,
    highlights: [
      "Same POST endpoint as all other GraphQL operations",
      "Search term is passed as a variable, not in the query string URL",
      "Still a query (read), not a mutation (write)",
    ],
  },
  "search:fastapi": {
    title: "FastAPI Router - Same Endpoint",
    file: "main.py",
    code: `# ★ Same route handles search queries too
app.include_router(
    graphql_router,
    prefix="/graphql"
)

# In REST, search might be:
#   GET /employees?search=eng
#   GET /employees/search?q=eng
#
# In GraphQL, it's the same POST /graphql
# The operation name in the query body
# determines what runs`,
    highlights: [
      "No new endpoint needed — same /graphql handles everything",
      "REST would need a separate route or query parameter for search",
      "GraphQL's single-endpoint design simplifies routing",
    ],
  },
  "search:strawberry": {
    title: "Strawberry Engine - Query Field Matching",
    file: "graphql_api.py",
    code: `@strawberry.type
class Query:
    @strawberry.field
    def search_employees(self, query: str):
    #   ^^^^^^^^^^^^^^^^ → searchEmployees in GraphQL
    #   (auto snake_case → camelCase conversion)

    # Strawberry finds this method because:
    # 1. Operation is "query" (not "mutation")
    # 2. Field name "searchEmployees" matches
    #    Python method "search_employees"
    # 3. Parameter $query: String! maps to
    #    Python parameter query: str`,
    highlights: [
      "search_employees (Python) = searchEmployees (GraphQL)",
      "Strawberry validates that 'query' arg is a non-null String",
      "This is a Query field — read-only, no side effects",
    ],
  },
  "search:resolver": {
    title: "Python Resolver - ILIKE Search",
    file: "graphql_api.py",
    code: `@strawberry.field
def search_employees(self, query: str)
    -> list[EmployeeType]:
    db: Session = next(get_db())
    try:
        pattern = f"%{query}%"
        # ★ ILIKE = case-insensitive LIKE
        rows = (
            db.query(Employee)
            .filter(
                Employee.name.ilike(pattern)
                | Employee.designation.ilike(pattern)
                | Employee.team.ilike(pattern)
                | Employee.address.ilike(pattern)
            )
            .order_by(Employee.id)
            .limit(50)
            .all()
        )
        return [EmployeeType.from_model(e)
                for e in rows]
    finally:
        db.close()`,
    highlights: [
      "ILIKE = case-insensitive pattern matching (PostgreSQL specific)",
      "Searches across 4 columns with OR logic",
      "Limit 50 prevents massive result sets",
    ],
  },
  "search:postgres": {
    title: "PostgreSQL - ILIKE Query",
    file: "Database",
    code: `-- ★ SQLAlchemy generates:

SELECT employees.id, employees.name,
       employees.address, employees.designation,
       employees.team, employees.salary
FROM employees
WHERE employees.name ILIKE '%eng%'
   OR employees.designation ILIKE '%eng%'
   OR employees.team ILIKE '%eng%'
   OR employees.address ILIKE '%eng%'
ORDER BY employees.id
LIMIT 50;

-- ILIKE is PostgreSQL's case-insensitive LIKE
-- '%eng%' matches "Engineer", "engineering", etc.`,
    highlights: [
      "ILIKE is PostgreSQL-specific (MySQL uses LIKE with COLLATE)",
      "% wildcards match any characters before/after the search term",
      "OR across 4 columns — matches if ANY column contains the term",
    ],
  },
  "search:resolver_back": {
    title: "Resolver Returns - Search Results",
    file: "graphql_api.py",
    code: `# Returns a list of matching employees:

return [EmployeeType.from_model(e) for e in rows]

# Example result:
# [
#   EmployeeType(id=3, name="Alice Engineer", ...),
#   EmployeeType(id=7, name="Bob", designation="Engineer", ...),
#   EmployeeType(id=15, name="Eve", team="Engineering", ...),
# ]
#
# ★ Note: returns list[EmployeeType]
# NOT PaginatedEmployees — search has no pagination`,
    highlights: [
      "Search returns a flat list — no pagination wrapper",
      "All matching employees up to the limit of 50",
      "from_model() converts each DB row to a Strawberry type",
    ],
  },
  "search:strawberry_back": {
    title: "Strawberry Filters - Response Fields",
    file: "Strawberry Engine",
    code: `# Query requested all fields:
# { id name address designation team salary }
#
# ★ Strawberry serializes all requested fields
# from each EmployeeType in the list
#
# If the query only asked for { id name }:
# → designation, team, salary, address
#   would be stripped from response`,
    highlights: [
      "Same field filtering as other operations",
      "Each item in the list is filtered independently",
      "Client controls exactly which fields come back",
    ],
  },
  "search:http_back": {
    title: "JSON Response - Search Results",
    file: "Network",
    code: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "searchEmployees": [
      {
        "id": 3,
        "name": "Alice Johnson",
        "designation": "Senior Engineer",
        "team": "Backend"
      },
      {
        "id": 7,
        "name": "Bob Smith",
        "designation": "Engineer",
        "team": "Frontend"
      }
    ]
  }
}`,
    highlights: [
      "Response is a JSON array (not paginated object)",
      "Field name matches the GraphQL field: searchEmployees",
      "Empty array [] if no results — not an error",
    ],
  },
  "search:apollo_back": {
    title: "Apollo Client - Update React State",
    file: "Apollo Client",
    code: `// ★ useLazyQuery updates its return values:
//
// Before: { data: undefined, loading: true }
// After:  { data: { searchEmployees: [...] },
//            loading: false }
//
// Apollo caches search results too:
// Key: SearchEmployees({"query":"eng"})
//
// Same search term = instant cached result
// Different term = new network request`,
    highlights: [
      "Search results are cached by the search term",
      "Repeated searches for 'eng' will be instant (cache hit)",
      "loading state lets you show a 'Searching...' indicator",
    ],
  },
  "search:react_back": {
    title: "React Re-render - Display Results",
    file: "EmployeeList.jsx",
    code: `// ★ When isSearching, show search results:
const displayItems = isSearching
  ? (searchData?.searchEmployees || [])
  : (data?.employees?.items || []);

// Table renders with filtered results
{displayItems.map((emp) => (
  <tr key={emp.id}>
    <td>{emp.name}</td>
    <td>{emp.designation || "-"}</td>
    ...
  </tr>
))}

// Search count shown below table:
{isSearching && (
  <p>{displayItems.length} result(s) found</p>
)}`,
    highlights: [
      "Same table renders both paginated and search results",
      "isSearching flag toggles between data sources",
      "Pagination controls hide during search mode",
    ],
  },

  // === UPDATE flow modals ===
  "update:react": {
    title: "React Component - Edit Modal Submit",
    file: "EditEmployeeModal.jsx",
    code: `const [updateEmployee, { loading }] = useMutation(
  UPDATE_EMPLOYEE,
  { refetchQueries: [GET_EMPLOYEES] }
);

const handleSubmit = async (e) => {
  e.preventDefault();
  // ★ Only sends changed fields (partial update)
  await updateEmployee({
    variables: {
      id: employee.id,
      input: {
        name: form.name || null,
        address: form.address || null,
        salary: form.salary
                ? parseFloat(form.salary) : null,
      },
    },
  });
  onClose(); // close modal
};`,
    highlights: [
      "useMutation for write operations — same pattern as create",
      "Sends partial updates — null fields are unchanged on server",
      "refetchQueries refreshes the list after update",
    ],
  },
  "update:apollo": {
    title: "Apollo Client - Mutation Build",
    file: "Apollo Client",
    code: `// ★ Apollo builds the mutation request:

const UPDATE_EMPLOYEE = gql\`
  mutation UpdateEmployee(
    $id: Int!,
    $input: EmployeeUpdateInput!
  ) {
    updateEmployee(id: $id, input: $input) {
      id name address designation team salary
    }
  }
\`;

// Note: EmployeeUpdateInput (not EmployeeInput)
// All fields are optional — allows partial updates`,
    highlights: [
      "EmployeeUpdateInput has all optional fields (unlike EmployeeInput)",
      "id is separate from input — identifies which record to update",
      "Mutation always goes to server (no cache check)",
    ],
  },
  "update:http": {
    title: "HTTP Request - Update Mutation",
    file: "Network",
    code: `POST http://localhost:8000/graphql
Content-Type: application/json

{
  "query": "mutation UpdateEmployee(
    $id: Int!, $input: EmployeeUpdateInput!
  ) {
    updateEmployee(id: $id, input: $input) {
      id name address designation team salary
    }
  }",
  "variables": {
    "id": 24,
    "input": {
      "name": "Alice Johnson-Smith",
      "salary": 135000
    }
  }
}

// ★ Only changed fields in input — partial update`,
    highlights: [
      "Same POST /graphql endpoint as queries and creates",
      "Input only contains fields that changed",
      "In REST this would be PATCH /employees/24",
    ],
  },
  "update:fastapi": {
    title: "FastAPI Router - Same Endpoint",
    file: "main.py",
    code: `# ★ Same single endpoint handles updates too
app.include_router(
    graphql_router,
    prefix="/graphql"
)

# REST equivalent would be:
#   PUT  /employees/24  (full replace)
#   PATCH /employees/24 (partial update)
#
# GraphQL: POST /graphql
# The mutation name determines the operation`,
    highlights: [
      "No separate PUT/PATCH endpoints needed",
      "GraphQL mutations handle both full and partial updates",
      "Single endpoint simplifies API surface",
    ],
  },
  "update:strawberry": {
    title: "Strawberry Engine - Mutation Matching",
    file: "graphql_api.py",
    code: `# ★ Strawberry finds the mutation:

@strawberry.type
class Mutation:
    @strawberry.mutation
    def update_employee(self, id: int,
        input: EmployeeUpdateInput):
    #   ^^^^^^^^^^^^^^^ → updateEmployee
    #
    # EmployeeUpdateInput has all-optional fields:
    @strawberry.input
    class EmployeeUpdateInput:
        name: str | None = None
        address: str | None = None
        designation: str | None = None
        team: str | None = None
        salary: float | None = None`,
    highlights: [
      "update_employee → updateEmployee (auto camelCase)",
      "EmployeeUpdateInput: all fields are Optional (str | None)",
      "Default None means 'don't update this field'",
    ],
  },
  "update:resolver": {
    title: "Python Resolver - Partial Update",
    file: "graphql_api.py",
    code: `@strawberry.mutation
def update_employee(self, id: int,
    input: EmployeeUpdateInput) -> EmployeeType:
    db: Session = next(get_db())
    try:
        emp = db.query(Employee).filter(
            Employee.id == id).first()
        if not emp:
            raise ValueError(f"Employee {id} not found")

        # ★ Only update non-None fields
        if input.name is not None:
            emp.name = input.name
        if input.address is not None:
            emp.address = input.address
        if input.salary is not None:
            emp.salary = input.salary
        # ... same for other fields

        db.commit()
        db.refresh(emp)
        return EmployeeType.from_model(emp)
    finally:
        db.close()`,
    highlights: [
      "Checks each field for None — only updates provided fields",
      "Raises ValueError if employee not found (becomes GraphQL error)",
      "db.commit() persists changes, db.refresh() gets updated state",
    ],
  },
  "update:postgres": {
    title: "PostgreSQL - UPDATE Statement",
    file: "Database",
    code: `-- ★ SQLAlchemy generates:

-- First, find the employee:
SELECT employees.id, employees.name, ...
FROM employees
WHERE employees.id = 24;

-- Then update only changed columns:
UPDATE employees
SET name = 'Alice Johnson-Smith',
    salary = 135000.0
WHERE employees.id = 24;

-- Only name and salary changed
-- Other columns remain untouched`,
    highlights: [
      "SQLAlchemy tracks which attributes changed (dirty tracking)",
      "Only modified columns appear in the UPDATE SET clause",
      "Two SQL queries: SELECT to find, UPDATE to modify",
    ],
  },
  "update:resolver_back": {
    title: "Resolver Returns - Updated Employee",
    file: "graphql_api.py",
    code: `# After db.refresh(emp):
# emp now has the latest values from DB

return EmployeeType.from_model(emp)

# Returns: EmployeeType(
#   id=24,
#   name="Alice Johnson-Smith",  ← updated
#   address="101 Oak St",        ← unchanged
#   salary=135000.0,             ← updated
#   ...
# )`,
    highlights: [
      "db.refresh() ensures we return the DB's actual state",
      "All fields returned — even unchanged ones",
      "Client sees the updated employee immediately",
    ],
  },
  "update:strawberry_back": {
    title: "Strawberry Filters - Response Fields",
    file: "Strawberry Engine",
    code: `# Mutation requested:
# { id name address designation team salary }
#
# ★ All fields requested → all fields returned
# Strawberry serializes the full EmployeeType
#
# The updated values are included in the response
# so the client can update its UI immediately`,
    highlights: [
      "Full object returned lets the client update its local state",
      "Apollo can use this to update its cache automatically",
      "Field filtering works the same for mutations and queries",
    ],
  },
  "update:http_back": {
    title: "JSON Response - Updated Employee",
    file: "Network",
    code: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "updateEmployee": {
      "id": 24,
      "name": "Alice Johnson-Smith",
      "address": "101 Oak St, Austin TX",
      "designation": "Senior Engineer",
      "team": "Backend",
      "salary": 135000.0
    }
  }
}

// ★ Full updated object returned`,
    highlights: [
      "200 OK — GraphQL doesn't use 204 No Content like REST PUT",
      "Full object returned — client can verify the update",
      "REST might return the object too, but it's convention-dependent",
    ],
  },
  "update:apollo_back": {
    title: "Apollo Client - Refetch & Cache Update",
    file: "Apollo Client",
    code: `// ★ After mutation succeeds:
// 1. Apollo stores the mutation result
// 2. refetchQueries: [GET_EMPLOYEES]
//    → re-runs the employees list query
//    → list now shows updated employee data
//
// Alternative: Apollo can auto-update cache
// if the returned object has __typename + id
// (called "cache normalization")`,
    highlights: [
      "refetchQueries ensures the list reflects the update",
      "Apollo's normalized cache could update automatically with __typename",
      "The simpler refetch approach costs one extra request",
    ],
  },
  "update:react_back": {
    title: "React Re-render - Modal Closes & List Updates",
    file: "App.jsx + EmployeeList.jsx",
    code: `// ★ In EditEmployeeModal:
await updateEmployee({ variables: { ... } });
onClose();  // closes the modal

// ★ In App.jsx:
// onClose sets editingEmployee to null
// → modal unmounts

// ★ In EmployeeList:
// refetch triggers useQuery to update
// → table re-renders with updated employee data
// Name and salary now show new values!`,
    highlights: [
      "Modal closes immediately after successful update",
      "Employee list auto-refreshes via refetchQueries",
      "No manual state sync needed between modal and list",
    ],
  },

  // === DELETE flow modals ===
  "delete:react": {
    title: "React Component - Delete Confirmation",
    file: "EmployeeList.jsx",
    code: `const [deleteEmployee] = useMutation(DELETE_EMPLOYEE, {
  refetchQueries: [GET_EMPLOYEES],
});

const handleDelete = async (emp) => {
  // ★ Browser confirm dialog for safety
  if (!window.confirm(\`Delete \${emp.name}?\`))
    return;

  onOperation("delete");
  await deleteEmployee({
    variables: { id: emp.id }
  });
};`,
    highlights: [
      "window.confirm() prevents accidental deletions",
      "useMutation with refetchQueries to refresh the list",
      "Only the id is needed — no input object for deletes",
    ],
  },
  "delete:apollo": {
    title: "Apollo Client - Delete Mutation Build",
    file: "Apollo Client",
    code: `// ★ Apollo builds the delete mutation:

const DELETE_EMPLOYEE = gql\`
  mutation DeleteEmployee($id: Int!) {
    deleteEmployee(id: $id) {
      success
      message
    }
  }
\`;

// Note: returns { success, message }
// instead of the deleted employee
// (different pattern from create/update)`,
    highlights: [
      "Delete returns a result object, not the deleted entity",
      "success: boolean tells if the delete worked",
      "message: string provides human-readable feedback",
    ],
  },
  "delete:http": {
    title: "HTTP Request - Delete Mutation",
    file: "Network",
    code: `POST http://localhost:8000/graphql
Content-Type: application/json

{
  "query": "mutation DeleteEmployee($id: Int!) {
    deleteEmployee(id: $id) {
      success
      message
    }
  }",
  "variables": { "id": 24 }
}

// ★ In REST: DELETE /employees/24
// In GraphQL: POST /graphql with mutation`,
    highlights: [
      "Still a POST request — GraphQL never uses DELETE HTTP method",
      "The mutation keyword + operation name identify this as a delete",
      "Only needs the id — minimal payload",
    ],
  },
  "delete:fastapi": {
    title: "FastAPI Router - Same Endpoint",
    file: "main.py",
    code: `# ★ Same endpoint handles deletes
# REST: DELETE /employees/24
# GraphQL: POST /graphql

# REST needs:
#   @router.delete("/employees/{id}")
#   def delete_employee(id: int): ...
#
# GraphQL already has the route:
app.include_router(
    graphql_router,
    prefix="/graphql"
)`,
    highlights: [
      "No separate DELETE route needed in GraphQL",
      "REST uses HTTP method (DELETE) to indicate the operation",
      "GraphQL uses the mutation name instead",
    ],
  },
  "delete:strawberry": {
    title: "Strawberry Engine - Delete Mutation Match",
    file: "graphql_api.py",
    code: `@strawberry.type
class Mutation:
    @strawberry.mutation
    def delete_employee(self, id: int)
        -> DeleteResult:
    #   ^^^^^^^^^^^^^^^ → deleteEmployee

# ★ DeleteResult is a custom return type:
@strawberry.type
class DeleteResult:
    success: bool
    message: str

# This pattern (success + message) is common
# for operations that don't return an entity`,
    highlights: [
      "DeleteResult is a dedicated response type for delete ops",
      "success/message pattern is a common GraphQL convention",
      "Alternative: return the deleted employee data instead",
    ],
  },
  "delete:resolver": {
    title: "Python Resolver - Delete from DB",
    file: "graphql_api.py",
    code: `@strawberry.mutation
def delete_employee(self, id: int) -> DeleteResult:
    db: Session = next(get_db())
    try:
        emp = db.query(Employee).filter(
            Employee.id == id).first()
        if not emp:
            return DeleteResult(
                success=False,
                message=f"Employee {id} not found"
            )

        # ★ Delete and commit
        db.delete(emp)
        db.commit()
        return DeleteResult(
            success=True,
            message=f"Employee {id} deleted"
        )
    finally:
        db.close()`,
    highlights: [
      "Returns DeleteResult(success=False) instead of raising an error",
      "db.delete(emp) marks for deletion, db.commit() executes it",
      "Graceful handling — no crash if employee doesn't exist",
    ],
  },
  "delete:postgres": {
    title: "PostgreSQL - DELETE Statement",
    file: "Database",
    code: `-- ★ SQLAlchemy generates:

-- First, find the employee:
SELECT employees.id, employees.name, ...
FROM employees
WHERE employees.id = 24;

-- Then delete it:
DELETE FROM employees
WHERE employees.id = 24;

-- Row is permanently removed
-- Auto-increment id is NOT reused`,
    highlights: [
      "DELETE is permanent — no soft-delete by default",
      "The id (24) will never be reused by auto-increment",
      "Two SQL queries: SELECT to verify existence, then DELETE",
    ],
  },
  "delete:resolver_back": {
    title: "Resolver Returns - Delete Result",
    file: "graphql_api.py",
    code: `# ★ Success case:
return DeleteResult(
    success=True,
    message="Employee 24 deleted"
)

# ★ Not-found case:
return DeleteResult(
    success=False,
    message="Employee 24 not found"
)

# No exception thrown — client gets a clean response
# The "success" field tells the client what happened`,
    highlights: [
      "Boolean success field makes it easy for client to check",
      "Message provides human-readable context",
      "No exception = no GraphQL error — keeps response clean",
    ],
  },
  "delete:strawberry_back": {
    title: "Strawberry Filters - Response Fields",
    file: "Strawberry Engine",
    code: `# Mutation asked for: { success message }
# Both fields are returned as requested
#
# ★ DeleteResult is simple — only 2 fields
# No filtering needed (client asks for both)
#
# If client only asked for { success }:
# → message would be stripped from response`,
    highlights: [
      "Simple response type — usually both fields requested",
      "Field filtering still applies to delete responses",
      "DeleteResult is a pattern — you could add more fields (deletedId, etc.)",
    ],
  },
  "delete:http_back": {
    title: "JSON Response - Delete Confirmation",
    file: "Network",
    code: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "deleteEmployee": {
      "success": true,
      "message": "Employee 24 deleted"
    }
  }
}

// ★ REST would return:
// 204 No Content (empty body)
// or 200 OK with the deleted object
//
// GraphQL returns 200 with a result object`,
    highlights: [
      "200 OK — not 204 No Content like REST DELETE",
      "success: true confirms the deletion worked",
      "GraphQL always returns a body — never empty responses",
    ],
  },
  "delete:apollo_back": {
    title: "Apollo Client - Refetch List",
    file: "Apollo Client",
    code: `// ★ After delete mutation completes:
// refetchQueries: [GET_EMPLOYEES]
//
// Apollo re-runs the employees list query
// The deleted employee is no longer in the DB
// → it disappears from the list
//
// Note: Apollo's cache still has the old entry
// until the refetch replaces it
// refetchQueries is the simplest cleanup strategy`,
    highlights: [
      "refetchQueries cleans up stale cache entries",
      "Alternative: cache.evict() to manually remove from cache",
      "The list automatically shrinks by one row",
    ],
  },
  "delete:react_back": {
    title: "React Re-render - Row Removed",
    file: "EmployeeList.jsx",
    code: `// ★ After refetch completes:
// data.employees.items no longer includes
// the deleted employee

// The table re-renders:
{displayItems.map((emp) => (
  <tr key={emp.id}>
    <td>{emp.name}</td>
    ...
  </tr>
))}

// Employee 24 is gone — table shows one fewer row
// Pagination adjusts automatically`,
    highlights: [
      "Deleted employee disappears from the table",
      "Pagination 'Showing X - Y' updates automatically",
      "No manual DOM manipulation — React handles the re-render",
    ],
  },

  // === CREATE flow modals ===
  "create:react": {
    title: "React Component - Form Submit",
    file: "EmployeeForm.jsx",
    code: `const [createEmployee, { loading }] = useMutation(
  CREATE_EMPLOYEE,
  { refetchQueries: [GET_EMPLOYEES] }
);

const handleSubmit = async (e) => {
  e.preventDefault();
  // ★ Triggers the GraphQL mutation
  await createEmployee({
    variables: {
      input: {
        name: form.name,
        address: form.address || null,
        salary: form.salary
                ? parseFloat(form.salary) : null,
      },
    },
  });
  setForm(emptyForm); // reset form
};`,
    highlights: [
      "useMutation returns [triggerFn, resultObj] — unlike useQuery which runs automatically",
      "refetchQueries tells Apollo to re-run GET_EMPLOYEES after mutation completes",
      "The mutation only fires when createEmployee() is called (on form submit)",
    ],
  },
  "create:apollo": {
    title: "Apollo Client - Mutation Request Build",
    file: "Apollo Client",
    code: `// ★ Apollo builds the POST request:
// Unlike useQuery, mutations do NOT check cache first
// They always go to the server

// The mutation string from queries.js:
const CREATE_EMPLOYEE = gql\`
  mutation CreateEmployee($input: EmployeeInput!) {
    createEmployee(input: $input) {
      id
      name
      address
      designation
      team
      salary
    }
  }
\`;

// Apollo serializes variables and sends the request`,
    highlights: [
      "Mutations always hit the server — no cache check",
      "The $input variable maps to the EmployeeInput type on the server",
      "Apollo manages the loading state throughout the request lifecycle",
    ],
  },
  "create:http": {
    title: "HTTP Request - Mutation POST",
    file: "Network",
    code: `POST http://localhost:8000/graphql
Content-Type: application/json

{
  "query": "mutation CreateEmployee(
    $input: EmployeeInput!
  ) {
    createEmployee(input: $input) {
      id
      name
    }
  }",
  "variables": {
    "input": {
      "name": "John Doe",
      "address": "123 Main St",
      "designation": "Engineer",
      "team": "Backend",
      "salary": 100000
    }
  }
}`,
    highlights: [
      "Same endpoint /graphql — same POST method as queries",
      'The "mutation" keyword tells GraphQL this is a write operation',
      "EmployeeInput! — the ! means the input is required (non-null)",
    ],
  },
  "create:fastapi": {
    title: "FastAPI Router - Same Route",
    file: "main.py",
    code: `# ★ Exact same route as queries — POST /graphql
# FastAPI doesn't distinguish queries from mutations
# Strawberry handles that internally

app.include_router(
    graphql_router,
    prefix="/graphql"
)

# GraphQL uses a SINGLE endpoint for everything
# vs REST which uses different URLs:
#   GET    /employees      → list
#   POST   /employees      → create
#   PUT    /employees/1    → update
#   DELETE /employees/1    → delete`,
    highlights: [
      "Single endpoint handles queries AND mutations",
      "The distinction between read/write is in the GraphQL query string, not the URL",
      "This is a fundamental difference from REST's URL-per-resource model",
    ],
  },
  "create:strawberry": {
    title: "Strawberry Engine - Mutation Parsing",
    file: "graphql_api.py",
    code: `# ★ Strawberry sees "mutation" keyword
# Looks in the Mutation class (not Query)

schema = strawberry.Schema(
    query=Query,
    mutation=Mutation  # ← mutations go here
)

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_employee(self, input: EmployeeInput):
    #   ^^^^^^^^^^^^^^^ matches "createEmployee"
    #   (Strawberry converts snake_case → camelCase)
        ...

# ★ Note: snake_case in Python → camelCase in GraphQL
# create_employee → createEmployee`,
    highlights: [
      "Strawberry routes to Mutation class (not Query) for mutation operations",
      "Python snake_case is auto-converted to GraphQL camelCase",
      "@strawberry.mutation decorator (not @strawberry.field) marks write operations",
    ],
  },
  "create:resolver": {
    title: "Python Resolver - Insert into DB",
    file: "graphql_api.py",
    code: `@strawberry.mutation
def create_employee(self,
    input: EmployeeInput) -> EmployeeType:
    db: Session = next(get_db())
    try:
        # ★ Create SQLAlchemy model from input
        employee = Employee(
            name=input.name,
            address=input.address,
            designation=input.designation,
            team=input.team,
            salary=input.salary,
        )

        # ★ Insert into database
        db.add(employee)
        db.commit()
        db.refresh(employee)  # get auto-generated id

        return EmployeeType.from_model(employee)
    finally:
        db.close()`,
    highlights: [
      "EmployeeInput is a @strawberry.input type — for receiving data",
      "db.refresh() fetches the auto-generated ID after INSERT",
      "Returns the created employee so the client gets the new ID immediately",
    ],
  },
  "create:postgres": {
    title: "PostgreSQL - INSERT",
    file: "Database",
    code: `-- ★ SQLAlchemy generates:

INSERT INTO employees
  (name, address, designation, team, salary)
VALUES
  ('John Doe', '123 Main St', 'Engineer',
   'Backend', 100000.0)
RETURNING employees.id;

-- RETURNING gives us the auto-generated id
-- without needing a second SELECT query`,
    highlights: [
      "RETURNING clause gets the new ID in the same round-trip",
      "PostgreSQL auto-increments the id column (primary key)",
      "db.commit() makes the INSERT permanent",
    ],
  },
  "create:resolver_back": {
    title: "Resolver Returns - New Employee",
    file: "graphql_api.py",
    code: `# After db.refresh(employee):
# employee.id = 44  (auto-generated by PostgreSQL)

# ★ Convert to Strawberry type and return:
return EmployeeType.from_model(employee)

# Returns: EmployeeType(
#   id=44,
#   name="John Doe",
#   address="123 Main St",
#   designation="Engineer",
#   team="Backend",
#   salary=100000.0
# )`,
    highlights: [
      "The new employee now has an ID assigned by PostgreSQL",
      "Returning the created object lets the client use it immediately",
      "No need for a follow-up query to get the new employee's data",
    ],
  },
  "create:strawberry_back": {
    title: "Strawberry Filters - Response Fields",
    file: "Strawberry Engine",
    code: `# Mutation asked for: { id name }
# Resolver returned all fields

# ★ Strawberry only serializes requested fields:
# EmployeeType has: id, name, address,
#   designation, team, salary
#
# Response only includes: id, name
# (because that's all the mutation asked for)

# The client controls the response shape
# even for mutations!`,
    highlights: [
      "Field selection works the same for mutations and queries",
      "Request fewer fields = smaller response = faster",
      "You can request different fields for different use cases",
    ],
  },
  "create:http_back": {
    title: "JSON Response - Created Employee",
    file: "Network",
    code: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "createEmployee": {
      "id": 44,
      "name": "John Doe"
    }
  }
}

// ★ Note: still 200 OK, not 201 Created
// GraphQL doesn't use HTTP status codes
// for success/failure distinction`,
    highlights: [
      "GraphQL always returns 200 — even for creates (unlike REST's 201)",
      "Only the requested fields (id, name) are in the response",
      "Errors would appear in an \"errors\" array alongside \"data\"",
    ],
  },
  "create:apollo_back": {
    title: "Apollo - Refetch Queries",
    file: "Apollo Client",
    code: `// ★ After mutation completes, Apollo runs:
// refetchQueries: [GET_EMPLOYEES]

// This means Apollo automatically re-runs:
// query GetEmployees($offset: 0, $limit: 5) {
//   employees { items { ... } }
// }

// The list refreshes with the new employee included!

// Alternative: cache.modify() to update
// cache directly without a network request
// (more efficient but more code)`,
    highlights: [
      "refetchQueries triggers after the mutation succeeds",
      "The employee list automatically updates with the new data",
      "This is simpler than manual cache updates — costs one extra request",
    ],
  },
  "create:react_back": {
    title: "React Re-render - Form Reset & List Update",
    file: "EmployeeForm.jsx + EmployeeList.jsx",
    code: `// ★ In EmployeeForm:
await createEmployee({ variables: { input } });
setForm(emptyForm);  // form clears

// ★ In EmployeeList:
// Apollo's refetch triggers useQuery to update
// loading: true → false (briefly)
// data.employees.items now includes the new employee

// The table re-renders with the updated list
// All automatic — no manual state synchronization!`,
    highlights: [
      "Form resets after successful mutation",
      "Employee list updates automatically via refetchQueries",
      "Two components stay in sync without shared state management",
    ],
  },
};

const FLOWS = {
  query: {
    label: "GET EMPLOYEES",
    steps: [
      { id: "react", label: "React Component", detail: "useQuery(GET_EMPLOYEES, { variables })" },
      { id: "apollo", label: "Apollo Client", detail: "Check InMemoryCache → cache miss → build POST request" },
      { id: "http", label: "HTTP Request", detail: 'POST /graphql\n{ "query": "{ employees(...) { ... } }", "variables": { offset, limit } }' },
      { id: "fastapi", label: "FastAPI Router", detail: 'Routes POST /graphql → Strawberry' },
      { id: "strawberry", label: "Strawberry Engine", detail: 'Parses query → matches def employees() in Query class' },
      { id: "resolver", label: "Python Resolver", detail: "db.query(Employee).offset(offset).limit(limit).all()" },
      { id: "postgres", label: "PostgreSQL", detail: "SELECT * FROM employees ORDER BY id OFFSET 0 LIMIT 5" },
      { id: "resolver_back", label: "Resolver Returns", detail: "Returns PaginatedEmployees(items=[...], has_more=True)" },
      { id: "strawberry_back", label: "Strawberry Filters", detail: "Strips unrequested fields from response" },
      { id: "http_back", label: "JSON Response", detail: '{ "data": { "employees": { "items": [...] } } }' },
      { id: "apollo_back", label: "Apollo Cache", detail: "Stores result in InMemoryCache" },
      { id: "react_back", label: "React Re-render", detail: "Component re-renders with data → table updates" },
    ],
  },
  create: {
    label: "CREATE EMPLOYEE",
    steps: [
      { id: "react", label: "React Component", detail: "handleSubmit() → createEmployee({ variables: { input } })" },
      { id: "apollo", label: "Apollo Client", detail: "useMutation → builds POST with mutation string" },
      { id: "http", label: "HTTP Request", detail: 'POST /graphql with mutation + variables' },
      { id: "fastapi", label: "FastAPI Router", detail: "POST /graphql → Strawberry GraphQLRouter" },
      { id: "strawberry", label: "Strawberry Engine", detail: 'Parses mutation → matches def create_employee() in Mutation class' },
      { id: "resolver", label: "Python Resolver", detail: "Employee(**input) → db.add() → db.commit()" },
      { id: "postgres", label: "PostgreSQL", detail: "INSERT INTO employees (...) VALUES (...) RETURNING id" },
      { id: "resolver_back", label: "Resolver Returns", detail: "db.refresh(employee) → EmployeeType.from_model()" },
      { id: "strawberry_back", label: "Strawberry Filters", detail: "Filters response to requested fields only" },
      { id: "http_back", label: "JSON Response", detail: '{ "data": { "createEmployee": { "id": 44, ... } } }' },
      { id: "apollo_back", label: "Apollo Refetch", detail: "refetchQueries: [GET_EMPLOYEES] → refreshes list" },
      { id: "react_back", label: "React Re-render", detail: "Form resets → list re-renders with new data" },
    ],
  },
  search: {
    label: "SEARCH EMPLOYEES",
    steps: [
      { id: "react", label: "React Component", detail: "useLazyQuery → searchEmployees({ variables: { query } })" },
      { id: "apollo", label: "Apollo Client", detail: "Lazy query fires → builds POST request" },
      { id: "http", label: "HTTP Request", detail: 'POST /graphql { searchEmployees(query: "eng") { ... } }' },
      { id: "fastapi", label: "FastAPI Router", detail: "POST /graphql → Strawberry" },
      { id: "strawberry", label: "Strawberry Engine", detail: 'Parses query → matches def search_employees() in Query class' },
      { id: "resolver", label: "Python Resolver", detail: "db.query(Employee).filter(ILIKE pattern across 4 columns)" },
      { id: "postgres", label: "PostgreSQL", detail: "SELECT * FROM employees WHERE name ILIKE '%eng%' OR ..." },
      { id: "resolver_back", label: "Resolver Returns", detail: "Returns list[EmployeeType] — flat list, no pagination" },
      { id: "strawberry_back", label: "Strawberry Filters", detail: "Filters each item to requested fields" },
      { id: "http_back", label: "JSON Response", detail: '{ "data": { "searchEmployees": [...] } }' },
      { id: "apollo_back", label: "Apollo Client", detail: "Stores result, updates useLazyQuery return values" },
      { id: "react_back", label: "React Re-render", detail: "Table switches to search results, shows result count" },
    ],
  },
  update: {
    label: "UPDATE EMPLOYEE",
    steps: [
      { id: "react", label: "React Component", detail: "EditEmployeeModal → updateEmployee({ variables: { id, input } })" },
      { id: "apollo", label: "Apollo Client", detail: "useMutation → builds POST with mutation + variables" },
      { id: "http", label: "HTTP Request", detail: 'POST /graphql mutation UpdateEmployee($id, $input) { ... }' },
      { id: "fastapi", label: "FastAPI Router", detail: "POST /graphql → Strawberry" },
      { id: "strawberry", label: "Strawberry Engine", detail: 'Parses mutation → matches def update_employee() in Mutation class' },
      { id: "resolver", label: "Python Resolver", detail: "Find by id → update non-None fields → db.commit()" },
      { id: "postgres", label: "PostgreSQL", detail: "UPDATE employees SET name=..., salary=... WHERE id=24" },
      { id: "resolver_back", label: "Resolver Returns", detail: "db.refresh(emp) → EmployeeType.from_model()" },
      { id: "strawberry_back", label: "Strawberry Filters", detail: "Serializes updated employee to requested fields" },
      { id: "http_back", label: "JSON Response", detail: '{ "data": { "updateEmployee": { ... } } }' },
      { id: "apollo_back", label: "Apollo Refetch", detail: "refetchQueries: [GET_EMPLOYEES] → refreshes list" },
      { id: "react_back", label: "React Re-render", detail: "Modal closes → list re-renders with updated data" },
    ],
  },
  delete: {
    label: "DELETE EMPLOYEE",
    steps: [
      { id: "react", label: "React Component", detail: "confirm() → deleteEmployee({ variables: { id } })" },
      { id: "apollo", label: "Apollo Client", detail: "useMutation → builds POST with delete mutation" },
      { id: "http", label: "HTTP Request", detail: 'POST /graphql mutation DeleteEmployee($id: Int!) { ... }' },
      { id: "fastapi", label: "FastAPI Router", detail: "POST /graphql → Strawberry" },
      { id: "strawberry", label: "Strawberry Engine", detail: 'Parses mutation → matches def delete_employee() in Mutation class' },
      { id: "resolver", label: "Python Resolver", detail: "Find by id → db.delete(emp) → db.commit()" },
      { id: "postgres", label: "PostgreSQL", detail: "DELETE FROM employees WHERE id = 24" },
      { id: "resolver_back", label: "Resolver Returns", detail: 'DeleteResult(success=True, message="Employee 24 deleted")' },
      { id: "strawberry_back", label: "Strawberry Filters", detail: "Serializes { success, message } to response" },
      { id: "http_back", label: "JSON Response", detail: '{ "data": { "deleteEmployee": { "success": true } } }' },
      { id: "apollo_back", label: "Apollo Refetch", detail: "refetchQueries: [GET_EMPLOYEES] → removes from list" },
      { id: "react_back", label: "React Re-render", detail: "Table re-renders — deleted row disappears" },
    ],
  },
  getOne: {
    label: "GET EMPLOYEE BY ID",
    steps: [
      { id: "react", label: "React Component", detail: "useQuery(GET_EMPLOYEE, { variables: { id } })" },
      { id: "apollo", label: "Apollo Client", detail: "Check cache → miss → build POST" },
      { id: "http", label: "HTTP Request", detail: 'POST /graphql { employee(id: 1) { ... } }' },
      { id: "fastapi", label: "FastAPI Router", detail: "POST /graphql → Strawberry" },
      { id: "strawberry", label: "Strawberry Engine", detail: 'Matches def employee(self, id) in Query class' },
      { id: "resolver", label: "Python Resolver", detail: "db.query(Employee).filter(Employee.id == id).first()" },
      { id: "postgres", label: "PostgreSQL", detail: "SELECT * FROM employees WHERE id = 1 LIMIT 1" },
      { id: "resolver_back", label: "Resolver Returns", detail: "EmployeeType.from_model(e) or None" },
      { id: "strawberry_back", label: "Strawberry Filters", detail: "Strips to { id, name, salary }" },
      { id: "http_back", label: "JSON Response", detail: '{ "data": { "employee": { ... } } }' },
      { id: "apollo_back", label: "Apollo Cache", detail: "Stores in cache → next request instant" },
      { id: "react_back", label: "React Re-render", detail: "Component renders with employee data" },
    ],
  },
};

const STEP_DELAY = 1000;

const LAYER_COLORS = {
  react: "#61dafb",
  apollo: "#3f20ba",
  http: "#e535ab",
  fastapi: "#009688",
  strawberry: "#e535ab",
  resolver: "#ff6f00",
  postgres: "#336791",
};

function getColor(stepId) {
  if (stepId.includes("react")) return LAYER_COLORS.react;
  if (stepId.includes("apollo")) return LAYER_COLORS.apollo;
  if (stepId.includes("http")) return LAYER_COLORS.http;
  if (stepId.includes("fastapi")) return LAYER_COLORS.fastapi;
  if (stepId.includes("strawberry")) return LAYER_COLORS.strawberry;
  if (stepId.includes("resolver")) return LAYER_COLORS.resolver;
  if (stepId.includes("postgres")) return LAYER_COLORS.postgres;
  return "#888";
}

function StepModal({ stepId, operation, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const key = `${operation}:${stepId}`;
  const modal = STEP_MODALS[key];

  if (!modal) return null;

  const color = getColor(stepId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ borderTopColor: color }}>
        <div className="modal-header">
          <h3>{modal.title}</h3>
          <span className="modal-file">{modal.file}</span>
        </div>
        <pre className="modal-code">{modal.code}</pre>
        <div className="modal-highlights">
          <h4>Key Points</h4>
          <ul>
            {modal.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
        <div className="modal-nav-row">
          <button className="modal-nav-btn" onClick={onPrev} disabled={!hasPrev}>← Prev</button>
          <button className="modal-close-inline" onClick={onClose}>Close</button>
          <button className="modal-nav-btn" onClick={onNext} disabled={!hasNext}>Next →</button>
        </div>
      </div>
    </div>
  );
}

export default function FlowDiagram({ operation }) {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [modalStep, setModalStep] = useState(null);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  const flow = FLOWS[operation];
  const totalSteps = flow ? flow.steps.length : 0;
  const isFinished = activeStep >= totalSteps - 1;

  const scrollToStep = (stepIndex) => {
    const el = document.getElementById(`flow-step-${stepIndex}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const scheduleNext = useCallback((fromStep) => {
    if (!flow) return;
    const nextStepIdx = fromStep + 1;
    if (nextStepIdx >= flow.steps.length) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setActiveStep(nextStepIdx);
      scrollToStep(nextStepIdx);
      scheduleNext(nextStepIdx);
    }, STEP_DELAY);
  }, [flow]);

  const play = useCallback(() => {
    if (!flow) return;
    setActiveStep(0);
    setIsPlaying(true);
    setIsPaused(false);
    setModalStep(null);
    scrollToStep(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    scheduleNext(0);
  }, [flow, scheduleNext]);

  const pause = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (!flow || activeStep >= flow.steps.length - 1) return;
    setIsPlaying(true);
    setIsPaused(false);
    scheduleNext(activeStep);
  }, [flow, activeStep, scheduleNext]);

  const goNext = useCallback(() => {
    if (!flow) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
    setIsPaused(true);
    const next = Math.min(activeStep + 1, flow.steps.length - 1);
    setActiveStep(next);
    scrollToStep(next);
  }, [flow, activeStep]);

  const goPrev = useCallback(() => {
    if (!flow) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
    setIsPaused(true);
    const prev = Math.max(activeStep - 1, 0);
    setActiveStep(prev);
    scrollToStep(prev);
  }, [flow, activeStep]);

  const handleStepClick = (stepIndex) => {
    pause();
    setActiveStep(stepIndex);
    setModalStep(stepIndex);
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveStep(-1);
    setIsPlaying(false);
    setIsPaused(false);
    setModalStep(null);
    if (flow) {
      setTimeout(() => play(), 100);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [operation]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!flow) {
    return (
      <div className="flow-panel">
        <div className="illustration-header">
          <span>Illustration</span>
        </div>
        <div className="flow-empty">
          <p>Perform an operation on the left to see the GraphQL flow.</p>
        </div>
      </div>
    );
  }

  const hasStarted = activeStep >= 0;

  return (
    <div className="flow-panel">
      <div className="illustration-header">
        <span>Illustration</span>
        <div className="flow-controls">
          <button className="ctrl-btn" onClick={goPrev} disabled={!hasStarted || activeStep === 0} title="Previous step">
            ⏮
          </button>
          {isPlaying ? (
            <button className="ctrl-btn pause-btn" onClick={pause} title="Pause">⏸</button>
          ) : (
            <button className="ctrl-btn play-btn-icon" onClick={isPaused && !isFinished ? resume : play} title={isPaused && !isFinished ? "Resume" : "Play"}>▶</button>
          )}
          <button className="ctrl-btn" onClick={goNext} disabled={isFinished} title="Next step">⏭</button>
          <button className="ctrl-btn replay-btn" onClick={play} title="Restart">↻</button>
          <span className="step-counter">
            {hasStarted ? `${activeStep + 1} / ${totalSteps}` : `- / ${totalSteps}`}
          </span>
        </div>
      </div>

      <div className="flow-tree flow-zigzag" ref={containerRef}>
        {(() => {
          const perRow = Math.ceil(flow.steps.length / 3);
          const rows = [
            flow.steps.slice(0, perRow),
            flow.steps.slice(perRow, perRow * 2),
            flow.steps.slice(perRow * 2),
          ];

          const renderStep = (step, i) => {
            const isActive = activeStep === i;
            const isPast = activeStep > i;
            const color = getColor(step.id);
            return (
              <div
                key={i}
                id={`flow-step-${i}`}
                className={`flow-step ${isActive ? "active" : ""} ${isPast ? "past" : ""}`}
                style={{
                  borderColor: isActive ? color : isPast ? color : "#ddd",
                  backgroundColor: isActive ? color + "18" : "white",
                }}
                onClick={() => handleStepClick(i)}
              >
                <div className="step-number" style={{ backgroundColor: isPast || isActive ? color : "#ccc" }}>{i + 1}</div>
                <div className="step-label" style={{ color: isActive ? color : "#333" }}>{step.label}</div>
                <div className={`step-detail ${isActive ? "visible" : ""}`}>{step.detail}</div>
              </div>
            );
          };

          const renderArrow = (i, direction) => {
            const isActive = activeStep >= i;
            const color = isActive ? getColor(flow.steps[i].id) : "#ccc";
            return (
              <div key={`arrow-${i}-${direction}`} className={`flow-arrow-h ${isActive ? "past" : ""}`} style={{ color }}>
                {direction}
              </div>
            );
          };

          // Row 1: left → right (request)
          // Row 2: right → left (flex-direction: row-reverse handles visual order)
          // Row 3: left → right (response)
          const row1 = rows[0];
          const row2 = rows[1]; // not reversed — row-reverse CSS handles it
          const row3 = rows[2];

          const turn1Active = activeStep >= perRow;
          const turn1Color = turn1Active ? getColor(flow.steps[perRow].id) : "#ccc";
          const turn2Active = activeStep >= perRow * 2;
          const turn2Color = turn2Active ? getColor(flow.steps[perRow * 2].id) : "#ccc";

          return (
            <>
              {/* Row 1: → request */}
              <div className="flow-hu-label">Request →</div>
              <div className="flow-hu-row">
                {row1.map((step, ri) => {
                  const i = ri;
                  return (
                    <div className="flow-h-item" key={i}>
                      {ri > 0 && renderArrow(i, "→")}
                      {renderStep(step, i)}
                    </div>
                  );
                })}
              </div>

              {/* Turn 1: right-side connector */}
              <div className="flow-hu-turn-right" style={{ color: turn1Color }}>
                <span>↓</span>
              </div>

              {/* Row 2: ← middle (row-reverse makes 5,6,7,8 display as 8,7,6,5) */}
              <div className="flow-hu-row flow-hu-row-reverse">
                {row2.map((step, ri) => {
                  const i = perRow + ri;
                  return (
                    <div className="flow-h-item" key={i}>
                      {renderStep(step, i)}
                      {ri > 0 && renderArrow(i, "←")}
                    </div>
                  );
                })}
              </div>

              {/* Turn 2: left-side connector */}
              <div className="flow-hu-turn-left" style={{ color: turn2Color }}>
                <span>↓</span>
              </div>

              {/* Row 3: → response */}
              <div className="flow-hu-row">
                {row3.map((step, ri) => {
                  const i = perRow * 2 + ri;
                  return (
                    <div className="flow-h-item" key={i}>
                      {ri > 0 && renderArrow(i, "→")}
                      {renderStep(step, i)}
                    </div>
                  );
                })}
              </div>
              <div className="flow-hu-label">→ Response</div>
            </>
          );
        })()}
      </div>

      <div className="flow-legend">
        <span className="legend-hint">Click any step for details</span>
        <span><i style={{ background: LAYER_COLORS.react }} /> React</span>
        <span><i style={{ background: LAYER_COLORS.apollo }} /> Apollo</span>
        <span><i style={{ background: LAYER_COLORS.http }} /> HTTP/GraphQL</span>
        <span><i style={{ background: LAYER_COLORS.fastapi }} /> FastAPI</span>
        <span><i style={{ background: LAYER_COLORS.resolver }} /> Resolver</span>
        <span><i style={{ background: LAYER_COLORS.postgres }} /> PostgreSQL</span>
      </div>

      {modalStep !== null && flow.steps[modalStep] && (
        <StepModal
          stepId={flow.steps[modalStep].id}
          operation={operation}
          onClose={() => setModalStep(null)}
          onPrev={() => setModalStep((s) => Math.max(0, s - 1))}
          onNext={() => setModalStep((s) => Math.min(totalSteps - 1, s + 1))}
          hasPrev={modalStep > 0}
          hasNext={modalStep < totalSteps - 1}
        />
      )}
    </div>
  );
}
