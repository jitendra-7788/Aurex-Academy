import { Link } from 'react-router-dom';

const CATEGORY_GRADIENTS = {
  'Web Development': 'linear-gradient(135deg, #9270f5 0%, #191735 100%)',
  'Programming': 'linear-gradient(135deg, #7450e8 0%, #242044 100%)',
  'Data Science': 'linear-gradient(135deg, #a58afa 0%, #332360 100%)',
  'Database': 'linear-gradient(135deg, #45416b 0%, #17162e 100%)',
  'Artificial Intelligence': 'linear-gradient(135deg, #b19afa 0%, #6236d7 100%)',
};

const CATEGORY_ICONS = {
  'Web Development': '🌐',
  'Programming': '🐍',
  'Data Science': '📊',
  'Database': '🗄️',
  'Artificial Intelligence': '🤖',
};

export default function CourseCard({ course }) {
  const gradient =
    CATEGORY_GRADIENTS[course.category] || 'linear-gradient(135deg, #9270f5 0%, #191735 100%)';
  const icon = CATEGORY_ICONS[course.category] || '📚';

  const totalLessons = (course.sections || []).reduce(
    (sum, s) => sum + (s.lessons?.length || 0),
    0
  );

  return (
    <article
      className="card course-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 410,
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div>
        <div
          style={{
            height: 140,
            borderRadius: 12,
            marginBottom: '0.9rem',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0.75rem',
            background: course.thumbnail
              ? `center/cover url(${course.thumbnail.startsWith('http') ? course.thumbnail : `http://localhost:5000${course.thumbnail}`})`
              : gradient,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(6px)',
              padding: '0.25rem 0.6rem',
              borderRadius: 999,
              fontSize: '0.85rem',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <span>{icon}</span>
            <span style={{ fontWeight: 600 }}>{course.category}</span>
          </div>
        </div>

        <div className="course-meta" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
          <span className="badge">{course.category}</span>
          <span className="badge badge-warm" style={{ textTransform: 'capitalize' }}>
            {course.level}
          </span>
          <span className="badge" style={{ background: course.isFree ? '#e8f5e9' : undefined, color: course.isFree ? '#1e7a46' : undefined, fontWeight: 700 }}>
            {course.isFree ? 'Free' : `$${course.price}`}
          </span>
        </div>

        <h3
          style={{
            fontSize: '1.2rem',
            lineHeight: 1.3,
            marginBottom: '0.45rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.6rem',
          }}
        >
          {course.title}
        </h3>

        <p
          style={{
            fontSize: '0.9rem',
            lineHeight: 1.45,
            color: 'var(--ink-soft)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '0.75rem',
            minHeight: '3.9rem',
          }}
        >
          {course.shortDescription || course.description}
        </p>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--ink-soft)',
            paddingTop: '0.6rem',
            borderTop: '1px solid var(--border)',
            marginBottom: '0.9rem',
          }}
        >
          <span>👤 {course.instructor?.name || 'Instructor'}</span>
          {totalLessons > 0 && <span>📖 {totalLessons} lessons</span>}
        </div>

        <Link
          className="btn btn-primary"
          to={`/courses/${course.slug}`}
          style={{ width: '100%', textAlign: 'center' }}
        >
          View Course
        </Link>
      </div>
    </article>
  );
}
