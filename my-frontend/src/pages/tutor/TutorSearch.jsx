"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { searchStudents } from "../../features/users/userSlice"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import ErrorAlert from "../../components/common/ErrorAlert"

const TutorSearch = () => {
  const dispatch = useDispatch()
  const { students = [], isLoading, error } = useSelector((state) => state.users)
  const [searchParams, setSearchParams] = useState({
    subject: "",
    learningGoal: "",
    grade: "",
    country: "",
  })
  const [filteredStudents, setFilteredStudents] = useState([])

  // Fetch all students on component mount
  useEffect(() => {
    dispatch(searchStudents({}))
  }, [dispatch])

  // Update filtered students whenever students or search params change
  useEffect(() => {
    if (students && students.length > 0) {
      applyFilters()
    } else {
      setFilteredStudents([])
    }
  }, [students, searchParams])

  const handleChange = (e) => {
    const { name, value } = e.target
    setSearchParams({
      ...searchParams,
      [name]: value,
    })
  }

  const applyFilters = () => {
    if (!students || !Array.isArray(students)) {
      setFilteredStudents([])
      return
    }
    
    let filtered = [...students]

    // Filter by subject
    if (searchParams.subject) {
      filtered = filtered.filter(student => 
        student.preferredSubjects && student.preferredSubjects.some(subject => 
          subject.toLowerCase().includes(searchParams.subject.toLowerCase())
        )
      )
    }

    // Filter by learning goal
    if (searchParams.learningGoal) {
      filtered = filtered.filter(student => 
        student.learningGoals && student.learningGoals.some(goal => 
          goal.toLowerCase().includes(searchParams.learningGoal.toLowerCase())
        )
      )
    }

    // Filter by grade/level
    if (searchParams.grade) {
      filtered = filtered.filter(student => 
        student.grade === searchParams.grade
      )
    }

    // Filter by country
    if (searchParams.country) {
      filtered = filtered.filter(student => 
        student.country && student.country.toLowerCase().includes(searchParams.country.toLowerCase())
      )
    }

    setFilteredStudents(filtered)
  }

  const resetSearch = () => {
    setSearchParams({
      subject: "",
      learningGoal: "",
      grade: "",
      country: "",
    })
  }

  // Get unique subjects and learning goals from students for filter dropdowns
  const uniqueSubjects = students && students.length > 0 
    ? [...new Set(students.flatMap(student => student.preferredSubjects || []))]
    : []
    
  const uniqueLearningGoals = students && students.length > 0 
    ? [...new Set(students.flatMap(student => student.learningGoals || []))]
    : []

  return (
    <div className="container">
      <h2 className="mb-4">Find Students</h2>

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
                    <option value="">Any Subject</option>
                    {uniqueSubjects.map((subject, idx) => (
                      <option key={idx} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="learningGoal" className="form-label">
                    Learning Goal
                  </label>
                  <select
                    className="form-select"
                    id="learningGoal"
                    name="learningGoal"
                    value={searchParams.learningGoal}
                    onChange={handleChange}
                  >
                    <option value="">Any Learning Goal</option>
                    {uniqueLearningGoals.map((goal, idx) => (
                      <option key={idx} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="grade" className="form-label">
                    Grade/Level
                  </label>
                  <select
                    className="form-select"
                    id="grade"
                    name="grade"
                    value={searchParams.grade}
                    onChange={handleChange}
                  >
                    <option value="">Any Level</option>
                    <option value="Elementary">Elementary</option>
                    <option value="Middle School">Middle School</option>
                    <option value="High School">High School</option>
                    <option value="College">College</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Adult Learning">Adult Learning</option>
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
          ) : !students || students.length === 0 ? (
            <div className="alert alert-info" role="alert">
              No students found. This might be because the student search feature is not yet implemented on the backend.
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="alert alert-info" role="alert">
              No students found matching your criteria. Try adjusting your filters.
            </div>
          ) : (
            <div className="student-list">
              {filteredStudents.map((student) => (
                <div key={student._id} className="card mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <h4 className="card-title">{student.name}</h4>
                        <div className="mb-2">
                          <span className="badge bg-secondary">{student.country}</span>
                        </div>
                        <p className="card-text">{student.bio}</p>

                        <h5 className="mt-3">Learning Goals</h5>
                        <ul className="list-group list-group-flush mb-3">
                          {student.learningGoals && student.learningGoals.length > 0 ? (
                            student.learningGoals.map((goal, index) => (
                              <li key={index} className="list-group-item">
                                {goal}
                              </li>
                            ))
                          ) : (
                            <li className="list-group-item">No learning goals specified</li>
                          )}
                        </ul>

                        <h5>Preferred Subjects</h5>
                        <div className="mb-2">
                          {student.preferredSubjects && student.preferredSubjects.length > 0 ? (
                            student.preferredSubjects.map((subject, index) => (
                              <span key={index} className="badge bg-primary me-1">
                                {subject}
                              </span>
                            ))
                          ) : (
                            <span>No preferred subjects specified</span>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4 text-center">
                        <div className="mb-3">
                          <h5>Session History</h5>
                          <p className="mb-1">
                            <small className="text-muted">Completed Sessions: {student.completedSessions || 0}</small>
                          </p>
                        </div>

                        <Link to={`/tutor/student/${student._id}`} className="btn btn-outline-primary mb-2">
                          View Profile
                        </Link>
                        <Link to={`/tutor/schedule/${student._id}`} className="btn btn-primary">
                          Offer Session
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TutorSearch