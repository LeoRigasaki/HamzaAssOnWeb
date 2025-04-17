"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { getCourse, enrollCourse } from "../../features/courses/courseSlice"

const CourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentCourse, isLoading, error, success } = useSelector((state) => state.courses)
  const { user } = useSelector((state) => state.auth)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    dispatch(getCourse(courseId))
  }, [dispatch, courseId])

  useEffect(() => {
    if (success && enrolling) {
      setEnrolling(false)
      // Show success message or redirect
    }
  }, [success, enrolling])

  const handleEnroll = () => {
    setEnrolling(true);
    dispatch(enrollCourse(courseId))
      .unwrap() // Add unwrap to properly handle the promise
      .then(() => {
        // Show success message
        setSuccessMessage("Successfully enrolled in course!");
        setTimeout(() => setSuccessMessage(""), 3000);
      })
      .catch(err => {
        // Show error message
        setErrorMessage(err || "Failed to enroll in course");
        setTimeout(() => setErrorMessage(""), 3000);
      })
      .finally(() => {
        setEnrolling(false);
      });
  };

  const isEnrolled = currentCourse?.enrolledStudents?.some(
    (student) => student._id === user?._id || student === user?._id,
  )

  const formatTimings = (timings) => {
    return timings.map((timing) => `${timing.day}: ${timing.startTime} - ${timing.endTime}`).join(", ")
  }

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    )
  }

  if (!currentCourse) {
    return (
      <div className="alert alert-warning" role="alert">
        Course not found.
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-12">
          <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </button>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h2 className="mb-0">{currentCourse.title}</h2>
              <div>
                <span className="badge bg-primary me-2">{currentCourse.subject}</span>
                <span className="badge bg-secondary">{currentCourse.level}</span>
              </div>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-8">
                  <h4>Description</h4>
                  <p>{currentCourse.description}</p>

                  <h4 className="mt-4">Course Details</h4>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <strong>Duration:</strong> {currentCourse.duration} weeks
                    </li>
                    <li className="list-group-item">
                      <strong>Start Date:</strong> {new Date(currentCourse.startDate).toLocaleDateString()}
                    </li>
                    <li className="list-group-item">
                      <strong>End Date:</strong> {new Date(currentCourse.endDate).toLocaleDateString()}
                    </li>
                    <li className="list-group-item">
                      <strong>Schedule:</strong> {formatTimings(currentCourse.timings)}
                    </li>
                  </ul>
                </div>

                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Enrollment</h5>
                    </div>
                    <div className="card-body">
                      <p>
                        <strong>Available Spots:</strong>{" "}
                        {currentCourse.maxStudents - currentCourse.enrolledStudents.length} of{" "}
                        {currentCourse.maxStudents}
                      </p>
                      <div className="progress mb-3">
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${(currentCourse.enrolledStudents.length / currentCourse.maxStudents) * 100}%`,
                          }}
                          aria-valuenow={currentCourse.enrolledStudents.length}
                          aria-valuemin="0"
                          aria-valuemax={currentCourse.maxStudents}
                        ></div>
                      </div>

                      {user?.role === "student" && (
                        <button
                          className="btn btn-primary w-100"
                          disabled={
                            isEnrolled ||
                            currentCourse.enrolledStudents.length >= currentCourse.maxStudents ||
                            enrolling
                          }
                          onClick={handleEnroll}
                        >
                          {enrolling ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Enrolling...
                            </>
                          ) : isEnrolled ? (
                            "Already Enrolled"
                          ) : (
                            "Enroll Now"
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="card mt-3">
                    <div className="card-header">
                      <h5 className="mb-0">Tutor</h5>
                    </div>
                    <div className="card-body">
                      <h6>{currentCourse.tutor.name}</h6>
                      {currentCourse.tutor.averageRating > 0 && (
                        <p className="mb-2">
                          <strong>Rating:</strong> {currentCourse.tutor.averageRating.toFixed(1)} / 5
                          <span className="ms-2">★★★★★</span>
                        </p>
                      )}
                      <p className="mb-2">
                        <strong>Expertise:</strong>{" "}
                        {Array.isArray(currentCourse.tutor.expertise)
                          ? currentCourse.tutor.expertise.join(", ")
                          : currentCourse.tutor.expertise}
                      </p>
                      <p className="mb-0">
                        <strong>Experience:</strong> {currentCourse.tutor.experience} years
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail

