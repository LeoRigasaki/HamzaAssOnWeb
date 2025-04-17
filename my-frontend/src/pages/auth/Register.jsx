"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { register, reset } from "../../features/auth/authSlice"

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
    role: "student",
    country: "",
    bio: "",
  })

  const [studentData, setStudentData] = useState({
    learningGoals: [""],
    preferredSubjects: [""],
  })

  const [tutorData, setTutorData] = useState({
    expertise: [""],
    hourlyRate: 0,
    education: "",
    experience: 0,
  })

  const [formErrors, setFormErrors] = useState({})

  const { name, email, password, password2, role, country, bio } = formData
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth)

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated && user) {
      switch (user.role) {
        case "student":
          navigate("/student/landing")
          break
        case "tutor":
          navigate("/tutor/landing")
          break
        case "admin":
          navigate("/admin/dashboard")
          break
        default:
          navigate("/")
      }
    }

    // Reset errors when component unmounts
    return () => {
      dispatch(reset())
    }
  }, [isAuthenticated, user, navigate, dispatch])

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const onStudentChange = (e, index) => {
    const { name, value } = e.target
    const list = [...studentData[name]]
    list[index] = value
    setStudentData({ ...studentData, [name]: list })
  }

  const onTutorChange = (e, index) => {
    const { name, value } = e.target
    if (name === "hourlyRate" || name === "experience") {
      setTutorData({ ...tutorData, [name]: value })
    } else if (name === "education") {
      setTutorData({ ...tutorData, [name]: value })
    } else {
      const list = [...tutorData[name]]
      list[index] = value
      setTutorData({ ...tutorData, [name]: list })
    }
  }

  const addStudentField = (field) => {
    setStudentData({
      ...studentData,
      [field]: [...studentData[field], ""],
    })
  }

  const removeStudentField = (field, index) => {
    const list = [...studentData[field]]
    list.splice(index, 1)
    setStudentData({ ...studentData, [field]: list })
  }

  const addTutorField = (field) => {
    setTutorData({
      ...tutorData,
      [field]: [...tutorData[field], ""],
    })
  }

  const removeTutorField = (field, index) => {
    const list = [...tutorData[field]]
    list.splice(index, 1)
    setTutorData({ ...tutorData, [field]: list })
  }

  const validateForm = () => {
    const errors = {}

    if (!name) errors.name = "Name is required"

    if (!email) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid"
    }

    if (!password) {
      errors.password = "Password is required"
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }

    if (password !== password2) {
      errors.password2 = "Passwords do not match"
    }

    if (!country) errors.country = "Country is required"

    if (role === "tutor") {
      if (!tutorData.education) errors.education = "Education is required"
      if (tutorData.expertise.some((item) => !item)) errors.expertise = "All expertise fields must be filled"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      // Prepare registration data based on role
      let userData = { ...formData }

      if (role === "student") {
        userData = {
          ...userData,
          learningGoals: studentData.learningGoals.filter((goal) => goal.trim() !== ""),
          preferredSubjects: studentData.preferredSubjects.filter((subject) => subject.trim() !== ""),
        }
      } else if (role === "tutor") {
        userData = {
          ...userData,
          expertise: tutorData.expertise.filter((exp) => exp.trim() !== ""),
          hourlyRate: Number(tutorData.hourlyRate),
          education: tutorData.education,
          experience: Number(tutorData.experience),
        }
      }

      // Remove password confirmation field
      delete userData.password2

      dispatch(register(userData))
    }
  }

  return (
    <div className="auth-container" style={{ maxWidth: "600px" }}>
      <h2 className="text-center mb-4">Register for Learn Bridge</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="role" className="form-label">
            I am a:
          </label>
          <select className="form-select" id="role" name="role" value={role} onChange={onChange}>
            <option value="student">Student</option>
            <option value="tutor">Tutor</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Full Name
          </label>
          <input
            type="text"
            className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
            id="name"
            name="name"
            value={name}
            onChange={onChange}
            placeholder="Enter your full name"
          />
          {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            type="email"
            className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            placeholder="Enter your email"
          />
          {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            className={`form-control ${formErrors.password ? "is-invalid" : ""}`}
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            placeholder="Enter your password"
          />
          {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="password2" className="form-label">
            Confirm Password
          </label>
          <input
            type="password"
            className={`form-control ${formErrors.password2 ? "is-invalid" : ""}`}
            id="password2"
            name="password2"
            value={password2}
            onChange={onChange}
            placeholder="Confirm your password"
          />
          {formErrors.password2 && <div className="invalid-feedback">{formErrors.password2}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="country" className="form-label">
            Country
          </label>
          <input
            type="text"
            className={`form-control ${formErrors.country ? "is-invalid" : ""}`}
            id="country"
            name="country"
            value={country}
            onChange={onChange}
            placeholder="Enter your country"
          />
          {formErrors.country && <div className="invalid-feedback">{formErrors.country}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="bio" className="form-label">
            Bio
          </label>
          <textarea
            className="form-control"
            id="bio"
            name="bio"
            value={bio}
            onChange={onChange}
            placeholder="Tell us about yourself"
            rows="3"
          ></textarea>
        </div>

        {/* Role-specific fields */}
        {role === "student" && (
          <>
            <h4 className="mt-4">Student Information</h4>

            <div className="mb-3">
              <label className="form-label">Learning Goals</label>
              {studentData.learningGoals.map((goal, index) => (
                <div key={`goal-${index}`} className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    name="learningGoals"
                    value={goal}
                    onChange={(e) => onStudentChange(e, index)}
                    placeholder="Enter a learning goal"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeStudentField("learningGoals", index)}
                    disabled={studentData.learningGoals.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => addStudentField("learningGoals")}
              >
                Add Learning Goal
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label">Preferred Subjects</label>
              {studentData.preferredSubjects.map((subject, index) => (
                <div key={`subject-${index}`} className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    name="preferredSubjects"
                    value={subject}
                    onChange={(e) => onStudentChange(e, index)}
                    placeholder="Enter a preferred subject"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeStudentField("preferredSubjects", index)}
                    disabled={studentData.preferredSubjects.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => addStudentField("preferredSubjects")}
              >
                Add Preferred Subject
              </button>
            </div>
          </>
        )}

        {role === "tutor" && (
          <>
            <h4 className="mt-4">Tutor Information</h4>

            <div className="mb-3">
              <label className="form-label">Expertise</label>
              {tutorData.expertise.map((exp, index) => (
                <div key={`exp-${index}`} className="input-group mb-2">
                  <input
                    type="text"
                    className={`form-control ${formErrors.expertise ? "is-invalid" : ""}`}
                    name="expertise"
                    value={exp}
                    onChange={(e) => onTutorChange(e, index)}
                    placeholder="Enter a subject you teach"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeTutorField("expertise", index)}
                    disabled={tutorData.expertise.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {formErrors.expertise && <div className="text-danger small mb-2">{formErrors.expertise}</div>}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => addTutorField("expertise")}
              >
                Add Expertise
              </button>
            </div>

            <div className="mb-3">
              <label htmlFor="hourlyRate" className="form-label">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                className="form-control"
                id="hourlyRate"
                name="hourlyRate"
                value={tutorData.hourlyRate}
                onChange={(e) => onTutorChange(e)}
                min="0"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="education" className="form-label">
                Education
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.education ? "is-invalid" : ""}`}
                id="education"
                name="education"
                value={tutorData.education}
                onChange={(e) => onTutorChange(e)}
                placeholder="Enter your educational background"
              />
              {formErrors.education && <div className="invalid-feedback">{formErrors.education}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="experience" className="form-label">
                Years of Experience
              </label>
              <input
                type="number"
                className="form-control"
                id="experience"
                name="experience"
                value={tutorData.experience}
                onChange={(e) => onTutorChange(e)}
                min="0"
              />
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary w-100 mt-3" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Registering...
            </>
          ) : (
            "Register"
          )}
        </button>
      </form>

      <div className="mt-3 text-center">
        <p>
          Already have an account?{" "}
          <Link to="/login" className="text-decoration-none">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register

