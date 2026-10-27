import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, login } from '../features/auth/authSlice';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((s) => s.auth);

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      const role = result.payload.user.role;
      const dest =
        location.state?.from?.pathname ||
        (role === 'admin' ? '/admin' : role === 'instructor' ? '/instructor' : '/student');
      navigate(dest);
    }
  };

  return (
    <div className="container page auth-page" style={{ maxWidth: 480 }}>
      <h1>Welcome back</h1>
      <p>Sign in to continue learning or teaching.</p>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="card" onSubmit={onSubmit}>
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
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Signing in…' : 'Login'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: '1rem' }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
