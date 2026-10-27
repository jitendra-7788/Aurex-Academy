import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { clearToast } from '../features/ui/uiSlice';
import { useEffect } from 'react';

export default function Layout() {
  const { user } = useSelector((s) => s.auth);
  const toast = useSelector((s) => s.ui.toast);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => dispatch(clearToast()), 3500);
    return () => clearTimeout(t);
  }, [toast, dispatch]);

  const onLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  return (
    <>
      <header className="site-header">
        <div className="container nav">
          <Link to="/" className="brand">
            Aurex <span>Academy</span>
          </Link>
          <nav className="nav-links">
            <NavLink to="/courses">Courses</NavLink>
            {user?.role === 'student' && <NavLink to="/student">Dashboard</NavLink>}
            {user?.role === 'instructor' && <NavLink to="/instructor">Instructor</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
            {!user && (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link className="btn btn-primary" to="/register">
                  Get started
                </Link>
              </>
            )}
            {user && (
              <>
                <NavLink to="/profile">{user.name}</NavLink>
                <button type="button" className="btn btn-secondary" onClick={onLogout}>
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      {toast && <div className="toast">{toast.message}</div>}
    </>
  );
}
