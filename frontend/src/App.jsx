import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api/students";

const emptyForm = {
  name: "",
  email: "",
  age: "",
  course: "",
};

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const data = await request(API_URL);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        `${err.message}. Make sure your backend and MongoDB are running.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) =>
      [student.name, student.email, student.course]
        .some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        )
    );
  }, [students, search]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function editStudent(student) {
    setForm({
      name: student.name,
      email: student.email,
      age: String(student.age),
      course: student.course,
    });

    setEditingId(student._id);
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim();
    const course = form.course.trim();
    const age = Number(form.age);

    if (!name || !email || !course || !form.age.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!Number.isInteger(age) || age < 1) {
      setError("Age must be a positive whole number.");
      return;
    }

    const payload = { name, email, age, course };

    setSaving(true);

    try {
      if (editingId) {
        await request(`${API_URL}/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setSuccess("Student updated successfully.");
      } else {
        await request(API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Student added successfully.");
      }

      resetForm();
      await loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(student) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await request(`${API_URL}/${student._id}`, {
        method: "DELETE",
      });

      if (editingId === student._id) {
        resetForm();
      }

      setSuccess("Student deleted successfully.");
      await loadStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-icon">S</span>
          Student<span>Hub</span>
        </a>

        <span className="api-status">
          <span className="status-dot" />
          Student Management
        </span>
      </header>

      <section className="hero">
        <p className="eyebrow">STUDENT ADMINISTRATION</p>
        <h1>Manage your students.</h1>
        <p className="subtitle">
          Add, search, update and manage student records in one place.
        </p>
      </section>

      <section className="stats">
        <article className="stat-card">
          <span>Total Students</span>
          <strong>{students.length}</strong>
        </article>

        <article className="stat-card">
          <span>Search Results</span>
          <strong>{filteredStudents.length}</strong>
        </article>

        <article className="stat-card">
          <span>Available Courses</span>
          <strong>
            {new Set(students.map((student) => student.course)).size}
          </strong>
        </article>
      </section>

      {error && (
        <div className="alert error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="alert success" role="status">
          {success}
          <button
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <section className="content-grid">
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">STUDENT DETAILS</p>
              <h2>{editingId ? "Edit Student" : "Add Student"}</h2>
            </div>

            <span className="heading-icon">
              {editingId ? "✎" : "+"}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              placeholder="Enter student name"
              value={form.name}
              onChange={handleChange}
              maxLength={100}
              required
            />

            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="student@example.com"
              value={form.email}
              onChange={handleChange}
              maxLength={254}
              required
            />

            <div className="form-row">
              <div>
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  placeholder="21"
                  min="1"
                  step="1"
                  value={form.age}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="course">Course</label>
                <input
                  id="course"
                  name="course"
                  placeholder="BCA"
                  value={form.course}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <button className="primary-btn" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Student"
                  : "Add Student"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={resetForm}
              >
                Cancel Editing
              </button>
            )}
          </form>
        </div>

        <div className="panel table-panel">
          <div className="panel-heading table-heading">
            <div>
              <p className="eyebrow">STUDENT DIRECTORY</p>
              <h2>All Students</h2>
            </div>

            <button
              className="refresh-btn"
              onClick={loadStudents}
              disabled={loading}
              type="button"
            >
              ↻ Refresh
            </button>
          </div>

          <input
            className="search-input"
            type="search"
            placeholder="Search by name, email or course..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {loading ? (
            <div className="empty-state">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">♧</span>
              <h3>No students found</h3>
              <p>
                {search
                  ? "Try another search term."
                  : "Add your first student using the form."}
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Age</th>
                    <th>Course</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <div className="student-name">
                          <span className="avatar">
                            {student.name?.charAt(0).toUpperCase()}
                          </span>

                          <div>
                            <strong>{student.name}</strong>
                            <small>{student.email}</small>
                          </div>
                        </div>
                      </td>

                      <td>{student.age}</td>

                      <td>
                        <span className="course-badge">
                          {student.course}
                        </span>
                      </td>

                      <td>
                        <div className="actions">
                          <button
                            className="edit-btn"
                            onClick={() => editStudent(student)}
                            aria-label={`Edit ${student.name}`}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() => deleteStudent(student)}
                            aria-label={`Delete ${student.name}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <footer>
        StudentHub · React frontend connected to your Student API
      </footer>
    </main>
  );
}

export default App;