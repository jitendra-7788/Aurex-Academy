import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

const nowPlus1Hour = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  // Format as "YYYY-MM-DDTHH:MM" for datetime-local input
  return d.toISOString().slice(0, 16);
};

const emptyForm = () => ({
  courseId: '',
  title: '',
  description: '',
  scheduledStart: nowPlus1Hour(),
  durationMinutes: 60,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
});

export default function InstructorLiveClasses() {
  const [courses, setCourses]   = useState([]);
  const [classes, setClasses]   = useState([]);
  const [form, setForm]         = useState(emptyForm());
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();

  const loadClasses = () =>
    api.get('/live-classes/mine')
      .then((res) => setClasses(res.data.data.liveClasses || []))
      .catch(() => setClasses([]));

  useEffect(() => {
    Promise.all([
      api.get('/courses/instructor/mine'),
      api.get('/live-classes/mine').catch(() => ({ data: { data: { liveClasses: [] } } })),
    ])
      .then(([cRes, lRes]) => {
        const list = cRes.data.data.courses || [];
        setCourses(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, courseId: list[0]._id }));
        }
        setClasses(lRes.data.data.liveClasses || []);
      })
      .catch(() => dispatch(showToast({ message: 'Failed to load data', type: 'error' })))
      .finally(() => setLoading(false));
  }, []);

  const handleField = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const schedule = async (e) => {
    e.preventDefault();
    if (!form.courseId) {
      dispatch(showToast({ message: 'Please select a course first', type: 'error' }));
      return;
    }
    if (!form.title.trim()) {
      dispatch(showToast({ message: 'Title is required', type: 'error' }));
      return;
    }
    if (!form.scheduledStart) {
      dispatch(showToast({ message: 'Start date/time is required', type: 'error' }));
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/live-classes', {
        courseId:       form.courseId,
        title:          form.title,
        description:    form.description,
        scheduledStart: new Date(form.scheduledStart).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        timezone:       form.timezone,
      });
      dispatch(showToast({ message: 'Live class scheduled!', type: 'success' }));
      setForm((f) => ({ ...emptyForm(), courseId: f.courseId }));
      loadClasses();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to schedule class', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const start = async (id) => {
    try {
      await api.post(`/live-classes/${id}/start`);
      dispatch(showToast({ message: 'Class started!', type: 'success' }));
      loadClasses();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to start', type: 'error' }));
    }
  };

  const end = async (id) => {
    try {
      await api.post(`/live-classes/${id}/end`);
      dispatch(showToast({ message: 'Class ended', type: 'success' }));
      loadClasses();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to end', type: 'error' }));
    }
  };

  const statusBadge = (status) => {
    const colors = {
      scheduled: '#6366f1',
      live:      '#22c55e',
      ended:     '#64748b',
      cancelled: '#ef4444',
    };
    return (
      <span style={{
        padding: '0.2rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        background: colors[status] || '#64748b',
        color: '#fff',
      }}>
        {status}
      </span>
    );
  };

  if (loading) return <div className="container page"><p>Loading…</p></div>;

  if (courses.length === 0) {
    return (
      <div className="container page">
        <h1>Live Classes</h1>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
            You need to create a course before you can schedule live classes.
          </p>
          <Link className="btn btn-primary" to="/instructor/courses">
            Create Your First Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1>Live Classes</h1>

      {/* Schedule form */}
      <form className="card" onSubmit={schedule} style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Schedule a Live Class</h3>

        <div className="grid grid-2">
          <div className="form-group">
            <label className="label">Course *</label>
            <select
              className="select"
              name="courseId"
              value={form.courseId}
              onChange={handleField}
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Session Title *</label>
            <input
              className="input"
              name="title"
              required
              placeholder="e.g. Introduction to React Hooks"
              value={form.title}
              onChange={handleField}
            />
          </div>

          <div className="form-group">
            <label className="label">Start Date &amp; Time *</label>
            <input
              className="input"
              type="datetime-local"
              name="scheduledStart"
              required
              value={form.scheduledStart}
              onChange={handleField}
            />
          </div>

          <div className="form-group">
            <label className="label">Duration (minutes)</label>
            <input
              className="input"
              type="number"
              name="durationMinutes"
              min="15"
              max="480"
              value={form.durationMinutes}
              onChange={handleField}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Description (optional)</label>
          <input
            className="input"
            name="description"
            placeholder="What will be covered in this session?"
            value={form.description}
            onChange={handleField}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Scheduling…' : 'Schedule Class'}
        </button>
      </form>

      {/* Classes list */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>
          Your Live Classes ({classes.length})
        </h3>
        {classes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No live classes scheduled yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Course</th>
                <th>Scheduled</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c._id}>
                  <td>{c.title}</td>
                  <td>{c.course?.title || '—'}</td>
                  <td>{new Date(c.scheduledStart).toLocaleString()}</td>
                  <td>{c.durationMinutes} min</td>
                  <td>{statusBadge(c.status)}</td>
                  <td style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {c.status === 'scheduled' && (
                      <button className="btn btn-secondary" type="button" onClick={() => start(c._id)}>
                        Start
                      </button>
                    )}
                    {c.status === 'live' && (
                      <>
                        <Link className="btn btn-primary" to={`/live/${c._id}`}>
                          Join
                        </Link>
                        <button className="btn btn-secondary" type="button" onClick={() => end(c._id)}>
                          End
                        </button>
                      </>
                    )}
                    {['ended', 'cancelled'].includes(c.status) && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Finished</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
