import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../api/client';
import Loading from '../../components/Loading';
import { showToast } from '../../features/ui/uiSlice';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    api
      .get('/progress/dashboard')
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        dispatch(
          showToast({
            message: err.response?.data?.message || 'Failed to load dashboard data',
            type: 'error',
          })
        );
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const downloadCertificate = async (id, courseTitle) => {
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
      dispatch(showToast({ message: 'Certificate downloaded', type: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to download certificate', type: 'error' }));
    }
  };

  if (loading) return <Loading label="Loading student dashboard..." />;
  if (!data) {
    return (
      <div className="container page empty" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Unable to load dashboard</h2>
        <p className="muted">Please check your connection and try refreshing.</p>
        <Link className="btn btn-primary" to="/courses">
          Browse Courses
        </Link>
      </div>
    );
  }

  const continueLearningList = data.continueLearning || [];
  const allEnrollments = data.enrollments || [];
  const upcomingClasses = data.upcomingClasses || [];
  const publishedQuizzes = data.publishedQuizzes || [];
  const recentQuizzes = data.recentQuizzes || [];
  const certificates = data.certificates || [];

  return (
    <div className="container page student-dashboard">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <Link className="active" to="/student">
            Overview
          </Link>
          <Link to="/courses">
            Browse Courses
          </Link>
          <Link to="/certificates">
            Certificates
          </Link>
          <Link to="/profile">
            Profile
          </Link>
        </aside>

        <div>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ marginBottom: '0.25rem' }}>Welcome, {user?.name || 'Student'}!</h1>
              <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
                Track your active learning progress, upcoming live classes, quiz scores, and certifications.
              </p>
            </div>
            <Link className="btn btn-secondary" to="/courses">
              Explore More Courses
            </Link>
          </div>

          {/* Section 1: Continue Learning */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Continue Learning</h2>
              <span style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                {continueLearningList.length} in progress
              </span>
            </div>

            {continueLearningList.length > 0 ? (
              <div className="grid grid-2" style={{ gap: '1.25rem' }}>
                {continueLearningList.map((e) => (
                  <div className="card" key={e._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge">{e.course?.category || 'Course'}</span>
                        <span className="badge badge-warm" style={{ textTransform: 'capitalize' }}>
                          {e.course?.level || 'Beginner'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{e.course?.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
                        Instructor: {e.course?.instructor?.name || 'Instructor'}
                      </p>
                    </div>

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          marginBottom: '0.35rem',
                        }}
                      >
                        <span>Course Completion</span>
                        <span>{e.progressPercent || 0}%</span>
                      </div>
                      <div className="progress" style={{ marginBottom: '1rem' }}>
                        <span style={{ width: `${e.progressPercent || 0}%` }} />
                      </div>
                      <Link className="btn btn-primary" to={`/learn/${e.course?._id}`} style={{ width: '100%', textAlign: 'center' }}>
                        Resume Learning →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="card"
                style={{
                  textAlign: 'center',
                  padding: '2rem 1.5rem',
                  background: 'var(--bg-elevated)',
                  border: '1px dashed var(--border)',
                }}
              >
                <h3 style={{ marginBottom: '0.4rem' }}>No Active In-Progress Courses</h3>
                <p style={{ maxWidth: 450, margin: '0 auto 1.25rem', color: 'var(--ink-soft)', fontSize: '0.95rem' }}>
                  You don&apos;t have any unfinished enrolled courses right now. Browse our catalog to enroll in free courses in Web Development, Python, SQL, or AI.
                </p>
                <Link className="btn btn-primary" to="/courses">
                  Browse Course Catalog
                </Link>
              </div>
            )}
          </div>

          {/* Section 2: Upcoming Live Classes & Recent Quiz Results */}
          <div className="student-dashboard__activity-grid">
            {/* Column A: Upcoming Live Classes */}
            <section className="student-panel student-panel--live">
              <div className="student-panel__heading">
                <div className="student-panel__title-group">
                  <span className="student-panel__icon student-panel__icon--live" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="6" width="13" height="12" rx="3" />
                      <path d="m16 10 5-3v10l-5-3" />
                      <path d="M7 3v3m5-3v3" />
                    </svg>
                  </span>
                  <div>
                    <p className="student-panel__eyebrow">LEARN TOGETHER</p>
                    <h2>Live classes</h2>
                  </div>
                </div>
                <span className="student-count-badge">
                  {upcomingClasses.length} <span>upcoming</span>
                </span>
              </div>

              {upcomingClasses.length > 0 ? (
                <div className="student-item-list">
                  {upcomingClasses.map((c) => (
                    <article className="student-live-card" key={c._id}>
                      <div className="student-live-card__date" aria-hidden="true">
                        <span>{new Date(c.scheduledStart).toLocaleDateString([], { month: 'short' })}</span>
                        <strong>{new Date(c.scheduledStart).toLocaleDateString([], { day: '2-digit' })}</strong>
                      </div>
                      <div className="student-live-card__content">
                        <div className="student-live-card__topline">
                          <span className={`student-status student-status--${c.status === 'live' ? 'live' : 'scheduled'}`}>
                            <span aria-hidden="true" />
                            {c.status === 'live' ? 'Live now' : 'Scheduled'}
                          </span>
                        </div>
                        <h3>{c.title}</h3>
                        <p className="student-live-card__course">{c.course?.title || 'Course session'}</p>
                        <p className="student-live-card__time">
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 2" />
                          </svg>
                          {new Date(c.scheduledStart).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <Link
                        className="student-action student-action--outline"
                        to={`/live/${c._id}`}
                      >
                        Join room
                        <span aria-hidden="true">→</span>
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="student-empty-state">
                  <span className="student-empty-state__icon" aria-hidden="true">◷</span>
                  <h3>Your next class will show up here</h3>
                  <p>No live classes are scheduled for your courses right now.</p>
                </div>
              )}
            </section>

            {/* Column B: Recent Quiz Results */}
            <section className="student-panel student-panel--results">
              <div className="student-panel__heading">
                <div className="student-panel__title-group">
                  <span className="student-panel__icon student-panel__icon--quiz" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" />
                      <path d="M14 4v4h4M9 13h6m-6 3h4" />
                      <path d="m8.5 10 .7.7 1.3-1.5" />
                    </svg>
                  </span>
                  <div>
                    <p className="student-panel__eyebrow">YOUR PROGRESS</p>
                    <h2>Quiz results</h2>
                  </div>
                </div>
                <span className="student-count-badge">
                  {recentQuizzes.length} <span>attempted</span>
                </span>
              </div>

              {recentQuizzes.length > 0 ? (
                <div className="student-item-list">
                  {recentQuizzes.map((q) => (
                    <article className="student-result-card" key={q._id}>
                      <span className={`student-result-card__mark ${q.passed ? 'student-result-card__mark--pass' : 'student-result-card__mark--retry'}`} aria-hidden="true">
                        {q.passed ? '✓' : '↗'}
                      </span>
                      <div className="student-result-card__content">
                        <h3>
                          {q.quiz?.title || 'Course Quiz'}
                        </h3>
                        <p>
                          {q.course?.title ? `${q.course.title} · ` : ''}
                          {q.score}/{q.maxScore} points
                        </p>
                      </div>
                      <span className={`student-score-badge ${q.passed ? 'student-score-badge--pass' : 'student-score-badge--retry'}`}>
                        <strong>{q.percentage}%</strong>
                        {q.passed ? 'Passed' : 'Retry'}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="student-empty-state">
                  <span className="student-empty-state__icon" aria-hidden="true">✓</span>
                  <h3>Your results will appear here</h3>
                  <p>Complete a quiz to see your score and progress.</p>
                </div>
              )}
            </section>
          </div>

          {/* Available quizzes */}
          <section className="student-quiz-section">
            <div className="student-section-heading">
              <div className="student-panel__title-group">
                <span className="student-panel__icon student-panel__icon--quiz" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" />
                    <path d="M14 4v4h4M9 13h6m-6 3h4" />
                    <path d="m8.5 10 .7.7 1.3-1.5" />
                  </svg>
                </span>
                <div>
                  <p className="student-panel__eyebrow">KEEP THE MOMENTUM</p>
                  <h2>Quizzes to explore</h2>
                </div>
              </div>
              <span className="student-count-badge">
                {publishedQuizzes.length} <span>available</span>
              </span>
            </div>

            {publishedQuizzes.length > 0 ? (
              <div className="student-quiz-grid">
                {publishedQuizzes.map((quiz) => (
                  <article className="student-quiz-card" key={quiz.id || quiz._id}>
                    <div className="student-quiz-card__top">
                      <span className="student-quiz-card__icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" />
                          <path d="M14 4v4h4M9 13h6m-6 3h4" />
                        </svg>
                      </span>
                      <span className="student-status student-status--available">
                        Available
                      </span>
                    </div>
                    <h3>{quiz.title}</h3>
                    <p className="student-quiz-card__course">{quiz.course?.title || 'Enrolled course'}</p>
                    <div className="student-quiz-card__meta">
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 5.5h14v14H5zM8 3v5m8-5v5M5 10h14" />
                        </svg>
                        {quiz.questionCount} questions
                      </span>
                      {quiz.timeLimitMinutes > 0 && (
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 2" />
                          </svg>
                          {quiz.timeLimitMinutes} min
                        </span>
                      )}
                    </div>
                    <Link
                      className="student-action student-action--primary"
                      to={`/quizzes/${quiz.id || quiz._id}`}
                    >
                      Start quiz <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="student-empty-state student-empty-state--wide">
                <span className="student-empty-state__icon" aria-hidden="true">✦</span>
                <h3>New challenges are on the way</h3>
                <p>Published quizzes for your enrolled courses will appear here.</p>
              </div>
            )}
          </section>

          {/* Section 3: My Courses */}
          <section className="student-enrolled-section">
            <div className="student-enrolled-section__heading">
              <div>
                <p className="student-panel__eyebrow">YOUR LEARNING PATH</p>
                <h2>My Enrolled Courses</h2>
              </div>
              <span className="student-count-badge">
                {allEnrollments.length} enrolled
              </span>
            </div>

            {allEnrollments.length > 0 ? (
              <div className="student-course-grid">
                {allEnrollments.map((e, index) => (
                  <article
                    className={`student-course-card student-course-card--tone-${index % 3}`}
                    key={e._id}
                  >
                    <div className="student-course-card__banner">
                      <span className="student-course-card__banner-mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
                          <path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h7m-7 3h5" />
                        </svg>
                      </span>
                      <span className="student-course-card__category">
                        {e.course?.category || 'Course'}
                      </span>
                      <span className={`student-course-card__status ${e.status === 'completed' ? 'student-course-card__status--complete' : 'student-course-card__status--active'}`}>
                        <span aria-hidden="true">{e.status === 'completed' ? '✓' : '•'}</span>
                        {e.status === 'completed' ? 'Completed' : 'In progress'}
                      </span>
                      <span className="student-course-card__banner-shape" />
                    </div>

                    <div className="student-course-card__body">
                      <h3>{e.course?.title}</h3>
                      <p className="student-course-card__instructor">
                        <span className="student-course-card__instructor-avatar" aria-hidden="true">
                          {(e.course?.instructor?.name || 'I').charAt(0).toUpperCase()}
                        </span>
                        <span>With <strong>{e.course?.instructor?.name || 'Instructor'}</strong></span>
                      </p>

                      <div className="student-course-card__progress-heading">
                        <span>Course progress</span>
                        <strong>{e.progressPercent || 0}%</strong>
                      </div>
                      <div
                        className="student-course-card__progress"
                        role="progressbar"
                        aria-label={`${e.course?.title || 'Course'} progress`}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={e.progressPercent || 0}
                      >
                        <span style={{ width: `${e.progressPercent || 0}%` }} />
                      </div>
                      <div className="student-course-card__progress-caption">
                        {e.status === 'completed' ? 'Course completed' : 'Keep up your learning streak'}
                      </div>
                      <Link
                        className={`student-course-card__action ${e.status === 'completed' ? 'student-course-card__action--review' : ''}`}
                        to={`/learn/${e.course?._id}`}
                      >
                        <span>{e.status === 'completed' ? 'Review course material' : 'Continue learning'}</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div
                className="card"
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 1.5rem',
                  background: 'var(--bg-elevated)',
                  border: '1px dashed var(--border)',
                }}
              >
                <h3>You are not enrolled in any courses yet</h3>
                <p style={{ maxWidth: 450, margin: '0 auto 1.25rem', color: 'var(--ink-soft)' }}>
                  Enroll in our free hands-on courses in Web Development, Python, SQL, or Generative AI to start earning certificates!
                </p>
                <Link className="btn btn-primary" to="/courses">
                  Browse Course Catalog
                </Link>
              </div>
            )}
          </section>

          {/* Certifications */}
          <section className="student-certifications">
            <div className="student-section-heading">
              <div className="student-panel__title-group">
                <span className="student-panel__icon student-panel__icon--live" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="5" />
                    <path d="m8.5 12-1 8 4.5-2.5 4.5 2.5-1-8" />
                    <path d="m10 8 1.3 1.3L14.5 6" />
                  </svg>
                </span>
                <div>
                  <p className="student-panel__eyebrow">YOUR ACHIEVEMENTS</p>
                  <h2>Certifications</h2>
                </div>
              </div>
              <Link className="student-certifications__view-all" to="/certificates">
                View all <span aria-hidden="true">→</span>
              </Link>
            </div>

            {certificates.length > 0 ? (
              <div className="student-certificate-grid">
                {certificates.map((cert) => (
                  <article className="student-certificate-card" key={cert._id}>
                    <div className="student-certificate-card__seal" aria-hidden="true">
                      <svg viewBox="0 0 40 40">
                        <circle cx="20" cy="16" r="9.5" />
                        <path d="m13.5 23-1.5 13 8-4.5 8 4.5-1.5-13" />
                        <path d="m16.5 16 2.3 2.3 4.8-5" />
                      </svg>
                    </div>
                    <div className="student-certificate-card__body">
                      <div className="student-certificate-card__topline">
                        <span className="student-panel__eyebrow">COURSE CERTIFICATE</span>
                        <span className="student-verified-badge">
                          <span aria-hidden="true">✓</span> Verified
                        </span>
                      </div>
                      <h3>{cert.courseTitle}</h3>
                      <p className="student-certificate-card__date">
                        Issued {new Date(cert.issuedAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="student-certificate-card__id">
                        Certificate ID <strong>{cert.certificateId}</strong>
                      </p>
                      <button
                        className="student-certificate-card__download"
                        type="button"
                        onClick={() => downloadCertificate(cert._id, cert.courseTitle)}
                      >
                        Download certificate <span aria-hidden="true">↓</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="student-certificate-empty">
                <span className="student-certificate-empty__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="5" />
                    <path d="m8.5 12-1 8 4.5-2.5 4.5 2.5-1-8" />
                  </svg>
                </span>
                <div>
                  <h3>Your achievements start here</h3>
                  <p>Complete a course to earn a verified certificate and celebrate your progress.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
