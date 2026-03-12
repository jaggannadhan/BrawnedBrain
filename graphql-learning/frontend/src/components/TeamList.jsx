import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import { useState } from "react";
import { GET_TEAMS, SEARCH_TEAMS, DELETE_TEAM } from "../graphql/queries";

export default function TeamList({ onOperation, onEdit }) {
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const limit = 5;

  const { data, loading, error } = useQuery(GET_TEAMS, {
    variables: { offset, limit },
    skip: isSearching,
  });

  const [searchTeams, { data: searchData, loading: searchLoading }] = useLazyQuery(SEARCH_TEAMS);

  const [deleteTeam] = useMutation(DELETE_TEAM, {
    refetchQueries: [GET_TEAMS],
  });

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim().length >= 2) {
      setIsSearching(true);
      onOperation("search");
      searchTeams({ variables: { query: value.trim() } });
    } else {
      setIsSearching(false);
    }
  };

  const handleDelete = async (team) => {
    if (!window.confirm(`Delete ${team.name}?`)) return;
    onOperation("delete");
    await deleteTeam({ variables: { id: team.id } });
  };

  const displayLoading = isSearching ? searchLoading : loading;
  const displayItems = isSearching
    ? (searchData?.searchTeams || [])
    : (data?.teams?.items || []);
  const hasMore = !isSearching && data?.teams?.hasMore;
  const nextOffset = !isSearching && data?.teams?.nextOffset;

  if (!isSearching && loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name, location, or head..."
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
            <th>Location</th>
            <th>Budget</th>
            <th>Head</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((team) => (
            <tr key={team.id}>
              <td>{team.id}</td>
              <td>{team.name}</td>
              <td>{team.location || "-"}</td>
              <td>{team.budget ? `$${team.budget.toLocaleString()}` : "-"}</td>
              <td>{team.head || "-"}</td>
              <td className="actions-cell">
                <button className="btn-edit" onClick={() => { onOperation("update"); onEdit(team); }}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(team)}>Delete</button>
              </td>
            </tr>
          ))}
          {displayItems.length === 0 && (
            <tr>
              <td colSpan="6">{isSearching ? "No results found." : "No teams found."}</td>
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
