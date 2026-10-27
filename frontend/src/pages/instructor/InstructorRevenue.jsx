import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function InstructorRevenue() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/instructor/revenue').then((res) => setData(res.data.data));
  }, []);

  if (!data) return <div className="container page empty">Loading revenue…</div>;

  return (
    <div className="container page">
      <h1>Revenue dashboard</h1>
      <p className="muted">{data.summary.payoutStatus}</p>
      <div className="stat-grid">
        <div className="stat"><span>Gross</span><strong>${data.summary.gross}</strong></div>
        <div className="stat"><span>Refunds</span><strong>${data.summary.refunds}</strong></div>
        <div className="stat"><span>Platform fees</span><strong>${data.summary.platformFees}</strong></div>
        <div className="stat"><span>Est. earnings</span><strong>${data.summary.estimatedEarnings}</strong></div>
      </div>
      <div className="card">
        <h3>Transactions</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Student</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(data.transactions || []).map((t) => (
              <tr key={t._id}>
                <td>{t.course?.title}</td>
                <td>{t.student?.name}</td>
                <td>${t.amount}</td>
                <td>{t.status}</td>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!data.transactions?.length && (
              <tr><td colSpan={5}>No verified transactions yet. Stripe test payments will appear here after webhook/confirm.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
