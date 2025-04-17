"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setError("Please enter your email address")
      return
    }

    try {
      setIsLoading(true)
      setError("")
      setMessage("")

      const response = await axios.post("http://localhost:5000/api/v1/auth/forgotpassword", { email })

      setMessage("Password reset instructions have been sent to your email")
      setIsLoading(false)
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <h2 className="text-center mb-4">Forgot Password</h2>

      {message && (
        <div className="alert alert-success" role="alert">
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <div className="form-text">We'll send you instructions to reset your password.</div>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Sending...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      <div className="mt-3 text-center">
        <p>
          Remember your password?{" "}
          <Link to="/login" className="text-decoration-none">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword

