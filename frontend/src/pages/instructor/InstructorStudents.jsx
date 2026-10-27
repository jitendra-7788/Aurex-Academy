import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';

export default function InstructorStudents() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/instructor/courses/${courseId}/students`).then((res) => setData(res.data.data));
  }, [courseId]);

  if (!data) return <div className="container page empty">Loading…</div>;

  return (
    <div className="container page">
      <h1>Student progress</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data.enrollments || []).map((e) => (
              <tr key={e._id}>
                <td>{e.student?.name}</td>
                <td>{e.student?.email}</td>
                <td>{e.progressPercent}%</td>
                <td>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
