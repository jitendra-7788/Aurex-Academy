import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import api from '../../api/client';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/admin/overview').then((res) => setData(res.data.data));
  }, []);
  if (!data) return <div className="empty">Loading overview…</div>;
  return (
    <>
      <h1>Admin overview</h1>
      <div className="stat-grid">
        <div className="stat"><span>Users</span><strong>{data.users.total}</strong></div>
        <div className="stat"><span>Students</span><strong>{data.users.students}</strong></div>
        <div className="stat"><span>Instructors</span><strong>{data.users.instructors}</strong></div>
        <div className="stat"><span>Pending instructors</span><strong>{data.users.pendingInstructors}</strong></div>
        <div className="stat"><span>Courses</span><strong>{data.courses.total}</strong></div>
        <div className="stat"><span>Published</span><strong>{data.courses.published}</strong></div>
        <div className="stat"><span>Enrollments</span><strong>{data.enrollments}</strong></div>
        <div className="stat"><span>Gross payments</span><strong>${data.payments.gross}</strong></div>
      </div>
    </>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const dispatch = useDispatch();
  const load = () => api.get('/admin/users').then((res) => setUsers(res.data.data || []));
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    await api.post(`/admin/users/${id}/approve-instructor`);
    dispatch(showToast({ message: 'Instructor approved', type: 'success' }));
    load();
  };

  const suspend = async (id) => {
    if (!window.confirm('Suspend this user?')) return;
    await api.patch(`/admin/users/${id}`, { status: 'suspended' });
    load();
  };

  return (
    <>
      <h1>User management</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.status}{u.role === 'instructor' && !u.instructorApproved ? ' (pending)' : ''}</td>
                <td style={{ display: 'flex', gap: '0.35rem' }}>
                  {u.role === 'instructor' && !u.instructorApproved && (
                    <button className="btn btn-primary" type="button" onClick={() => approve(u.id)}>Approve</button>
                  )}
                  {u.status !== 'suspended' && (
                    <button className="btn btn-danger" type="button" onClick={() => suspend(u.id)}>Suspend</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Courses() {
  const [courses, setCourses] = useState([]);
  const load = () => api.get('/admin/courses').then((res) => setCourses(res.data.data || []));
  useEffect(() => { load(); }, []);
  const setStatus = async (id, status) => {
    if (status === 'archived' && !window.confirm('Archive this course?')) return;
    await api.patch(`/admin/courses/${id}/status`, { status });
    load();
  };
  return (
    <>
      <h1>Course moderation</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Instructor</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id}>
                <td>{c.title}</td>
                <td>{c.instructor?.name}</td>
                <td>{c.status}</td>
                <td style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" type="button" onClick={() => setStatus(c._id, 'published')}>Publish</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setStatus(c._id, 'draft')}>Draft</button>
                  <button className="btn btn-danger" type="button" onClick={() => setStatus(c._id, 'archived')}>Archive</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SimpleList({ title, endpoint, renderRow }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get(endpoint).then((res) => {
      const payload = res.data.data;
      setItems(payload.payments || payload.liveClasses || payload.certificates || payload.enrollments || payload || []);
    });
  }, [endpoint]);
  return (
    <>
      <h1>{title}</h1>
      <div className="card">
        <table className="table">
          <tbody>{items.map(renderRow)}</tbody>
        </table>
        {!items.length && <div className="empty">No records.</div>}
      </div>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <div className="container page">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <NavLink end to="/admin">Overview</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/courses">Courses</NavLink>
          <NavLink to="/admin/enrollments">Enrollments</NavLink>
          <NavLink to="/admin/live">Live classes</NavLink>
          <NavLink to="/admin/payments">Payments</NavLink>
          <NavLink to="/admin/certificates">Certificates</NavLink>
        </aside>
        <div>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="users" element={<Users />} />
            <Route path="courses" element={<Courses />} />
            <Route
              path="enrollments"
              element={
                <SimpleList
                  title="Enrollments"
                  endpoint="/admin/enrollments"
                  renderRow={(e) => (
                    <tr key={e._id}>
                      <td>{e.student?.name}</td>
                      <td>{e.course?.title}</td>
                      <td>{e.status}</td>
                      <td>{e.progressPercent}%</td>
                    </tr>
                  )}
                />
              }
            />
            <Route
              path="live"
              element={
                <SimpleList
                  title="Live classes"
                  endpoint="/admin/live-classes"
                  renderRow={(c) => (
                    <tr key={c._id}>
                      <td>{c.title}</td>
                      <td>{c.course?.title}</td>
                      <td>{c.status}</td>
                      <td>{new Date(c.scheduledStart).toLocaleString()}</td>
                    </tr>
                  )}
                />
              }
            />
            <Route
              path="payments"
              element={
                <SimpleList
                  title="Payments"
                  endpoint="/admin/payments"
                  renderRow={(p) => (
                    <tr key={p._id}>
                      <td>{p.course?.title}</td>
                      <td>{p.student?.name}</td>
                      <td>${p.amount}</td>
                      <td>{p.status}</td>
                    </tr>
                  )}
                />
              }
            />
            <Route
              path="certificates"
              element={
                <SimpleList
                  title="Certificates"
                  endpoint="/admin/certificates"
                  renderRow={(c) => (
                    <tr key={c._id}>
                      <td>{c.studentName}</td>
                      <td>{c.courseTitle}</td>
                      <td>{c.certificateId}</td>
                      <td>{new Date(c.issuedAt).toLocaleDateString()}</td>
                    </tr>
                  )}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
