"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { updateProfile } from "../../features/users/userSlice"
import { updatePassword } from "../../features/auth/authSlice"
import ErrorAlert from "../../components/common/ErrorAlert"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const ProfilePage = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { isLoading, success, error } = useSelector((state) => state.users)

  const [activeTab, setActiveTab] = useState("profile")
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    country: "",
    bio: "",
  })
  const [studentData, setStudentData] = useState({
    learningGoals: [""],
    preferredSubjects: [""],
  })
  const [tutorData, setTutorData] = useState({
    expertise: [""],
    availability: [{ day: "Monday", startTime: "09:00", endTime: "17:00" }],
    hourlyRate: 0,
    education: "",
    experience: 0,
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [formErrors, setFormErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    if (user) {
      // Set basic profile data
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        country: user.country || "",
        bio: user.bio || "",
      })

      // Set role-specific data
      if (user.role === "student" && user.learningGoals) {
        setStudentData({
          learningGoals: user.learningGoals.length > 0 ? user.learningGoals : [""],
          preferredSubjects: user.preferredSubjects?.length > 0 ? user.preferredSubjects : [""],
        })
      } else if (user.role === "tutor") {
        setTutorData({
          expertise: user.expertise?.length > 0 ? user.expertise : [""],
          availability: user.availability?.length > 0 
            ? user.availability 
            : [{ day: "Monday", startTime: "09:00", endTime: "17:00" }],
          hourlyRate: user.hourlyRate || 0,
          education: user.education || "",
          experience: user.experience || 0,
        })
      }
    }
  }, [user])

  useEffect(() => {
    if (success) {
      setSuccessMessage("Profile updated successfully!")
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    }
  }, [success])

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    })
  }

  const handleStudentChange = (field, index, value) => {
    const updated = [...studentData[field]]
    updated[index] = value
    setStudentData({
      ...studentData,
      [field]: updated,
    })
  }

  const addStudentField = (field) => {
    setStudentData({
      ...studentData,
      [field]: [...studentData[field], ""],
    })
  }

  const removeStudentField = (field, index) => {
    if (studentData[field].length > 1) {
      const updated = [...studentData[field]]
      updated.splice(index, 1)
      setStudentData({
        ...studentData,
        [field]: updated,
      })
    }
  }

  const handleTutorChange = (e) => {
    setTutorData({
      ...tutorData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAvailabilityChange = (index, field, value) => {
    const updated = [...tutorData.availability]
    updated[index] = {
      ...updated[index],
      [field]: value,
    }
    setTutorData({
      ...tutorData,
      availability: updated,
    })
  }

  const addAvailability = () => {
    setTutorData({
      ...tutorData,
      availability: [
        ...tutorData.availability,
        { day: "Monday", startTime: "09:00", endTime: "17:00" },
      ],
    })
  }

  const removeAvailability = (index) => {
    if (tutorData.availability.length > 1) {
      const updated = [...tutorData.availability]
      updated.splice(index, 1)
      setTutorData({
        ...tutorData,
        availability: updated,
      })
    }
  }

  const handleExpertiseChange = (index, value) => {
    const updated = [...tutorData.expertise]
    updated[index] = value
    setTutorData({
      ...tutorData,
      expertise: updated,
    })
  }

  const addExpertise = () => {
    setTutorData({
      ...tutorData,
      expertise: [...tutorData.expertise, ""],
    })
  }

  const removeExpertise = (index) => {
    if (tutorData.expertise.length > 1) {
      const updated = [...tutorData.expertise]
      updated.splice(index, 1)
      setTutorData({
        ...tutorData,
        expertise: updated,
      })
    }
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const validateProfileForm = () => {
    const errors = {}

    if (!profileData.name) errors.name = "Name is required"
    if (!profileData.email) errors.email = "Email is required"
    if (!profileData.country) errors.country = "Country is required"

    // Role-specific validation
    if (user?.role === "student") {
      if (studentData.learningGoals.some(goal => !goal.trim())) {
        errors.learningGoals = "All learning goals must be filled"
      }
      if (studentData.preferredSubjects.some(subject => !subject.trim())) {
        errors.preferredSubjects = "All preferred subjects must be filled"
      }
    } else if (user?.role === "tutor") {
      if (tutorData.expertise.some(exp => !exp.trim())) {
        errors.expertise = "All expertise fields must be filled"
      }
      if (!tutorData.education) errors.education = "Education is required"
      if (tutorData.hourlyRate < 0) errors.hourlyRate = "Hourly rate cannot be negative"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePasswordForm = () => {
    const errors = {}

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required"
    }
    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required"
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters"
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()

    if (validateProfileForm()) {
      // Prepare data based on role
      let updateData = { ...profileData }

      if (user?.role === "student") {
        updateData = {
          ...updateData,
          learningGoals: studentData.learningGoals.filter(goal => goal.trim()),
          preferredSubjects: studentData.preferredSubjects.filter(subject => subject.trim()),
        }
      } else if (user?.role === "tutor") {
        updateData = {
          ...updateData,
          expertise: tutorData.expertise.filter(exp => exp.trim()),
          availability: tutorData.availability,
          hourlyRate: parseFloat(tutorData.hourlyRate),
          education: tutorData.education,
          experience: parseInt(tutorData.experience),
        }
      }

      dispatch(updateProfile(updateData))
    }
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()

    if (validatePasswordForm()) {
      dispatch(updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }))
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Your Profile</h2>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {error && <ErrorAlert error={error} />}

      <div className="row">
        <div className="col-md-3">
          <div className="card mb-4">
            <div className="card-body text-center">
              <div className="mb-3">
                <span className="display-1">
                  <i className="bi bi-person-circle"></i>
                </span>
              </div>
              <h5 className="card-title">{user?.name}</h5>
              <p className="card-text text-muted">
                {user?.role === "student" ? "Student" : user?.role === "tutor" ? "Tutor" : "Admin"}
              </p>
            </div>
          </div>

          <div className="list-group mb-4">
            <button
              className={`list-group-item list-group-item-action ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <i className="bi bi-person me-2"></i> Basic Information
            </button>
            {user?.role === "student" && (
              <button
                className={`list-group-item list-group-item-action ${activeTab === "student" ? "active" : ""}`}
                onClick={() => setActiveTab("student")}
              >
                <i className="bi bi-book me-2"></i> Learning Preferences
              </button>
            )}
            {user?.role === "tutor" && (
              <button
                className={`list-group-item list-group-item-action ${activeTab === "tutor" ? "active" : ""}`}
                onClick={() => setActiveTab("tutor")}
              >
                <i className="bi bi-briefcase me-2"></i> Tutor Information
              </button>
            )}
            <button
              className={`list-group-item list-group-item-action ${activeTab === "password" ? "active" : ""}`}
              onClick={() => setActiveTab("password")}
            >
              <i className="bi bi-shield-lock me-2"></i> Change Password
            </button>
          </div>
        </div>

        <div className="col-md-9">
          <div className="card">
            <div className="card-body">
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <>
                  {/* Basic profile information */}
                  {activeTab === "profile" && (
                    <form onSubmit={handleProfileSubmit}>
                      <h4 className="mb-4">Basic Information</h4>
                      <div className="mb-3">
                        <label htmlFor="name" className="form-label">
                          Full Name
                        </label>
                        <input
                          type="text"
                          className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                          id="name"
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                        />
                        {formErrors.name && (
                          <div className="invalid-feedback">{formErrors.name}</div>
                        )}
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
                          value={profileData.email}
                          onChange={handleProfileChange}
                        />
                        {formErrors.email && (
                          <div className="invalid-feedback">{formErrors.email}</div>
                        )}
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
                          value={profileData.country}
                          onChange={handleProfileChange}
                        />
                        {formErrors.country && (
                          <div className="invalid-feedback">{formErrors.country}</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="bio" className="form-label">
                          Bio
                        </label>
                        <textarea
                          className="form-control"
                          id="bio"
                          name="bio"
                          rows="4"
                          value={profileData.bio}
                          onChange={handleProfileChange}
                        ></textarea>
                      </div>

                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                    </form>
                  )}

                  {/* Student-specific information */}
                  {activeTab === "student" && user?.role === "student" && (
                    <form onSubmit={handleProfileSubmit}>
                      <h4 className="mb-4">Learning Preferences</h4>

                      <div className="mb-3">
                        <label className="form-label">Learning Goals</label>
                        {formErrors.learningGoals && (
                          <div className="text-danger small mb-2">{formErrors.learningGoals}</div>
                        )}
                        {studentData.learningGoals.map((goal, index) => (
                          <div key={`goal-${index}`} className="input-group mb-2">
                            <input
                              type="text"
                              className="form-control"
                              value={goal}
                              onChange={(e) => handleStudentChange("learningGoals", index, e.target.value)}
                              placeholder="Enter a learning goal"
                            />
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => removeStudentField("learningGoals", index)}
                              disabled={studentData.learningGoals.length === 1}
                            >
                              <i className="bi bi-dash"></i>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => addStudentField("learningGoals")}
                        >
                          <i className="bi bi-plus"></i> Add Learning Goal
                        </button>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Preferred Subjects</label>
                        {formErrors.preferredSubjects && (
                          <div className="text-danger small mb-2">{formErrors.preferredSubjects}</div>
                        )}
                        {studentData.preferredSubjects.map((subject, index) => (
                          <div key={`subject-${index}`} className="input-group mb-2">
                            <input
                              type="text"
                              className="form-control"
                              value={subject}
                              onChange={(e) => handleStudentChange("preferredSubjects", index, e.target.value)}
                              placeholder="Enter a preferred subject"
                            />
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => removeStudentField("preferredSubjects", index)}
                              disabled={studentData.preferredSubjects.length === 1}
                            >
                              <i className="bi bi-dash"></i>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => addStudentField("preferredSubjects")}
                        >
                          <i className="bi bi-plus"></i> Add Preferred Subject
                        </button>
                      </div>

                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                    </form>
                  )}

                  {/* Tutor-specific information */}
                  {activeTab === "tutor" && user?.role === "tutor" && (
                    <form onSubmit={handleProfileSubmit}>
                      <h4 className="mb-4">Tutor Information</h4>

                      <div className="mb-3">
                        <label className="form-label">Expertise</label>
                        {formErrors.expertise && (
                          <div className="text-danger small mb-2">{formErrors.expertise}</div>
                        )}
                        {tutorData.expertise.map((expertise, index) => (
                          <div key={`expertise-${index}`} className="input-group mb-2">
                            <input
                              type="text"
                              className="form-control"
                              value={expertise}
                              onChange={(e) => handleExpertiseChange(index, e.target.value)}
                              placeholder="Enter a subject you teach"
                            />
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => removeExpertise(index)}
                              disabled={tutorData.expertise.length === 1}
                            >
                              <i className="bi bi-dash"></i>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={addExpertise}
                        >
                          <i className="bi bi-plus"></i> Add Expertise
                        </button>
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
                          onChange={handleTutorChange}
                        />
                        {formErrors.education && (
                          <div className="invalid-feedback">{formErrors.education}</div>
                        )}
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="hourlyRate" className="form-label">
                            Hourly Rate ($)
                          </label>
                          <input
                            type="number"
                            className={`form-control ${formErrors.hourlyRate ? "is-invalid" : ""}`}
                            id="hourlyRate"
                            name="hourlyRate"
                            value={tutorData.hourlyRate}
                            onChange={handleTutorChange}
                            min="0"
                            step="0.01"
                          />
                          {formErrors.hourlyRate && (
                            <div className="invalid-feedback">{formErrors.hourlyRate}</div>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="experience" className="form-label">
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="experience"
                            name="experience"
                            value={tutorData.experience}
                            onChange={handleTutorChange}
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Availability</label>
                        {tutorData.availability.map((slot, index) => (
                          <div key={`availability-${index}`} className="card mb-2">
                            <div className="card-body">
                              <div className="row">
                                <div className="col-md-4 mb-2">
                                  <label className="form-label">Day</label>
                                  <select
                                    className="form-select"
                                    value={slot.day}
                                    onChange={(e) => handleAvailabilityChange(index, "day", e.target.value)}
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
                                <div className="col-md-3 mb-2">
                                  <label className="form-label">Start Time</label>
                                  <input
                                    type="time"
                                    className="form-control"
                                    value={slot.startTime}
                                    onChange={(e) => handleAvailabilityChange(index, "startTime", e.target.value)}
                                  />
                                </div>
                                <div className="col-md-3 mb-2">
                                  <label className="form-label">End Time</label>
                                  <input
                                    type="time"
                                    className="form-control"
                                    value={slot.endTime}
                                    onChange={(e) => handleAvailabilityChange(index, "endTime", e.target.value)}
                                  />
                                </div>
                                <div className="col-md-2 d-flex align-items-end mb-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger w-100"
                                    onClick={() => removeAvailability(index)}
                                    disabled={tutorData.availability.length === 1}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={addAvailability}
                        >
                          <i className="bi bi-plus"></i> Add Availability Slot
                        </button>
                      </div>

                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                    </form>
                  )}

                  {/* Password change */}
                  {activeTab === "password" && (
                    <form onSubmit={handlePasswordSubmit}>
                      <h4 className="mb-4">Change Password</h4>

                      <div className="mb-3">
                        <label htmlFor="currentPassword" className="form-label">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className={`form-control ${formErrors.currentPassword ? "is-invalid" : ""}`}
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                        />
                        {formErrors.currentPassword && (
                          <div className="invalid-feedback">{formErrors.currentPassword}</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="newPassword" className="form-label">
                          New Password
                        </label>
                        <input
                          type="password"
                          className={`form-control ${formErrors.newPassword ? "is-invalid" : ""}`}
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                        />
                        {formErrors.newPassword && (
                          <div className="invalid-feedback">{formErrors.newPassword}</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className={`form-control ${formErrors.confirmPassword ? "is-invalid" : ""}`}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                        />
                        {formErrors.confirmPassword && (
                          <div className="invalid-feedback">{formErrors.confirmPassword}</div>
                        )}
                      </div>

                      <button type="submit" className="btn btn-primary">
                        Update Password
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage