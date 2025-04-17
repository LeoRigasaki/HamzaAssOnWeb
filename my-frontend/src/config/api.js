// API configuration
const API_BASE_URL = "http://localhost:5000/api/v1"

export const API_URLS = {
  AUTH: `${API_BASE_URL}/auth`,
  USERS: `${API_BASE_URL}/users`,
  COURSES: `${API_BASE_URL}/courses`,
  SESSIONS: `${API_BASE_URL}/sessions`,
  MESSAGES: `${API_BASE_URL}/messages`,
  ADMIN: `${API_BASE_URL}/admin`,
}

export const SOCKET_URL = "http://localhost:5000"

// Configure axios defaults
import axios from "axios"

// Add a request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add a response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export default axios

