import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { CREATE_EMPLOYEE, GET_EMPLOYEES, GET_TEAMS } from "../graphql/queries";

const emptyForm = { name: "", address: "", designation: "", teamId: "", salary: "" };

export default function EmployeeForm({ onOperation }) {
  const [form, setForm] = useState(emptyForm);

  const { data: teamsData } = useQuery(GET_TEAMS, { variables: { offset: 0, limit: 100 } });

  const [createEmployee, { loading }] = useMutation(CREATE_EMPLOYEE, {
    refetchQueries: [GET_EMPLOYEES],
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onOperation("create");
    await createEmployee({
      variables: {
        input: {
          name: form.name,
          address: form.address || null,
          designation: form.designation || null,
          teamId: form.teamId ? parseInt(form.teamId) : null,
          salary: form.salary ? parseFloat(form.salary) : null,
        },
      },
    });
    setForm(emptyForm);
  };

  const teams = teamsData?.teams?.items || [];

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <input name="name" placeholder="Name *" value={form.name} onChange={handleChange} required />
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
          <input name="designation" placeholder="Designation" value={form.designation} onChange={handleChange} />
          <select name="teamId" value={form.teamId} onChange={handleChange}>
            <option value="">Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input name="salary" placeholder="Salary" type="number" value={form.salary} onChange={handleChange} />
          <button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
