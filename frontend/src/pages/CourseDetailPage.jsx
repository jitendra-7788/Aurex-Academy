import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/client';
import Loading from '../components/Loading';
import { showToast } from '../features/ui/uiSlice';

const CATEGORY_GRADIENTS = {
  'Web Development': 'linear-gradient(135deg, #9270f5 0%, #191735 100%)',
  'Programming': 'linear-gradient(135deg, #7450e8 0%, #242044 100%)',
  'Data Science': 'linear-gradient(135deg, #a58afa 0%, #332360 100%)',
  'Database': 'linear-gradient(135deg, #45416b 0%, #17162e 100%)',
  'Artificial Intelligence': 'linear-gradient(135deg, #b19afa 0%, #6236d7 100%)',
};

export default function CourseDetailPage() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/courses/slug/${slug}`);
      setCourse(data.data.course);
      setEnrolled(data.data.enrolled);
    } catch {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [slug]);

  const enroll = async () => {
    if (!user) {
      dispatch(showToast({ message: 'Please log in to enroll', type: 'info' }));
      return navigate('/login');
    }
    setEnrolling(true);
    try {
      if (course.isFree) {
        await api.post(`/courses/${course._id}/enroll`);
        dispatch(showToast({ message: 'Enrolled successfully!', type: 'success' }));
        setEnrolled(true);
      } else {
        const { data } = await api.post(`/payments/checkout/${course._id}`);
        if (data.data.checkoutUrl) {
          window.location.href = data.data.checkoutUrl;
        }
      }
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || 'Enrollment failed',
          type: 'error',
        })
      );
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <Loading label="Loading course details..." />;
  if (!course) {
    return (
      <div className="container page" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Course not found</h2>
        <p className="muted">The requested course could not be located or is not yet published.</p>
        <Link className="btn btn-primary" to="/courses">
          Browse Course Catalog
        </Link>
      </div>
    );
  }

  const totalLessons = (course.sections || []).reduce(
    (sum, s) => sum + (s.lessons?.length || 0),
    0
  );

  const durationMin = course.totalDurationSeconds
    ? Math.round(course.totalDurationSeconds / 60)
    : (course.sections || []).reduce(
        (sum, s) =>
          sum +
          (s.lessons || []).reduce((ls, l) => ls + Math.round((l.durationSeconds || 0) / 60), 0),
        0
      );

  const heroGradient =
    CATEGORY_GRADIENTS[course.category] || 'linear-gradient(135deg, #9270f5 0%, #191735 100%)';

  return (
    <div className="container page">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/courses" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>
          ← Back to Catalog
        </Link>
      </div>

      <div
        style={{
          borderRadius: 'var(--radius)',
          padding: '2.5rem 2rem',
          color: '#fff',
          background: heroGradient,
          marginBottom: '2rem',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span
            className="badge"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}
          >
            {course.category}
          </span>
          <span
            className="badge"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              textTransform: 'capitalize',
            }}
          >
            {course.level}
          </span>
          <span
            className="badge"
            style={{ background: '#d8ccff', color: '#35216f', fontWeight: 700, border: 'none' }}
          >
            {course.isFree ? 'Free Enrollment' : `$${course.price}`}
          </span>
        </div>

        <h1 style={{ color: '#fff', fontSize: '2.4rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>
          {course.title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.15rem', maxWidth: 750, lineHeight: 1.5 }}>
          {course.shortDescription}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: '1.5rem',
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          <span>👤 Instructor: <strong>{course.instructor?.name || 'Instructor'}</strong></span>
          {totalLessons > 0 && <span>📖 <strong>{totalLessons}</strong> Lessons</span>}
          {durationMin > 0 && <span>⏱️ ~<strong>{durationMin}</strong> Minutes Total</span>}
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>About this Course</h3>
            <p style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>{course.description}</p>

            {course.learningObjectives?.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.6rem' }}>What You Will Learn</h4>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6 }}>
                  {course.learningObjectives.map((obj, i) => (
                    <li key={i} style={{ marginBottom: '0.4rem' }}>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.prerequisites?.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.6rem' }}>Prerequisites</h4>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6, color: 'var(--ink-soft)' }}>
                  {course.prerequisites.map((pre, i) => (
                    <li key={i} style={{ marginBottom: '0.4rem' }}>
                      {pre}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Instructor</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {course.instructor?.name?.[0] || 'I'}
              </div>
              <div>
                <h4 style={{ margin: 0 }}>{course.instructor?.name || 'Instructor'}</h4>
                <p style={{ margin: '0.2rem 0', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
                  {course.instructor?.headline || 'Senior Educator & Subject Specialist'}
                </p>
                {course.instructor?.bio && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                    {course.instructor.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div
            className="card"
            style={{
              marginBottom: '1.5rem',
              border: '2px solid var(--accent-soft)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)' }}>
                {course.isFree ? 'Free' : `$${course.price}`}
              </span>
              <p style={{ margin: '0.3rem 0 0', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
                Full lifetime access including all future updates and completion certificate.
              </p>
            </div>

            {enrolled ? (
              <div>
                <div
                  style={{
                    background: '#e8f5e9',
                    color: '#1e7a46',
                    padding: '0.75rem 1rem',
                    borderRadius: 8,
                    marginBottom: '1rem',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                  }}
                >
                  ✓ You are currently enrolled in this course!
                </div>
                <Link
                  className="btn btn-primary"
                  to={`/learn/${course._id}`}
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  Continue Learning
                </Link>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                type="button"
                onClick={enroll}
                disabled={enrolling}
                style={{ width: '100%', textAlign: 'center' }}
              >
                {enrolling
                  ? 'Processing...'
                  : course.isFree
                  ? 'Enroll Now for Free'
                  : `Enroll for $${course.price}`}
              </button>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Course Curriculum</h3>
            {(course.sections || [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((section, sIdx) => (
                <div
                  key={section._id}
                  style={{
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom:
                      sIdx < course.sections.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.95rem',
                    }}
                  >
                    <span>{section.title}</span>
                    <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>
                      {section.lessons?.length || 0} lessons
                    </span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(section.lessons || []).map((lesson, lIdx) => (
                      <li
                        key={lesson._id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.35rem 0',
                          fontSize: '0.9rem',
                          color: 'var(--ink-soft)',
                        }}
                      >
                        <span>
                          {lIdx + 1}. {lesson.title}
                          {lesson.isFreePreview && (
                            <span
                              className="badge"
                              style={{
                                marginLeft: '0.4rem',
                                fontSize: '0.75rem',
                                padding: '0.1rem 0.4rem',
                                background: '#eee9ff',
                                color: '#592dcc',
                              }}
                            >
                              Preview
                            </span>
                          )}
                        </span>
                        {lesson.durationSeconds > 0 && (
                          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            {Math.round(lesson.durationSeconds / 60)} min
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            {!course.sections?.length && <p className="muted">Curriculum details coming soon.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
