import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: 'Web Development',
    level: 'beginner',
    price: 0,
  });
  const dispatch = useDispatch();

  const load = () => api.get('/courses/instructor/mine').then((res) => setCourses(res.data.data.courses || []));

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/courses', form);
      dispatch(showToast({ message: 'Course created', type: 'success' }));
      setForm({ ...form, title: '', shortDescription: '', description: '' });
      await load();
      window.location.href = `/instructor/courses/${data.data.course._id}`;
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Create failed', type: 'error' }));
    }
  };

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Course management</h1>
        <Link className="btn btn-secondary" to="/instructor">Back</Link>
      </div>

      <form className="card" onSubmit={create} style={{ marginBottom: '1.25rem' }}>
        <h3>Create course</h3>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Category</label>
            <input className="input" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Short description</label>
            <input className="input" required value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Price (0 = free)</label>
            <input className="input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
        </div>
        <div className="form-group">
          <label className="label">Description</label>
          <textarea className="textarea" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="btn btn-primary" type="submit">Create</button>
      </form>

      <div className="grid grid-2">
        {courses.map((c) => (
          <div className="card" key={c._id}>
            <h3>{c.title}</h3>
            <p className="muted">{c.status} · {c.isFree ? 'Free' : `$${c.price}`}</p>
            <Link className="btn btn-primary" to={`/instructor/courses/${c._id}`}>Manage</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
