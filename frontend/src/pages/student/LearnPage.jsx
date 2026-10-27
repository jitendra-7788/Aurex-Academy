import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import VideoPlayer from '../../components/VideoPlayer';
import Loading from '../../components/Loading';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';

export default function LearnPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const dispatch = useDispatch();

  const load = async () => {
    const [courseRes, progressRes, quizRes] = await Promise.all([
      api.get(`/courses/${courseId}/learning`),
      api.get(`/progress/course/${courseId}`),
      api.get(`/quizzes/course/${courseId}`),
    ]);
    const loaded = courseRes.data.data.course;
    setCourse(loaded);
    setProgress(progressRes.data.data);
    setQuizzes(quizRes.data.data.quizzes || []);
    const completedLessonIds = new Set(
      (progressRes.data.data?.lessonProgress || [])
        .filter((p) => p.completed)
        .map((p) => String(p.lesson))
    );

    let nextLesson = null;
    for (const section of loaded.sections || []) {
      for (const lesson of section.lessons || []) {
        if (!completedLessonIds.has(String(lesson._id))) {
          nextLesson = lesson;
          break;
        }
      }
      if (nextLesson) break;
    }

    if (!nextLesson && loaded.sections?.[0]?.lessons?.[0]) {
      nextLesson = loaded.sections[0].lessons[0];
    }
    if (nextLesson) setActiveLesson(nextLesson);
  };

  useEffect(() => {
    load().catch((err) => {
      dispatch(
        showToast({
          message: err.response?.data?.message || err.message || 'Failed to load course',
          type: 'error',
        })
      );
    });
  }, [courseId]);

  useEffect(() => {
    if (!activeLesson || !course) return;
    api
      .get(`/courses/${course._id}/lessons/${activeLesson._id}/playback`)
      .then((res) => setPlaybackUrl(res.data.data.url))
      .catch(() => setPlaybackUrl(''));
  }, [activeLesson, course]);

  const saveProgress = useCallback(
    async ({ watchedSeconds, duration }) => {
      if (!activeLesson || !course) return;
      const completed = duration > 0 && watchedSeconds / duration >= 0.9;
      await api.post(`/progress/course/${course._id}/lessons/${activeLesson._id}`, {
        watchedSeconds,
        completed,
      });
      const progressRes = await api.get(`/progress/course/${courseId}`);
      setProgress(progressRes.data.data);
    },
    [activeLesson, course, courseId]
  );

  const toggleCompleteLesson = async () => {
    if (!activeLesson || !course) return;
    const isCurrentlyCompleted = completedIds.has(String(activeLesson._id));
    try {
      await api.post(`/progress/course/${course._id}/lessons/${activeLesson._id}`, {
        watchedSeconds: activeLesson.durationSeconds || 60,
        completed: !isCurrentlyCompleted,
      });
      const progressRes = await api.get(`/progress/course/${courseId}`);
      setProgress(progressRes.data.data);
      dispatch(
        showToast({
          message: !isCurrentlyCompleted ? 'Lesson marked as completed!' : 'Lesson status updated',
          type: 'success',
        })
      );
    } catch (err) {
      dispatch(showToast({ message: err.message || 'Failed to update progress', type: 'error' }));
    }
  };

  const requestCertificate = async () => {
    try {
      await api.post(`/certificates/course/${courseId}`);
      dispatch(showToast({ message: 'Certificate issued successfully!', type: 'success' }));
      const progressRes = await api.get(`/progress/course/${courseId}`);
      setProgress(progressRes.data.data);
    } catch (err) {
      dispatch(
        showToast({ message: err.response?.data?.message || 'Not eligible yet', type: 'error' })
      );
    }
  };

  if (!course) return <Loading label="Loading course…" />;

  const completedIds = new Set(
    (progress?.lessonProgress || []).filter((p) => p.completed).map((p) => String(p.lesson))
  );

  const isCurrentCompleted = completedIds.has(String(activeLesson?._id));

  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <h1>{course.title}</h1>
          <p style={{ margin: 0 }}>Progress: <strong>{progress?.enrollment?.progressPercent || 0}%</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link className="btn btn-secondary" to="/student">
            Dashboard
          </Link>
          <button
            className="btn btn-primary"
            type="button"
            onClick={requestCertificate}
            disabled={progress?.enrollment?.progressPercent < 100}
            title={
              progress?.enrollment?.progressPercent < 100
                ? 'Complete all lessons to request your certificate'
                : 'Request certificate'
            }
          >
            Request Certificate
          </button>
        </div>
      </div>

      <div className="grid grid-2">
        <div>
          {playbackUrl ? (
            <VideoPlayer src={playbackUrl} onProgress={saveProgress} />
          ) : (
            <div className="card empty" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeLesson?.video?.status === 'processing' || activeLesson?.video?.status === 'pending'
                ? `Video status: ${activeLesson.video.status}`
                : 'This lesson includes written instructional materials.'}
            </div>
          )}
          <h2 style={{ marginTop: '1rem', fontSize: '1.4rem' }}>{activeLesson?.title}</h2>
          <p style={{ lineHeight: 1.6 }}>{activeLesson?.description || 'Follow along with the lesson materials and exercises.'}</p>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className={`btn ${isCurrentCompleted ? 'btn-secondary' : 'btn-primary'}`}
              type="button"
              onClick={toggleCompleteLesson}
            >
              {isCurrentCompleted ? '✓ Lesson Completed (Click to undo)' : 'Mark Lesson as Completed'}
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Lessons</h3>
          {(course.sections || []).map((section) => (
            <div key={section._id} style={{ marginBottom: '1rem' }}>
              <strong>{section.title}</strong>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {(section.lessons || []).map((lesson) => (
                  <li key={lesson._id} style={{ margin: '0.4rem 0' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ justifyContent: 'flex-start', width: '100%' }}
                      onClick={() => setActiveLesson(lesson)}
                    >
                      {completedIds.has(String(lesson._id)) ? '✓ ' : ''}
                      {lesson.title}
                      {lesson.video?.status && lesson.video.status !== 'none'
                        ? ` (${lesson.video.status})`
                        : ''}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <h3>Quizzes</h3>
          {(quizzes || []).map((q) => (
            <div key={q.id || q._id}>
              <Link to={`/quizzes/${q.id || q._id}`}>{q.title}</Link>
            </div>
          ))}
          {!quizzes.length && <p className="muted">No quizzes published.</p>}
        </div>
      </div>
    </div>
  );
}
