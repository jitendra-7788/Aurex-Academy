import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Loading from '../../components/Loading';

export default function InstructorDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/instructor/dashboard').then((res) => setData(res.data.data));
  }, []);

  if (!data) return <Loading />;

  return (
    <div className="container page">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <Link className="active" to="/instructor">Overview</Link>
          <Link to="/instructor/courses">Courses</Link>
          <Link to="/instructor/quizzes">Quizzes</Link>
          <Link to="/instructor/live">Live classes</Link>
          <Link to="/instructor/revenue">Revenue</Link>
        </aside>
        <div>
          <h1>Instructor dashboard</h1>
          <div className="stat-grid">
            <div className="stat"><span>Courses</span><strong>{data.totals.courses}</strong></div>
            <div className="stat"><span>Enrollments</span><strong>{data.totals.enrollments}</strong></div>
            <div className="stat"><span>Gross</span><strong>${data.totals.grossPayments}</strong></div>
            <div className="stat"><span>Est. earnings</span><strong>${data.totals.estimatedEarnings}</strong></div>
          </div>
          <p className="muted">Payout status: {data.totals.payoutStatus} (not actual bank transfers).</p>

          <h3>Course performance</h3>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Enrollments</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data.courseStats || []).map((c) => (
                  <tr key={c.courseId}>
                    <td>{c.title}</td>
                    <td>{c.status}</td>
                    <td>{c.enrollments}</td>
                    <td>
                      <Link to={`/instructor/courses/${c.courseId}`}>Edit</Link>
                      {' · '}
                      <Link to={`/instructor/courses/${c.courseId}/students`}>Students</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
