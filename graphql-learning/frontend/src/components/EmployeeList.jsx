import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import { useState } from "react";
import { GET_EMPLOYEES, SEARCH_EMPLOYEES, DELETE_EMPLOYEE } from "../graphql/queries";

export default function EmployeeList({ onOperation, onEdit }) {
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const limit = 5;

  const { data, loading, error } = useQuery(GET_EMPLOYEES, {
    variables: { offset, limit },
    skip: isSearching,
  });

  const [searchEmployees, { data: searchData, loading: searchLoading }] = useLazyQuery(SEARCH_EMPLOYEES);

  const [deleteEmployee] = useMutation(DELETE_EMPLOYEE, {
    refetchQueries: [GET_EMPLOYEES],
  });

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim().length >= 2) {
      setIsSearching(true);
      onOperation("search");
      searchEmployees({ variables: { query: value.trim() } });
    } else {
      setIsSearching(false);
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Delete ${emp.name}?`)) return;
    onOperation("delete");
    await deleteEmployee({ variables: { id: emp.id } });
  };

  const displayLoading = isSearching ? searchLoading : loading;
  const displayItems = isSearching
    ? (searchData?.searchEmployees || [])
    : (data?.employees?.items || []);
  const hasMore = !isSearching && data?.employees?.hasMore;
  const nextOffset = !isSearching && data?.employees?.nextOffset;

  if (!isSearching && loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name, team, designation, or address..."
          value={searchTerm}
          onChange={handleSearch}
        />
        {isSearching && (
          <button className="clear-search" onClick={() => { setSearchTerm(""); setIsSearching(false); }}>
            Clear
          </button>
        )}
      </div>

      {displayLoading && <p>Searching...</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Designation</th>
            <th>Team</th>
            <th>Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.id}</td>
              <td>{emp.name}</td>
              <td>{emp.address || "-"}</td>
              <td>{emp.designation || "-"}</td>
              <td>{emp.team?.name || "-"}</td>
              <td>{emp.salary ? `$${emp.salary.toLocaleString()}` : "-"}</td>
              <td className="actions-cell">
                <button className="btn-edit" onClick={() => { onOperation("update"); onEdit(emp); }}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(emp)}>Delete</button>
              </td>
            </tr>
          ))}
          {displayItems.length === 0 && (
            <tr>
              <td colSpan="7">{isSearching ? "No results found." : "No employees found."}</td>
            </tr>
          )}
        </tbody>
      </table>

      {!isSearching && (
        <div className="pagination">
          <button disabled={offset === 0} onClick={() => { setOffset(Math.max(0, offset - limit)); onOperation("query"); }}>
            Previous
          </button>
          <span>Showing {offset + 1} - {offset + displayItems.length}</span>
          <button disabled={!hasMore} onClick={() => { setOffset(nextOffset); onOperation("query"); }}>
            Next
          </button>
        </div>
      )}

      {isSearching && <p className="search-count">{displayItems.length} result(s) found</p>}
    </div>
  );
}
