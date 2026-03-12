import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { UPDATE_EMPLOYEE, GET_EMPLOYEES, GET_TEAMS } from "../graphql/queries";

export default function EditEmployeeModal({ employee, onClose }) {
  const [form, setForm] = useState({
    name: employee.name || "",
    address: employee.address || "",
    designation: employee.designation || "",
    teamId: employee.team?.id ? String(employee.team.id) : "",
    salary: employee.salary ? String(employee.salary) : "",
  });

  const { data: teamsData } = useQuery(GET_TEAMS, { variables: { offset: 0, limit: 100 } });

  const [updateEmployee, { loading }] = useMutation(UPDATE_EMPLOYEE, {
    refetchQueries: [GET_EMPLOYEES],
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateEmployee({
      variables: {
        id: employee.id,
        input: {
          name: form.name || null,
          address: form.address || null,
          designation: form.designation || null,
          teamId: form.teamId ? parseInt(form.teamId) : null,
          salary: form.salary ? parseFloat(form.salary) : null,
        },
      },
    });
    onClose();
  };

  const teams = teamsData?.teams?.items || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Employee #{employee.id}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Address
            <input name="address" value={form.address} onChange={handleChange} />
          </label>
          <label>
            Designation
            <input name="designation" value={form.designation} onChange={handleChange} />
          </label>
          <label>
            Team
            <select name="teamId" value={form.teamId} onChange={handleChange}>
              <option value="">None</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label>
            Salary
            <input name="salary" type="number" value={form.salary} onChange={handleChange} />
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
