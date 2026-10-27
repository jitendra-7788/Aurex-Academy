import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/client';
import CourseCard from '../components/CourseCard';
import './HomePage.css';

export default function HomePage() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/courses?limit=3').then((res) => setCourses(res.data.data || []));
  }, []);

  return (
    <div className="container">
      <section className="hero home-hero">
        <div className="home-hero__copy">
          <p className="home-hero__eyebrow">
            <span className="home-hero__eyebrow-icon" aria-hidden="true">✦</span>
            Learning, elevated
          </p>
          <h1>
            Learn with purpose.
            <span> Grow without limits.</span>
          </h1>
          <p className="home-hero__description">
            Aurex Academy brings courses, live WebRTC sessions, quizzes, certificates, and
            progress tracking together in one inspiring place to learn and teach.
          </p>
          <div className="home-hero__actions">
            <Link className="btn btn-primary home-hero__primary-cta" to="/courses">
              Explore courses <span aria-hidden="true">↗</span>
            </Link>
            <Link className="btn btn-secondary home-hero__secondary-cta" to="/register">
              Start learning <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="home-hero__proof" aria-label="Learn your way">
            <span className="home-hero__proof-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h7m-7 3h5" /></svg>
            </span>
            <span>Expert-led courses</span>
            <i aria-hidden="true" />
            <span>Learn at your pace</span>
          </div>
        </div>
        <div className="home-hero__art" aria-hidden="true">
          <div className="home-hero__halo home-hero__halo--outer" />
          <div className="home-hero__halo home-hero__halo--inner" />
          <div className="home-hero__spark home-hero__spark--one">✦</div>
          <div className="home-hero__spark home-hero__spark--two">✧</div>

          <div className="home-hero__class-window">
            <div className="home-hero__window-top">
              <div className="home-hero__window-brand">
                <span className="home-hero__window-mark">A</span>
                <span>Live classroom</span>
              </div>
              <span className="home-hero__live-pill"><i /> LIVE</span>
            </div>
            <div className="home-hero__class-stage">
              <div className="home-hero__stage-glow" />
              <div className="home-hero__instructor">
                <div className="home-hero__instructor-hair" />
                <div className="home-hero__instructor-face">
                  <span className="home-hero__instructor-eye home-hero__instructor-eye--left" />
                  <span className="home-hero__instructor-eye home-hero__instructor-eye--right" />
                  <span className="home-hero__instructor-smile" />
                </div>
                <div className="home-hero__instructor-body" />
              </div>
              <div className="home-hero__stage-caption">
                <span>Interactive lesson</span>
                <strong>Ideas come to life.</strong>
              </div>
              <div className="home-hero__lesson-chip">
                <span className="home-hero__lesson-play">▶</span>
                <span><strong>Live session</strong><small>Learn together</small></span>
              </div>
            </div>
            <div className="home-hero__window-footer">
              <span className="home-hero__participant-stack">
                <i>J</i><i>M</i><i>A</i>
              </span>
              <span>Good things happen live</span>
              <span className="home-hero__audio-bars"><i /><i /><i /><i /><i /></span>
            </div>
          </div>

          <div className="home-hero__floating-card home-hero__certificate-card">
            <span className="home-hero__floating-icon home-hero__floating-icon--certificate">
              <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13-1 8 4.5-2.5 4.5 2.5-1-8" /><path d="m10 9 1.3 1.3L14.5 7" /></svg>
            </span>
            <span className="home-hero__floating-copy"><strong>Achievement unlocked</strong><small>Certificate earned</small></span>
            <span className="home-hero__floating-check">✓</span>
          </div>

          <div className="home-hero__floating-card home-hero__quiz-card">
            <span className="home-hero__quiz-icon">
              <svg viewBox="0 0 24 24" fill="none"><path d="M7 3.5h7l4 4v13H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M14 4v4h4m-9 5h6m-6 3h4" /></svg>
            </span>
            <span className="home-hero__quiz-copy"><strong>Knowledge check</strong><small>Quiz progress</small></span>
            <span className="home-hero__quiz-progress"><i /></span>
          </div>

          <div className="home-hero__orbit-dot home-hero__orbit-dot--a" />
          <div className="home-hero__orbit-dot home-hero__orbit-dot--b" />
        </div>
      </section>

      <section className="page">
        <div className="page-header">
          <div>
            <h2>Featured courses</h2>
            <p>Start with published catalog content from instructors on the platform.</p>
          </div>
          <Link className="btn btn-secondary" to="/courses">
            View all
          </Link>
        </div>
        <div className="grid grid-3">
          {courses.map((c) => (
            <CourseCard key={c._id} course={c} />
          ))}
          {!courses.length && <div className="empty">No published courses yet. Seed the database to load demo content.</div>}
        </div>
      </section>
    </div>
  );
}
