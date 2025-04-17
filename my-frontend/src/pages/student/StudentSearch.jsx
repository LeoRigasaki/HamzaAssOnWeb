"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { searchTutors } from "../../features/users/userSlice"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import ErrorAlert from "../../components/common/ErrorAlert"

const StudentSearch = () => {
  const dispatch = useDispatch()
  const { tutors, isLoading, error } = useSelector((state) => state.users)
  const [searchParams, setSearchParams] = useState({
    subject: "",
    country: "",
    rating: "",
    availability: {
      day: "",
      time: "",
    },
  })
  const [filteredTutors, setFilteredTutors] = useState([])

  // Fetch all tutors on component mount
  useEffect(() => {
    dispatch(searchTutors({}))
  }, [dispatch])

  // Update filtered tutors whenever tutors or search params change
  useEffect(() => {
    if (tutors.length > 0) {
      applyFilters()
    }
  }, [tutors, searchParams])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setSearchParams({
        ...searchParams,
        [parent]: {
          ...searchParams[parent],
          [child]: value,
        },
      })
    } else {
      setSearchParams({
        ...searchParams,
        [name]: value,
      })
    }
  }

  const applyFilters = () => {
    let filtered = [...tutors]

    // Filter by subject
    if (searchParams.subject) {
      filtered = filtered.filter(tutor => 
        tutor.expertise.some(exp => 
          exp.toLowerCase().includes(searchParams.subject.toLowerCase())
        )
      )
    }

    // Filter by country
    if (searchParams.country) {
      filtered = filtered.filter(tutor => 
        tutor.country?.toLowerCase().includes(searchParams.country.toLowerCase())
      )
    }

    // Filter by rating
    if (searchParams.rating) {
      const minRating = parseFloat(searchParams.rating)
      filtered = filtered.filter(tutor => 
        tutor.averageRating >= minRating
      )
    }

    // Filter by availability
    if (searchParams.availability.day && searchParams.availability.time) {
      filtered = filtered.filter(tutor => {
        if (!tutor.availability) return false
        
        return tutor.availability.some(slot => {
          if (searchParams.availability.day && slot.day !== searchParams.availability.day) {
            return false
          }
          
          if (searchParams.availability.time) {
            const [requestedStart, requestedEnd] = searchParams.availability.time.split('-')
            if (slot.startTime > requestedStart || slot.endTime < requestedEnd) {
              return false
            }
          }
          
          return true
        })
      })
    }

    setFilteredTutors(filtered)
  }

  const resetSearch = () => {
    setSearchParams({
      subject: "",
      country: "",
      rating: "",
      availability: {
        day: "",
        time: "",
      },
    })
  }

  // Days of the week for availability filter
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  // Time slots for availability filter
  const timeSlots = ["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"]

  // Get unique subjects from tutors for filter dropdown
  const uniqueSubjects = tutors.length > 0 
    ? [...new Set(tutors.flatMap(tutor => tutor.expertise || []))]
    : []

  return (
    <div className="container">
      <h2 className="mb-4">Find Tutors</h2>

      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="mb-0">Search Filters</h4>
            </div>
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="subject" className="form-label">
                    Subject
                  </label>
                  <select
                    className="form-select"
                    id="subject"
                    name="subject"
                    value={searchParams.subject}
                    onChange={handleChange}
                  >
                    <option value="">All Subjects</option>
                    {uniqueSubjects.map((subject, idx) => (
                      <option key={idx} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="country" className="form-label">
                    Country
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="country"
                    name="country"
                    value={searchParams.country}
                    onChange={handleChange}
                    placeholder="e.g. USA, India"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="rating" className="form-label">
                    Minimum Rating
                  </label>
                  <select
                    className="form-select"
                    id="rating"
                    name="rating"
                    value={searchParams.rating}
                    onChange={handleChange}
                  >
                    <option value="">Any Rating</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Availability</label>
                  <div className="row">
                    <div className="col-md-6">
                      <select
                        className="form-select mb-2"
                        name="availability.day"
                        value={searchParams.availability.day}
                        onChange={handleChange}
                      >
                        <option value="">Any Day</option>
                        {days.map((day, index) => (
                          <option key={index} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select mb-2"
                        name="availability.time"
                        value={searchParams.availability.time}
                        onChange={handleChange}
                      >
                        <option value="">Any Time</option>
                        {timeSlots.map((slot, index) => (
                          <option key={index} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={resetSearch}
                  >
                    Reset Filters
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {error && <ErrorAlert error={error} />}

          {isLoading ? (
            <LoadingSpinner />
          ) : filteredTutors.length === 0 && tutors.length > 0 ? (
            <div className="alert alert-info" role="alert">
              No tutors found matching your criteria. Try adjusting your filters.
            </div>
          ) : (
            <div className="tutor-list">
              {filteredTutors.map((tutor) => (
                <div key={tutor._id} className="card mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <h4 className="card-title">{tutor.name}</h4>
                        <div className="mb-2">
                          {tutor.expertise && tutor.expertise.map((subject, index) => (
                            <span key={index} className="badge bg-primary me-1">
                              {subject}
                            </span>
                          ))}
                          <span className="badge bg-secondary">{tutor.country}</span>
                        </div>
                        <p className="card-text">{tutor.bio}</p>
                        <p className="mb-1">
                          <strong>Experience:</strong> {tutor.experience} years
                        </p>
                        <p className="mb-1">
                          <strong>Education:</strong> {tutor.education}
                        </p>
                        <p className="mb-0">
                          <strong>Hourly Rate:</strong> ${tutor.hourlyRate}/hour
                        </p>
                      </div>
                      <div className="col-md-4 text-center">
                        <div className="rating mb-2">
                          <span className="h4">
                            {tutor.averageRating ? tutor.averageRating.toFixed(1) : "N/A"}
                            <small className="text-muted"> / 5</small>
                          </span>
                          <div className="stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <i
                                key={star}
                                className={`bi ${star <= Math.round(tutor.averageRating || 0) ? "bi-star-fill" : "bi-star"}`}
                              ></i>
                            ))}
                          </div>
                          <small className="text-muted">{tutor.totalReviews || 0} reviews</small>
                        </div>
                        <Link to={`/student/tutor/${tutor._id}`} className="btn btn-outline-primary mb-2">
                          View Profile
                        </Link>
                        <Link to={`/student/schedule/${tutor._id}`} className="btn btn-primary">
                          Schedule Session
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {tutors.length > 0 && filteredTutors.length === 0 && (
                <div className="alert alert-info" role="alert">
                  No tutors found matching your criteria. Try adjusting your filters.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentSearch