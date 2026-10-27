import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Loading from '../../components/Loading';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    api
      .get('/certificates/mine')
      .then((res) => {
        setCertificates(res.data.data.certificates || []);
      })
      .catch(() => {
        setCertificates([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const download = async (id, courseTitle) => {
    try {
      const res = await api.get(`/certificates/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate-${courseTitle || 'Aurex Academy'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      dispatch(showToast({ message: 'Certificate downloaded successfully', type: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to download certificate', type: 'error' }));
    }
  };

  if (loading) return <Loading label="Loading your certificates..." />;

  return (
    <div className="container page">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <Link to="/student">Overview</Link>
          <Link to="/courses">Browse Courses</Link>
          <Link className="active" to="/certificates">
            Certificates
          </Link>
          <Link to="/profile">Profile</Link>
        </aside>

        <div>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ marginBottom: '0.25rem' }}>My Certificates</h1>
              <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
                Official, verifiable completion certificates earned across your courses.
              </p>
            </div>
            <Link className="btn btn-secondary" to="/courses">
              Explore More Courses
            </Link>
          </div>

          {certificates.length > 0 ? (
            <div className="grid grid-2" style={{ gap: '1.5rem' }}>
              {certificates.map((c) => (
                <div
                  className="card"
                  key={c._id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge" style={{ background: '#e8f5e9', color: '#1e7a46', fontWeight: 700 }}>
                        ✓ Verified Certificate
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                        {new Date(c.issuedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem', color: 'var(--ink)' }}>
                      {c.courseTitle}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
                      Instructor: {c.instructorName || 'Platform Instructor'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
                      Verification Code: <code>{c.verificationCode}</code>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => download(c._id, c.courseTitle)}
                      style={{ flex: 1 }}
                    >
                      Download PDF
                    </button>
                    {c.verificationCode && (
                      <Link
                        className="btn btn-secondary"
                        to={`/certificates/verify/${c.verificationCode}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.85rem' }}
                      >
                        Public Verify ↗
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                background: 'var(--bg-elevated)',
                border: '2px dashed var(--border)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
              <h3>No Certificates Earned Yet</h3>
              <p style={{ maxWidth: 460, margin: '0 auto 1.5rem', color: 'var(--ink-soft)' }}>
                When you complete 100% of all lessons in an enrolled course, you can request an official
                digitally verifiable certificate of completion.
              </p>
              <Link className="btn btn-primary" to="/student">
                Back to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
