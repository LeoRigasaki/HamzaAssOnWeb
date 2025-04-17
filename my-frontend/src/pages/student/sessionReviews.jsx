"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { getSession } from "../../features/sessions/sessionSlice"
import axios from "../../config/api"
import { API_URLS } from "../../config/api"
import ErrorAlert from "../../components/common/ErrorAlert"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const SessionReview = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentSession, isLoading: sessionLoading, error: sessionError } = useSelector((state) => state.sessions)
  const { user } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [existingReview, setExistingReview] = useState(null)

  useEffect(() => {
    dispatch(getSession(sessionId))
  }, [dispatch, sessionId])

  useEffect(() => {
    // Check if a review already exists
    const checkExistingReview = async () => {
      try {
        if (currentSession && currentSession.tutor) {
          const response = await axios.get(`${API_URLS.USERS}/reviews/check/${sessionId}`)
          if (response.data.data) {
            setExistingReview(response.data.data)
            setFormData({
              rating: response.data.data.rating,
              comment: response.data.data.comment || "",
            })
          }
        }
      } catch (err) {
        // If no review exists or any other error, just continue
        console.log("No existing review found or error checking")
      }
    }

    if (currentSession) {
      checkExistingReview()
    }
  }, [currentSession, sessionId])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleRatingChange = (newRating) => {
    setFormData({
      ...formData,
      rating: newRating,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const reviewData = {
        session: sessionId,
        tutor: currentSession.tutor._id,
        rating: formData.rating,
        comment: formData.comment,
      }

      if (existingReview) {
        // Update existing review
        await axios.put(`${API_URLS.USERS}/reviews/${existingReview._id}`, reviewData)
      } else {
        // Create new review
        await axios.post(`${API_URLS.USERS}/reviews`, reviewData)
      }

      setSuccess(true)
      setTimeout(() => {
        navigate("/student/meetings")
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sessionLoading) {
    return (
      <div className="container py-5">
        <LoadingSpinner />
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="container py-5">
        <ErrorAlert error={sessionError} />
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    )
  }

  if (!currentSession) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Session not found.</div>
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    )
  }

  // Only students can leave reviews
  if (user.role !== "student") {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Only students can leave reviews.</div>
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    )
  }

  // Only completed sessions can be reviewed
  if (currentSession.status !== "completed") {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Only completed sessions can be reviewed.</div>
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <button className="btn btn-outline-secondary mb-4" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </button>

          <div className="card shadow">
            <div className="card-header">
              <h3 className="mb-0">
                {existingReview ? "Edit Your Review" : "Leave a Review"} for {currentSession.tutor.name}
              </h3>
            </div>
            <div className="card-body">
              {success ? (
                <div className="alert alert-success">
                  <h4 className="alert-heading">Thank you for your review!</h4>
                  <p>Your feedback helps other students find great tutors.</p>
                  <hr />
                  <p className="mb-0">Redirecting you back to your sessions...</p>
                </div>
              ) : (
                <>
                  {error && <ErrorAlert error={error} />}

                  <div className="session-details mb-4">
                    <h5>Session Details</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p>
                          <strong>Subject:</strong> {currentSession.subject}
                        </p>
                        <p>
                          <strong>Date:</strong> {new Date(currentSession.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p>
                          <strong>Time:</strong> {currentSession.startTime} - {currentSession.endTime}
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span className="badge bg-success">Completed</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <hr />

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="form-label">Rating</label>
                      <div className="stars-container d-flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="star-rating"
                            onClick={() => handleRatingChange(star)}
                            style={{ cursor: "pointer", fontSize: "2rem", color: star <= formData.rating ? "#ffc107" : "#e4e5e9" }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="comment" className="form-label">
                        Your Review (Optional)
                      </label>
                      <textarea
                        className="form-control"
                        id="comment"
                        name="comment"
                        rows="5"
                        value={formData.comment}
                        onChange={handleChange}
                        placeholder="Share your experience with this tutor..."
                      ></textarea>
                    </div>

                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Submitting...
                          </>
                        ) : existingReview ? (
                          "Update Review"
                        ) : (
                          "Submit Review"
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionReview