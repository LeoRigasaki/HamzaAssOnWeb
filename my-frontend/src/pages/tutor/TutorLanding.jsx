"use client"

import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { getUpcomingSessions } from "../../features/sessions/sessionSlice"
import { getTutorCourses } from "../../features/courses/courseSlice"

const TutorLanding = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { upcomingSessions, isLoading: sessionsLoading } = useSelector((state) => state.sessions)
  const { tutorCourses, isLoading: coursesLoading } = useSelector((state) => state.courses)

  useEffect(() => {
    dispatch(getUpcomingSessions())
    dispatch(getTutorCourses())
  }, [dispatch])

  return (
    <div className="landing-container">
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Welcome, {user?.name}!</h2>
              <p className="card-text">
                Manage your courses, schedule sessions, and connect with students all in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Upcoming Sessions</h4>
              <Link to="/tutor/meetings" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="card-body">
              {sessionsLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : upcomingSessions.length > 0 ? (
                <div className="list-group">
                  {upcomingSessions.slice(0, 3).map((session) => (
                    <div key={session._id} className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{session.subject}</h5>
                        <small className="text-muted">{new Date(session.date).toLocaleDateString()}</small>
                      </div>
                      <p className="mb-1">Student: {session.student.name}</p>
                      <small className="text-muted">
                        {session.startTime} - {session.endTime}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p>No upcoming sessions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">My Courses</h4>
              <Link to="/tutor/catalog" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="card-body">
              {coursesLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : tutorCourses.length > 0 ? (
                <div className="list-group">
                  {tutorCourses.slice(0, 3).map((course) => (
                    <div key={course._id} className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{course.title}</h5>
                        <small className="text-muted">
                          {course.enrolledStudents.length}/{course.maxStudents} students
                        </small>
                      </div>
                      <p className="mb-1">
                        {course.subject} - {course.level}
                      </p>
                      <small className="text-muted">
                        {new Date(course.startDate).toLocaleDateString()} to{" "}
                        {new Date(course.endDate).toLocaleDateString()}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p>You haven't created any courses yet</p>
                  <Link to="/tutor/catalog" className="btn btn-primary">
                    Create Course
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">Quick Actions</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <Link to="/tutor/catalog" className="btn btn-primary w-100">
                    <i className="bi bi-plus-circle me-2"></i>
                    Create Course
                  </Link>
                </div>
                <div className="col-md-4 mb-3">
                  <Link to="/tutor/search" className="btn btn-success w-100">
                    <i className="bi bi-search me-2"></i>
                    Find Students
                  </Link>
                </div>
                <div className="col-md-4 mb-3">
                  <Link to="/tutor/meetings" className="btn btn-info w-100">
                    <i className="bi bi-calendar-check me-2"></i>
                    View Meetings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorLanding

