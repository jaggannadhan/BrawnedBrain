import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { UPDATE_TEAM, GET_TEAMS } from "../graphql/queries";

export default function EditTeamModal({ team, onClose }) {
  const [form, setForm] = useState({
    name: team.name || "",
    location: team.location || "",
    budget: team.budget ? String(team.budget) : "",
    head: team.head || "",
  });

  const [updateTeam, { loading }] = useMutation(UPDATE_TEAM, {
    refetchQueries: [GET_TEAMS],
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateTeam({
      variables: {
        id: team.id,
        input: {
          name: form.name || null,
          location: form.location || null,
          budget: form.budget ? parseFloat(form.budget) : null,
          head: form.head || null,
        },
      },
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Team #{team.id}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Location
            <input name="location" value={form.location} onChange={handleChange} />
          </label>
          <label>
            Budget
            <input name="budget" type="number" value={form.budget} onChange={handleChange} />
          </label>
          <label>
            Head
            <input name="head" value={form.head} onChange={handleChange} />
          </label>
          <div className="edit-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
