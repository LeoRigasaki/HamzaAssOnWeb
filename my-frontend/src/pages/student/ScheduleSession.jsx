"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { getTutorProfile } from "../../features/users/userSlice"
import { createSession } from "../../features/sessions/sessionSlice"

const ScheduleSession = () => {
  const { tutorId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentTutor, isLoading: tutorLoading } = useSelector((state) => state.users)
  const { isLoading: sessionLoading, success, error } = useSelector((state) => state.sessions)

  const [formData, setFormData] = useState({
    subject: "",
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  })

  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedDay, setSelectedDay] = useState("")
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    dispatch(getTutorProfile(tutorId))
  }, [dispatch, tutorId])

  useEffect(() => {
    if (success) {
      navigate("/student/meetings")
    }
  }, [success, navigate])

  useEffect(() => {
    if (currentTutor && currentTutor.availability) {
      // Group availability by day
      const availabilityByDay = {}

      currentTutor.availability.forEach((slot) => {
        if (!availabilityByDay[slot.day]) {
          availabilityByDay[slot.day] = []
        }
        availabilityByDay[slot.day].push({
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      })

      setAvailableSlots(availabilityByDay)
    }
  }, [currentTutor])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear errors when field is updated
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      })
    }
  }

  const handleDayChange = (e) => {
    setSelectedDay(e.target.value)
    setFormData({
      ...formData,
      startTime: "",
      endTime: "",
    })
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.subject.trim()) {
      errors.subject = "Subject is required"
    }

    if (!formData.date) {
      errors.date = "Date is required"
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        errors.date = "Date cannot be in the past"
      }
    }

    if (!formData.startTime) {
      errors.startTime = "Start time is required"
    }

    if (!formData.endTime) {
      errors.endTime = "End time is required"
    }

    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        errors.endTime = "End time must be after start time"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      const sessionData = {
        tutor: tutorId,
        subject: formData.subject,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes,
      }

      dispatch(createSession(sessionData))
    }
  }

  if (tutorLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!currentTutor) {
    return (
      <div className="alert alert-warning" role="alert">
        Tutor not found.
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
            <div className="card-header">
              <h2 className="mb-0">Schedule Session with {currentTutor.name}</h2>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header">
                      <h5 className="mb-0">Tutor Information</h5>
                    </div>
                    <div className="card-body">
                      <h6>{currentTutor.name}</h6>
                      {currentTutor.averageRating > 0 && (
                        <p className="mb-2">
                          <strong>Rating:</strong> {currentTutor.averageRating.toFixed(1)} / 5
                          <span className="ms-2">★★★★★</span>
                        </p>
                      )}
                      <p className="mb-2">
                        <strong>Expertise:</strong>{" "}
                        {Array.isArray(currentTutor.expertise)
                          ? currentTutor.expertise.join(", ")
                          : currentTutor.expertise}
                      </p>
                      <p className="mb-2">
                        <strong>Hourly Rate:</strong> ${currentTutor.hourlyRate}/hour
                      </p>
                      <p className="mb-0">
                        <strong>Experience:</strong> {currentTutor.experience} years
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-8">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="subject" className="form-label">
                        Subject
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.subject ? "is-invalid" : ""}`}
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What subject do you need help with?"
                      />
                      {formErrors.subject && <div className="invalid-feedback">{formErrors.subject}</div>}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="date" className="form-label">
                        Date
                      </label>
                      <input
                        type="date"
                        className={`form-control ${formErrors.date ? "is-invalid" : ""}`}
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                      />
                      {formErrors.date && <div className="invalid-feedback">{formErrors.date}</div>}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="day" className="form-label">
                        Day of Week
                      </label>
                      <select className="form-select" id="day" value={selectedDay} onChange={handleDayChange}>
                        <option value="">Select a day</option>
                        {Object.keys(availableSlots).map((day, index) => (
                          <option key={index} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="startTime" className="form-label">
                          Start Time
                        </label>
                        <select
                          className={`form-select ${formErrors.startTime ? "is-invalid" : ""}`}
                          id="startTime"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          disabled={!selectedDay}
                        >
                          <option value="">Select start time</option>
                          {selectedDay &&
                            availableSlots[selectedDay]?.map((slot, index) => (
                              <option key={index} value={slot.startTime}>
                                {slot.startTime}
                              </option>
                            ))}
                        </select>
                        {formErrors.startTime && <div className="invalid-feedback">{formErrors.startTime}</div>}
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="endTime" className="form-label">
                          End Time
                        </label>
                        <select
                          className={`form-select ${formErrors.endTime ? "is-invalid" : ""}`}
                          id="endTime"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          disabled={!selectedDay || !formData.startTime}
                        >
                          <option value="">Select end time</option>
                          {selectedDay &&
                            formData.startTime &&
                            availableSlots[selectedDay]?.map(
                              (slot, index) =>
                                slot.endTime > formData.startTime && (
                                  <option key={index} value={slot.endTime}>
                                    {slot.endTime}
                                  </option>
                                ),
                            )}
                        </select>
                        {formErrors.endTime && <div className="invalid-feedback">{formErrors.endTime}</div>}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="notes" className="form-label">
                        Notes (Optional)
                      </label>
                      <textarea
                        className="form-control"
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Any specific topics or questions you'd like to cover?"
                        rows="3"
                      ></textarea>
                    </div>

                    <div className="text-end">
                      <button type="submit" className="btn btn-primary" disabled={sessionLoading}>
                        {sessionLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Scheduling...
                          </>
                        ) : (
                          "Schedule Session"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleSession

