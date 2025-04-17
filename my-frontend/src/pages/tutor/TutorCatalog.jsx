"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { getTutorCourses, createCourse } from "../../features/courses/courseSlice"

const TutorCatalog = () => {
  const dispatch = useDispatch()
  const { tutorCourses, isLoading, error, success } = useSelector((state) => state.courses)
  const { user } = useSelector((state) => state.auth)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    level: "Beginner",
    duration: 4,
    maxStudents: 20,
    startDate: "",
    endDate: "",
    timings: [{ day: "Monday", startTime: "09:00", endTime: "10:00" }],
  })

  useEffect(() => {
    dispatch(getTutorCourses())
  }, [dispatch])

  useEffect(() => {
    if (success) {
      setShowCreateForm(false)
      setFormData({
        title: "",
        description: "",
        subject: "",
        level: "Beginner",
        duration: 4,
        maxStudents: 20,
        startDate: "",
        endDate: "",
        timings: [{ day: "Monday", startTime: "09:00", endTime: "10:00" }],
      })
    }
  }, [success])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleTimingChange = (index, field, value) => {
    const updatedTimings = [...formData.timings]
    updatedTimings[index] = {
      ...updatedTimings[index],
      [field]: value,
    }
    setFormData({
      ...formData,
      timings: updatedTimings,
    })
  }

  const addTiming = () => {
    setFormData({
      ...formData,
      timings: [...formData.timings, { day: "Monday", startTime: "09:00", endTime: "10:00" }],
    })
  }

  const removeTiming = (index) => {
    const updatedTimings = [...formData.timings]
    updatedTimings.splice(index, 1)
    setFormData({
      ...formData,
      timings: updatedTimings,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(createCourse(formData))
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Courses</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create New Course"}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h4>Create New Course</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="title" className="form-label">
                    Course Title
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="subject" className="form-label">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="level" className="form-label">
                    Level
                  </label>
                  <select
                    className="form-select"
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="duration" className="form-label">
                    Duration (weeks)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="maxStudents" className="form-label">
                    Max Students
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="maxStudents"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="startDate" className="form-label">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="endDate" className="form-label">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Course Timings</label>
                {formData.timings.map((timing, index) => (
                  <div key={index} className="row mb-2">
                    <div className="col-md-4">
                      <select
                        className="form-select"
                        value={timing.day}
                        onChange={(e) => handleTimingChange(index, "day", e.target.value)}
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <input
                        type="time"
                        className="form-control"
                        value={timing.startTime}
                        onChange={(e) => handleTimingChange(index, "startTime", e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <input
                        type="time"
                        className="form-control"
                        value={timing.endTime}
                        onChange={(e) => handleTimingChange(index, "endTime", e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => removeTiming(index)}
                        disabled={formData.timings.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={addTiming}>
                  Add Timing
                </button>
              </div>

              <div className="text-end">
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    "Create Course"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && !showCreateForm ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : tutorCourses.length > 0 ? (
        <div className="row">
          {tutorCourses.map((course) => (
            <div key={course._id} className="col-md-4 mb-4">
              <div className="card h-100 course-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">{course.title}</h5>
                  <span className={`badge ${course.isActive ? "bg-success" : "bg-secondary"}`}>
                    {course.isActive ? "Active" : "Inactive"}
                  </span>
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
                      <strong>Enrollment:</strong> {course.enrolledStudents.length}/{course.maxStudents} students
                    </small>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted">
                      <strong>Dates:</strong> {new Date(course.startDate).toLocaleDateString()} -{" "}
                      {new Date(course.endDate).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="d-flex justify-content-between">
                    <Link to={`/tutor/course/${course._id}`} className="btn btn-outline-primary btn-sm">
                      View Details
                    </Link>
                    <Link to={`/tutor/course/${course._id}/edit`} className="btn btn-outline-secondary btn-sm">
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <p>You haven't created any courses yet.</p>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            Create Your First Course
          </button>
        </div>
      )}
    </div>
  )
}

export default TutorCatalog

