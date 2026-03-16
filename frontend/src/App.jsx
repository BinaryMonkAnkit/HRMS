import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function api(path, options) {
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });

  if (!resp.ok) {
    let message = resp.statusText;
    try {
      const body = await resp.json();
      if (body && body.detail) {
        message = body.detail;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(message || "Request failed");
  }

  // No content (e.g. DELETE 204) – nothing to parse
  if (resp.status === 204 || resp.status === 205) {
    return null;
  }

  return resp.json();
}

const today = new Date().toISOString().slice(0, 10);

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);

  const [newEmployee, setNewEmployee] = useState({
    employee_id: "",
    full_name: "",
    email: "",
    department: "",
  });
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);

  const [attendanceForm, setAttendanceForm] = useState({
    date: today,
    status: "Present",
  });
  const [markingAttendance, setMarkingAttendance] = useState(false);

  const [filterDates, setFilterDates] = useState({
    from_date: "",
    to_date: "",
  });

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  );

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    setEmployeesError(null);
    try {
      const data = await api("/employees");
      setEmployees(data);
      if (!selectedEmployeeId && data.length > 0) {
        setSelectedEmployeeId(data[0].id);
      }
    } catch (e) {
      setEmployeesError(e.message || "Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedEmployeeId) return;
    setAttendanceLoading(true);
    setAttendanceError(null);

    const params = new URLSearchParams();
    if (filterDates.from_date)
      params.append("from_date", filterDates.from_date);
    if (filterDates.to_date) params.append("to_date", filterDates.to_date);
    const qs = params.toString();

    try {
      const data = await api(
        `/employees/${selectedEmployeeId}/attendance${qs ? `?${qs}` : ""}`,
      );
      setAttendanceSummary(data.attendance_summary || null);
    } catch (e) {
      setAttendanceError(e.message || "Failed to load attendance");
      setAttendanceSummary(null);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, filterDates.from_date, filterDates.to_date]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setCreatingEmployee(true);
    setCreateError(null);
    try {
      const payload = {
        ...newEmployee,
        employee_id: newEmployee.employee_id.trim(),
        full_name: newEmployee.full_name.trim(),
        email: newEmployee.email.trim(),
        department: newEmployee.department.trim(),
      };
      const created = await api("/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setEmployees((prev) => [created, ...prev]);
      setNewEmployee({
        employee_id: "",
        full_name: "",
        email: "",
        department: "",
      });
      if (!selectedEmployeeId) {
        setSelectedEmployeeId(created.id);
      }
    } catch (e) {
      setCreateError(e.message || "Failed to create employee");
    } finally {
      setCreatingEmployee(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?",
    );
    if (!confirmed) return;

    try {
      await api(`/employees/${employeeId}`, { method: "DELETE" });
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
      if (selectedEmployeeId === employeeId) {
        setSelectedEmployeeId(null);
        setAttendanceSummary(null);
      }
    } catch (e) {
      alert(e.message || "Failed to delete employee");
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    setMarkingAttendance(true);
    try {
      await api("/attendance", {
        method: "POST",
        body: JSON.stringify({
          employee_id: selectedEmployeeId,
          date: attendanceForm.date,
          status: attendanceForm.status,
        }),
      });
      await loadAttendance();
    } catch (err) {
      alert(err.message || "Failed to mark attendance");
    } finally {
      setMarkingAttendance(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>HRMS</h1>
          <p className="subtitle">
            Simple employee and attendance management for HR admins.
          </p>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Employee Management</h2>
          <p className="section-description">
            Add, view, and remove employees. All fields are required and email
            must be valid.
          </p>

          <form className="card form-grid" onSubmit={handleCreateEmployee}>
            <div className="field">
              <label>Employee ID</label>
              <input
                type="text"
                value={newEmployee.employee_id}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    employee_id: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                value={newEmployee.full_name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, full_name: e.target.value })
                }
                required
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, email: e.target.value })
                }
                required
              />
            </div>
            <div className="field">
              <label>Department</label>
              <input
                type="text"
                value={newEmployee.department}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, department: e.target.value })
                }
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={creatingEmployee}>
                {creatingEmployee ? "Saving..." : "Add Employee"}
              </button>
              {createError && <div className="error-text">{createError}</div>}
            </div>
          </form>

          <div className="card table-card list-card">
            <div className="list-header">
              <h3>Employees</h3>
              {loadingEmployees && (
                <span className="pill pill-muted">Loading...</span>
              )}
            </div>

            {employeesError && (
              <div className="error-banner">{employeesError}</div>
            )}

            {!loadingEmployees && employees.length === 0 && (
              <div className="empty-state">
                <p>No employees yet.</p>
                <p className="empty-sub">
                  Use the form above to add your first employee.
                </p>
              </div>
            )}

            {employees.length > 0 && (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Joined</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr
                        key={emp.id}
                        className={
                          emp.id === selectedEmployeeId ? "row-selected" : ""
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setSelectedEmployeeId(emp.id)}
                          >
                            View
                          </button>
                        </td>
                        <td>{emp.employee_id}</td>
                        <td>{emp.full_name}</td>
                        <td>{emp.email}</td>
                        <td>{emp.department}</td>
                        <td>{new Date(emp.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => handleDeleteEmployee(emp.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Attendance Management</h2>
          <p className="section-description">
            Select an employee from the list and record their daily attendance.
          </p>

          {!selectedEmployee && (
            <div className="card empty-state">
              <p>No employee selected.</p>
              <p className="empty-sub">
                Choose an employee from the left to view attendance.
              </p>
            </div>
          )}

          {selectedEmployee && (
            <>
              <div className="card">
                <div className="employee-summary">
                  <div>
                    <h3>{selectedEmployee.full_name}</h3>
                    <p className="muted">
                      {selectedEmployee.employee_id} ·{" "}
                      {selectedEmployee.department}
                    </p>
                    <p className="muted">{selectedEmployee.email}</p>
                  </div>
                  {attendanceSummary && (
                    <div className="summary-pills">
                      <span className="pill pill-success">
                        Present: {attendanceSummary.total_present}
                      </span>
                      <span className="pill pill-danger">
                        Absent: {attendanceSummary.total_absent}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <form
                className="card attendance-form"
                onSubmit={handleMarkAttendance}
              >
                <h3>Mark Attendance</h3>
                <div className="form-row">
                  <div className="field">
                    <label>Date (no future dates)</label>
                    <input
                      type="date"
                      value={attendanceForm.date}
                      max={today}
                      onChange={(e) =>
                        setAttendanceForm((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select
                      value={attendanceForm.status}
                      onChange={(e) =>
                        setAttendanceForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="submit" disabled={markingAttendance}>
                      {markingAttendance ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </form>

              <div className="card table-card">
                <div className="list-header">
                  <h3>Attendance Records</h3>
                  <div className="filter-row">
                    <div className="field">
                      <label>From</label>
                      <input
                        type="date"
                        value={filterDates.from_date}
                        max={today}
                        onChange={(e) =>
                          setFilterDates((prev) => ({
                            ...prev,
                            from_date: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label>To</label>
                      <input
                        type="date"
                        value={filterDates.to_date}
                        max={today}
                        onChange={(e) =>
                          setFilterDates((prev) => ({
                            ...prev,
                            to_date: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {attendanceError && (
                  <div className="error-banner">{attendanceError}</div>
                )}

                {attendanceLoading && (
                  <div className="empty-state">
                    <p>Loading attendance...</p>
                  </div>
                )}

                {!attendanceLoading &&
                  (!attendanceSummary ||
                    attendanceSummary.records.length === 0) && (
                    <div className="empty-state">
                      <p>No attendance records for this employee.</p>
                      <p className="empty-sub">
                        Use the form above to mark attendance.
                      </p>
                    </div>
                  )}

                {!attendanceLoading &&
                  attendanceSummary &&
                  attendanceSummary.records.length > 0 && (
                    <div className="table-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceSummary.records.map((rec) => (
                            <tr key={rec.id}>
                              <td>{new Date(rec.date).toLocaleDateString()}</td>
                              <td>
                                <span
                                  className={
                                    rec.status === "Present"
                                      ? "pill pill-success"
                                      : "pill pill-danger"
                                  }
                                >
                                  {rec.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span>
          HRMS · Demo application for employee and attendance management.
        </span>
      </footer>
    </div>
  );
};

export default App;
