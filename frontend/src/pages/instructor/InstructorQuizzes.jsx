import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

const emptyForm = {
  title: '',
  description: '',
  passingScore: 70,
  timeLimitMinutes: 30,
  maxAttempts: 3,
  prompt: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correct: 'A',
  points: 5,
};

export default function InstructorQuizzes() {
  const [courses, setCourses]   = useState([]);
  const [courseId, setCourseId] = useState('');
  const [quizzes, setQuizzes]   = useState([]);
  const [form, setForm]         = useState(emptyForm);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();

  // Load instructor's courses on mount
  useEffect(() => {
    api.get('/courses/instructor/mine')
      .then((res) => {
        const list = res.data.data.courses || [];
        setCourses(list);
        if (list.length > 0) setCourseId(list[0]._id);
      })
      .catch(() => dispatch(showToast({ message: 'Failed to load courses', type: 'error' })))
      .finally(() => setLoading(false));
  }, []);

  // Load quizzes whenever selected course changes
  useEffect(() => {
    if (!courseId) return;
    api.get(`/quizzes/course/${courseId}`)
      .then((res) => setQuizzes(res.data.data.quizzes || []))
      .catch(() => setQuizzes([]));
  }, [courseId]);

  const handleField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    if (!courseId) {
      dispatch(showToast({ message: 'Please select a course first', type: 'error' }));
      return;
    }
    setSubmitting(true);
    try {
      const correctMap = { A: form.optionA, B: form.optionB, C: form.optionC, D: form.optionD };
      await api.post('/quizzes', {
        courseId,
        title:            form.title,
        description:      form.description,
        passingScore:     Number(form.passingScore),
        timeLimitMinutes: Number(form.timeLimitMinutes),
        maxAttempts:      Number(form.maxAttempts),
        isPublished:      true,
        questions: [
          {
            prompt:  form.prompt,
            points:  Number(form.points),
            options: [
              { text: form.optionA, isCorrect: form.correct === 'A' },
              { text: form.optionB, isCorrect: form.correct === 'B' },
              ...(form.optionC ? [{ text: form.optionC, isCorrect: form.correct === 'C' }] : []),
              ...(form.optionD ? [{ text: form.optionD, isCorrect: form.correct === 'D' }] : []),
            ],
          },
        ],
      });
      dispatch(showToast({ message: 'Quiz created successfully!', type: 'success' }));
      setForm(emptyForm);
      const res2 = await api.get(`/quizzes/course/${courseId}`);
      setQuizzes(res2.data.data.quizzes || []);
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Failed to create quiz', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container page"><p>Loading…</p></div>;

  if (courses.length === 0) {
    return (
      <div className="container page">
        <h1>Quiz Management</h1>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
            You need to create a course before you can add quizzes.
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
      <h1>Quiz Management</h1>

      {/* Course selector */}
      <div className="form-group" style={{ maxWidth: 400, marginBottom: '1.5rem' }}>
        <label className="label">Select Course</label>
        <select
          className="select"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Create quiz form */}
      <form className="card" onSubmit={create} style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Create New Quiz</h3>

        <div className="grid grid-2">
          <div className="form-group">
            <label className="label">Quiz Title *</label>
            <input
              className="input"
              name="title"
              required
              placeholder="e.g. Chapter 1 Assessment"
              value={form.title}
              onChange={handleField}
            />
          </div>
          <div className="form-group">
            <label className="label">Passing Score (%)</label>
            <input
              className="input"
              name="passingScore"
              type="number"
              min="0"
              max="100"
              value={form.passingScore}
              onChange={handleField}
            />
          </div>
          <div className="form-group">
            <label className="label">Time Limit (minutes, 0 = unlimited)</label>
            <input
              className="input"
              name="timeLimitMinutes"
              type="number"
              min="0"
              value={form.timeLimitMinutes}
              onChange={handleField}
            />
          </div>
          <div className="form-group">
            <label className="label">Max Attempts (0 = unlimited)</label>
            <input
              className="input"
              name="maxAttempts"
              type="number"
              min="0"
              value={form.maxAttempts}
              onChange={handleField}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Description</label>
          <input
            className="input"
            name="description"
            placeholder="Brief description of this quiz"
            value={form.description}
            onChange={handleField}
          />
        </div>

        <hr style={{ margin: '1rem 0', borderColor: 'var(--border)' }} />
        <h4 style={{ marginBottom: '0.75rem' }}>Starter Question</h4>

        <div className="grid grid-2">
          <div className="form-group">
            <label className="label">Question *</label>
            <input
              className="input"
              name="prompt"
              required
              placeholder="Enter your question"
              value={form.prompt}
              onChange={handleField}
            />
          </div>
          <div className="form-group">
            <label className="label">Points per question</label>
            <input
              className="input"
              name="points"
              type="number"
              min="1"
              value={form.points}
              onChange={handleField}
            />
          </div>
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label className="label">Option A *</label>
            <input className="input" name="optionA" required value={form.optionA} onChange={handleField} />
          </div>
          <div className="form-group">
            <label className="label">Option B *</label>
            <input className="input" name="optionB" required value={form.optionB} onChange={handleField} />
          </div>
          <div className="form-group">
            <label className="label">Option C (optional)</label>
            <input className="input" name="optionC" value={form.optionC} onChange={handleField} />
          </div>
          <div className="form-group">
            <label className="label">Option D (optional)</label>
            <input className="input" name="optionD" value={form.optionD} onChange={handleField} />
          </div>
        </div>

        <div className="form-group" style={{ maxWidth: 200 }}>
          <label className="label">Correct Answer</label>
          <select className="select" name="correct" value={form.correct} onChange={handleField}>
            <option value="A">A</option>
            <option value="B">B</option>
            {form.optionC && <option value="C">C</option>}
            {form.optionD && <option value="D">D</option>}
          </select>
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Quiz'}
        </button>
      </form>

      {/* Quizzes list */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>
          Quizzes for this course ({quizzes.length})
        </h3>
        {quizzes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No quizzes yet. Create one above.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Questions</th>
                <th>Passing</th>
                <th>Time Limit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q._id}>
                  <td>{q.title}</td>
                  <td>{q.questions?.length || 0}</td>
                  <td>{q.passingScore}%</td>
                  <td>{q.timeLimitMinutes ? `${q.timeLimitMinutes} min` : 'Unlimited'}</td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      background: q.isPublished ? 'var(--success, #22c55e)' : 'var(--warning, #f59e0b)',
                      color: '#fff',
                    }}>
                      {q.isPublished ? 'Published' : 'Draft'}
                    </span>
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
