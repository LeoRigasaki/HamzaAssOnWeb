import { Navigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { useMemo } from "react"
import LoadingSpinner from "../common/LoadingSpinner"

const RoleRoute = ({ children, role }) => {
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth)
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
      return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check if user has the required role
    if (user?.role !== role) {
      return <Navigate to="/" replace />
    }

    return children
  }, [isLoading, isAuthenticated, user, role, location, children])

  return content
}

export default RoleRoute