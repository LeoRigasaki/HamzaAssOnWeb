import { Navigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { useMemo } from "react"
import LoadingSpinner from "../common/LoadingSpinner"

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth)
  const location = useLocation()

  // Use useMemo to prevent unnecessary re-renders
  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
          <LoadingSpinner />
        </div>
      )
    }

    if (!isAuthenticated) {
      // Redirect to login page but save the location they were trying to access
      return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
  }, [isLoading, isAuthenticated, location, children])

  return content
}

export default PrivateRoute