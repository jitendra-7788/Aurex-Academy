import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useDispatch } from 'react-redux';
import { showToast } from '../../features/ui/uiSlice';
import Loading from '../../components/Loading';

export default function CourseEditor() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [lessonForms, setLessonForms] = useState({});
  const dispatch = useDispatch();

  const load = async () => {
    const { data } = await api.get('/courses/instructor/mine');
    const found = (data.data.courses || []).find((c) => c._id === id);
    setCourse(found || null);
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveMeta = async (e) => {
    e.preventDefault();
    await api.patch(`/courses/${id}`, {
      title: course.title,
      shortDescription: course.shortDescription,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
    });
    dispatch(showToast({ message: 'Course saved', type: 'success' }));
    load();
  };

  const addSection = async (e) => {
    e.preventDefault();
    await api.post(`/courses/${id}/sections`, { title: sectionTitle });
    setSectionTitle('');
    load();
  };

  const addLesson = async (sectionId) => {
    const title = lessonForms[sectionId] || 'New lesson';
    await api.post(`/courses/${id}/sections/${sectionId}/lessons`, { title });
    setLessonForms({ ...lessonForms, [sectionId]: '' });
    load();
  };

  const uploadVideo = async (lessonId, file) => {
    const form = new FormData();
    form.append('video', file);
    try {
      await api.post(`/courses/${id}/lessons/${lessonId}/video`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(showToast({ message: 'Video uploaded and queued for processing', type: 'success' }));
      load();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Upload failed', type: 'error' }));
    }
  };

  const publish = async () => {
    try {
      const { data } = await api.post(`/courses/${id}/publish`);
      dispatch(showToast({ message: data.message, type: 'success' }));
      load();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.message || 'Publish failed', type: 'error' }));
    }
  };

  if (!course) return <Loading />;

  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <h1>Edit course</h1>
          <p className="muted">Status: {course.status}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link className="btn btn-secondary" to="/instructor/courses">Back</Link>
          <button className="btn btn-primary" type="button" onClick={publish}>Submit / Publish</button>
        </div>
      </div>

      <form className="card" onSubmit={saveMeta} style={{ marginBottom: '1rem' }}>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Price</label>
            <input className="input" type="number" value={course.price} onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="label">Short description</label>
            <input className="input" value={course.shortDescription} onChange={(e) => setCourse({ ...course, shortDescription: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Category</label>
            <input className="input" value={course.category} onChange={(e) => setCourse({ ...course, category: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="label">Description</label>
          <textarea className="textarea" value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} />
        </div>
        <button className="btn btn-secondary" type="submit">Save details</button>
      </form>

      <form className="card" onSubmit={addSection} style={{ marginBottom: '1rem' }}>
        <h3>Add section</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="input" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="Section title" required />
          <button className="btn btn-primary" type="submit">Add</button>
        </div>
      </form>

      {(course.sections || []).map((section) => (
        <div className="card" key={section._id} style={{ marginBottom: '1rem' }}>
          <h3>{section.title}</h3>
          {(section.lessons || []).map((lesson) => (
            <div key={lesson._id} style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 0' }}>
              <strong>{lesson.title}</strong>
              <div className="muted">Video: {lesson.video?.status || 'none'}{lesson.video?.processingError ? ` — ${lesson.video.processingError}` : ''}</div>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => e.target.files?.[0] && uploadVideo(lesson._id, e.target.files[0])}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input
              className="input"
              placeholder="Lesson title"
              value={lessonForms[section._id] || ''}
              onChange={(e) => setLessonForms({ ...lessonForms, [section._id]: e.target.value })}
            />
            <button className="btn btn-secondary" type="button" onClick={() => addLesson(section._id)}>
              Add lesson
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
