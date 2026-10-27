import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/client';
import { fetchMe } from '../features/auth/authSlice';
import { showToast } from '../features/ui/uiSlice';

export default function ProfilePage() {
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    headline: user?.headline || '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        bio: user.bio || '',
        headline: user.headline || '',
      });
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      dispatch(showToast({ message: 'Name cannot be empty', type: 'error' }));
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch('/auth/profile', {
        name: profile.name.trim(),
        bio: profile.bio.trim(),
        headline: profile.headline.trim(),
      });
      await dispatch(fetchMe());
      dispatch(showToast({ message: 'Profile updated successfully!', type: 'success' }));
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || 'Profile update failed',
          type: 'error',
        })
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 8) {
      dispatch(
        showToast({
          message: 'New password must be at least 8 characters long',
          type: 'error',
        })
      );
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      dispatch(
        showToast({
          message: 'New password and confirmation do not match',
          type: 'error',
        })
      );
      return;
    }

    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      dispatch(showToast({ message: 'Password changed successfully!', type: 'success' }));
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || 'Password change failed',
          type: 'error',
        })
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="container page">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <Link to="/student">Overview</Link>
          <Link to="/courses">Browse Courses</Link>
          <Link to="/certificates">Certificates</Link>
          <Link className="active" to="/profile">
            Profile
          </Link>
        </aside>

        <div>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ marginBottom: '0.25rem' }}>Profile & Account Settings</h1>
              <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
                Manage your student identity, bio, and account credentials.
              </p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {user?.name?.[0] || 'S'}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{user?.name}</h3>
                <p style={{ margin: '0.2rem 0', color: 'var(--ink-soft)', fontSize: '0.95rem' }}>
                  📧 {user?.email}
                </p>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                  <span className="badge" style={{ textTransform: 'capitalize' }}>
                    Role: {user?.role}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: user?.status === 'active' ? '#e8f5e9' : undefined,
                      color: user?.status === 'active' ? '#1e7a46' : undefined,
                      textTransform: 'capitalize',
                      fontWeight: 600,
                    }}
                  >
                    Status: {user?.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            <form className="card" onSubmit={saveProfile}>
              <h3 style={{ marginBottom: '1rem' }}>Edit Profile Information</h3>
              <div className="form-group">
                <label className="label" htmlFor="name">
                  Full Name *
                </label>
                <input
                  id="name"
                  className="input"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="headline">
                  Headline / Profession
                </label>
                <input
                  id="headline"
                  className="input"
                  value={profile.headline}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  placeholder="e.g. Aspiring Full-Stack Developer"
                />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="bio">
                  Short Bio
                </label>
                <textarea
                  id="bio"
                  className="textarea"
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Share a brief introduction about your learning goals"
                />
              </div>

              <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </form>

            <form className="card" onSubmit={changePassword}>
              <h3 style={{ marginBottom: '1rem' }}>Update Password</h3>
              <div className="form-group">
                <label className="label" htmlFor="currentPassword">
                  Current Password *
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  className="input"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="newPassword">
                  New Password * (Min 8 characters)
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="input"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  placeholder="Enter new secure password"
                  required
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="confirmPassword">
                  Confirm New Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  placeholder="Re-enter new password"
                  required
                  minLength={8}
                />
              </div>

              <button className="btn btn-secondary" type="submit" disabled={savingPassword}>
                {savingPassword ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
