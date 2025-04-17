import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getCurrentUser } from "./features/auth/authSlice";

// Layout Components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Route Protection Components
import PrivateRoute from "./components/routing/PrivateRoute";
import RoleRoute from "./components/routing/RoleRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Student Pages
import StudentLanding from "./pages/student/StudentLanding";
import StudentCatalog from "./pages/student/StudentCatalog";
import StudentSearch from "./pages/student/StudentSearch";
import StudentMeetings from "./pages/student/StudentMeetings";
import CourseDetail from "./pages/student/CourseDetail"
import ScheduleSession from "./pages/student/ScheduleSession";
import ChatRoom from "./pages/shared/ChatRoom";
import VideoRoom from "./pages/shared/VideoRoom";
import SessionReview from "/src/pages/student/sessionReviews.jsx";

// Tutor Pages/pages/student/SessionReview
import TutorLanding from "./pages/tutor/TutorLanding";
import TutorCatalog from "./pages/tutor/TutorCatalog";
import TutorSearch from "./pages/tutor/TutorSearch";
import TutorMeetings from "./pages/tutor/TutorMeetings";
import OfferSession from "./pages/tutor/OfferSession";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Common Pages
import ProfilePage from "/src/components/layout/userProfile.jsx";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading, initialized } = useSelector((state) => state.auth);

  // Load user on first app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  // Don't render anything until we've checked authentication
  if (!initialized && isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <main className="flex-grow-1 py-3">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  user?.role === "student" ? (
                    <Navigate to="/student/dashboard" replace />
                  ) : user?.role === "tutor" ? (
                    <Navigate to="/tutor/dashboard" replace />
                  ) : (
                    <Navigate to="/admin/dashboard" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <RoleRoute role="student">
                  <StudentLanding />
                </RoleRoute>
              }
            />
            <Route
              path="/student/catalog"
              element={
                <RoleRoute role="student">
                  <StudentCatalog />
                </RoleRoute>
              }
            />
            <Route
              path="/student/search"
              element={
                <RoleRoute role="student">
                  <StudentSearch />
                </RoleRoute>
              }
            />
            <Route
              path="/student/meetings"
              element={
                <RoleRoute role="student">
                  <StudentMeetings />
                </RoleRoute>
              }
            />
            <Route
              path="/student/course/:courseId"
              element={
                <RoleRoute role="student">
                  <CourseDetail />
                </RoleRoute>
              }
            />
            <Route
              path="/student/schedule/:tutorId"
              element={
                <RoleRoute role="student">
                  <ScheduleSession />
                </RoleRoute>
              }
            />
            <Route
              path="/student/review/:sessionId"
              element={
                <RoleRoute role="student">
                  <SessionReview />
                </RoleRoute>
              }
            />

            {/* Tutor Routes */}
            <Route
              path="/tutor/dashboard"
              element={
                <RoleRoute role="tutor">
                  <TutorLanding />
                </RoleRoute>
              }
            />
            <Route
              path="/tutor/catalog"
              element={
                <RoleRoute role="tutor">
                  <TutorCatalog />
                </RoleRoute>
              }
            />
            <Route
              path="/tutor/search"
              element={
                <RoleRoute role="tutor">
                  <TutorSearch />
                </RoleRoute>
              }
            />
            <Route
              path="/tutor/meetings"
              element={
                <RoleRoute role="tutor">
                  <TutorMeetings />
                </RoleRoute>
              }
            />
            <Route
              path="/tutor/schedule/:studentId"
              element={
                <RoleRoute role="tutor">
                  <OfferSession />
                </RoleRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <RoleRoute role="admin">
                  <AdminDashboard />
                </RoleRoute>
              }
            />

            {/* Common Protected Routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat/:userId"
              element={
                <PrivateRoute>
                  <ChatRoom />
                </PrivateRoute>
              }
            />
            <Route
              path="/video/:sessionId"
              element={
                <PrivateRoute>
                  <VideoRoom />
                </PrivateRoute>
              }
            />

            {/* 404 - Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;