import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { fetchMe } from './features/auth/authSlice';

import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import StudentDashboard from './pages/student/StudentDashboard';
import LearnPage from './pages/student/LearnPage';
import QuizPage from './pages/student/QuizPage';
import CertificatesPage from './pages/student/CertificatesPage';
import LiveClassPage from './pages/live/LiveClassPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorCourses from './pages/instructor/InstructorCourses';
import CourseEditor from './pages/instructor/CourseEditor';
import InstructorQuizzes from './pages/instructor/InstructorQuizzes';
import InstructorLiveClasses from './pages/instructor/InstructorLiveClasses';
import InstructorRevenue from './pages/instructor/InstructorRevenue';
import InstructorStudents from './pages/instructor/InstructorStudents';
import AdminDashboard from './pages/admin/AdminDashboard';
import VerifyCertificatePage from './pages/VerifyCertificatePage';

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.accessToken);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [token, dispatch]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:slug" element={<CourseDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="certificates/verify/:code" element={<VerifyCertificatePage />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="student"
          element={
            <ProtectedRoute roles={['student', 'admin']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="learn/:courseId"
          element={
            <ProtectedRoute roles={['student', 'admin']}>
              <LearnPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="quizzes/:quizId"
          element={
            <ProtectedRoute roles={['student', 'admin']}>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="certificates"
          element={
            <ProtectedRoute roles={['student', 'admin']}>
              <CertificatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="live/:id"
          element={
            <ProtectedRoute>
              <LiveClassPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payments/success"
          element={
            <ProtectedRoute roles={['student', 'admin']}>
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="instructor"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="instructor/courses"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <InstructorCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="instructor/courses/:id"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <CourseEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="instructor/quizzes"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <InstructorQuizzes />
            </ProtectedRoute>
          }
        />
        <Route
          path="instructor/live"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <InstructorLiveClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="instructor/revenue"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <InstructorRevenue />
            </ProtectedRoute>
          }
        />
        <Route
          path="instructor/courses/:courseId/students"
          element={
            <ProtectedRoute roles={['instructor', 'admin']}>
              <InstructorStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/*"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
