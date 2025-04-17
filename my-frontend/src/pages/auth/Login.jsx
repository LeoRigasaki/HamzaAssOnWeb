"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { login, reset } from "../../features/auth/authSlice"
import ErrorAlert from "../../components/common/ErrorAlert"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [formErrors, setFormErrors] = useState({})

  const { email, password } = formData
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth)

  // Get the redirect path from location state or default to home
  const from = location.state?.from?.pathname || "/"

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated && user) {
      const redirectPath =
        from !== "/"
          ? from
          : user.role === "student"
            ? "/student/dashboard"
            : user.role === "tutor"
              ? "/tutor/dashboard"
              : user.role === "admin"
                ? "/admin/dashboard"
                : "/"

      navigate(redirectPath, { replace: true })
    }

    // Reset errors when component unmounts
    return () => {
      dispatch(reset())
    }
  }, [isAuthenticated, user, navigate, dispatch, from])

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })

    // Clear field error when user types
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: null,
      })
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!email) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid"
    }

    if (!password) {
      errors.password = "Password is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      dispatch(login(formData))
    }
  }

  const handleDismissError = () => {
    dispatch(reset())
  }

  return (
    <div className="auth-container">
      <h2 className="text-center mb-4">Login to Learn Bridge</h2>

      {error && <ErrorAlert error={error} onDismiss={handleDismissError} />}

      <form onSubmit={onSubmit}>
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
          <Link to="/forgot-password" className="text-decoration-none">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>

      <div className="mt-3 text-center">
        <p>
          Don't have an account?{" "}
          <Link to="/register" className="text-decoration-none">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login

