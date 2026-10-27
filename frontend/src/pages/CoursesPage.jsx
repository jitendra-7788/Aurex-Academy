import { useEffect, useState } from 'react';
import api from '../api/client';
import CourseCard from '../components/CourseCard';
import Loading from '../components/Loading';

const CATEGORIES = [
  'All Categories',
  'Web Development',
  'Programming',
  'Data Science',
  'Database',
  'Artificial Intelligence',
];

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', category: '', level: '', price: '' });

  const load = async (activeFilters = filters) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeFilters.q.trim()) params.set('q', activeFilters.q.trim());
    if (activeFilters.category && activeFilters.category !== 'All Categories') {
      params.set('category', activeFilters.category);
    }
    if (activeFilters.level) params.set('level', activeFilters.level);
    if (activeFilters.price) params.set('price', activeFilters.price);

    try {
      const { data } = await api.get(`/courses?${params.toString()}`);
      setCourses(data.data || []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    load();
  };

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    load(updated);
  };

  const handleResetFilters = () => {
    const reset = { q: '', category: '', level: '', price: '' };
    setFilters(reset);
    load(reset);
  };

  const hasActiveFilters = Boolean(
    filters.q ||
      (filters.category && filters.category !== 'All Categories') ||
      filters.level ||
      filters.price
  );

  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Course Catalog</h1>
          <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
            Explore industry-leading courses in programming, data, web development, and AI.
          </p>
        </div>
        <div style={{ alignSelf: 'flex-end', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
          {!loading && (
            <span>
              Showing <strong>{courses.length}</strong> {courses.length === 1 ? 'course' : 'courses'}
            </span>
          )}
        </div>
      </div>

      <form
        className="card"
        style={{ marginBottom: '1.5rem', padding: '1.25rem' }}
        onSubmit={handleSearchSubmit}
      >
        <div className="grid grid-3" style={{ gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="q">
              Search Courses
            </label>
            <input
              id="q"
              className="input"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Search by title, topic, or keyword"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="select"
              value={filters.category || 'All Categories'}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="level">
              Difficulty Level
            </label>
            <select
              id="level"
              className="select"
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="">All Difficulty Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="select"
              style={{ maxWidth: 170 }}
              value={filters.price}
              onChange={(e) => handleFilterChange('price', e.target.value)}
            >
              <option value="">All Pricing</option>
              <option value="free">Free Courses</option>
              <option value="paid">Paid Courses</option>
            </select>

            <button className="btn btn-primary" type="submit">
              Apply Search
            </button>
          </div>

          {hasActiveFilters && (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleResetFilters}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <Loading label="Loading published courses..." />
      ) : courses.length > 0 ? (
        <div className="grid grid-3" style={{ gap: '1.5rem', alignItems: 'stretch' }}>
          {courses.map((c) => (
            <CourseCard key={c._id} course={c} />
          ))}
        </div>
      ) : (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            background: 'var(--bg-elevated)',
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No courses match your filters</h3>
          <p style={{ maxWidth: 460, margin: '0 auto 1.5rem', color: 'var(--ink-soft)' }}>
            We couldn&apos;t find any published courses matching your search criteria. Try modifying your
            keywords, choosing another category, or clearing your active filters.
          </p>
          <button className="btn btn-primary" type="button" onClick={handleResetFilters}>
            View All Courses
          </button>
        </div>
      )}
    </div>
  );
}
