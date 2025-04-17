"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { getCourses } from "../../features/courses/courseSlice"

const StudentCatalog = () => {
  const dispatch = useDispatch()
  const { courses, isLoading, error } = useSelector((state) => state.courses)
  const [filters, setFilters] = useState({
    subject: "",
    level: "",
    search: "",
  })

  useEffect(() => {
    dispatch(getCourses())
  }, [dispatch])

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    })
  }

  const filteredCourses = courses.filter((course) => {
    return (
      (filters.subject === "" || course.subject.toLowerCase().includes(filters.subject.toLowerCase())) &&
      (filters.level === "" || course.level === filters.level) &&
      (filters.search === "" ||
        course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.subject.toLowerCase().includes(filters.search.toLowerCase()))
    )
  })

  // Get unique subjects for filter dropdown
  const subjects = [...new Set(courses.map((course) => course.subject))]

  return (
    <div className="container">
      <h2 className="mb-4">Course Catalog</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row mb-4 search-filters">
        <div className="col-md-4 mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search courses..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col-md-3 mb-3">
          <select className="form-select" name="subject" value={filters.subject} onChange={handleFilterChange}>
            <option value="">All Subjects</option>
            {subjects.map((subject, index) => (
              <option key={index} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3 mb-3">
          <select className="form-select" name="level" value={filters.level} onChange={handleFilterChange}>
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div className="col-md-2 mb-3">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => setFilters({ subject: "", level: "", search: "" })}
          >
            Reset
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="row">
          {filteredCourses.map((course) => (
            <div key={course._id} className="col-md-4 mb-4">
              <div className="card h-100 course-card">
                <div className="card-header">
                  <h5 className="card-title mb-0">{course.title}</h5>
                </div>
                <div className="card-body">
                  <div className="mb-2">
                    <span className="badge bg-primary me-2">{course.subject}</span>
                    <span className="badge bg-secondary">{course.level}</span>
                  </div>
                  <p className="card-text">{course.description.substring(0, 100)}...</p>
                  <div className="mb-2">
                    <small className="text-muted">
                      <strong>Duration:</strong> {course.duration} weeks
                    </small>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">
                      <strong>Tutor:</strong> {course.tutor.name}
                      {course.tutor.averageRating > 0 && (
                        <span className="ms-2">★ {course.tutor.averageRating.toFixed(1)}</span>
                      )}
                    </small>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">
                      <strong>Availability:</strong> {course.availableSpots} spots left
                    </small>
                  </div>
                </div>
                <div className="card-footer d-flex justify-content-between align-items-center">
                  <Link to={`/student/course/${course._id}`} className="btn btn-outline-primary btn-sm">
                    View Details
                  </Link>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={course.availableSpots === 0 || course.enrolledStudents.includes(course.user?._id)}
                  >
                    {course.enrolledStudents.includes(course.user?._id)
                      ? "Enrolled"
                      : course.availableSpots === 0
                        ? "Full"
                        : "Enroll Now"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <p>No courses found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default StudentCatalog

