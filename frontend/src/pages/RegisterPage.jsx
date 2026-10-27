import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, register } from '../features/auth/authSlice';
import { showToast } from '../features/ui/uiSlice';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) {
      if (form.role === 'instructor' && !result.payload.accessToken) {
        dispatch(
          showToast({
            message: 'Instructor registration submitted. Await admin approval before login.',
            type: 'info',
          })
        );
        navigate('/login');
      } else {
        navigate('/student');
      }
    }
  };

  return (
    <div className="container page auth-page" style={{ maxWidth: 520 }}>
      <h1>Create your account</h1>
      <p>Join as a student or apply as an instructor.</p>
      {error && <div className="alert alert-error">{Array.isArray(error) ? JSON.stringify(error) : error}</div>}
      <form className="card" onSubmit={onSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="name">Full name</label>
          <input
            id="name"
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="password">Password (min 8 characters, with letters and numbers)</label>
          <input
            id="password"
            className="input"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Min 8 characters with letters and numbers (e.g. Student123!)"
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="role">I am a</label>
          <select
            id="role"
            className="select"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creating…' : 'Register'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: '1rem' }}>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
