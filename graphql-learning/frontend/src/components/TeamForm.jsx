import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { CREATE_TEAM, GET_TEAMS } from "../graphql/queries";

const emptyForm = { name: "", location: "", budget: "", head: "" };

export default function TeamForm({ onOperation }) {
  const [form, setForm] = useState(emptyForm);

  const [createTeam, { loading }] = useMutation(CREATE_TEAM, {
    refetchQueries: [GET_TEAMS],
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onOperation("create");
    await createTeam({
      variables: {
        input: {
          name: form.name,
          location: form.location || null,
          budget: form.budget ? parseFloat(form.budget) : null,
          head: form.head || null,
        },
      },
    });
    setForm(emptyForm);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <input name="name" placeholder="Name *" value={form.name} onChange={handleChange} required />
          <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
          <input name="budget" placeholder="Budget" type="number" value={form.budget} onChange={handleChange} />
          <input name="head" placeholder="Head" value={form.head} onChange={handleChange} />
          <button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Team"}
          </button>
        </div>
      </form>
    </div>
  );
}
