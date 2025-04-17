import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { logout } from "../../features/auth/authSlice"

const Header = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">Learn Bridge</Link>
          
          {/* Simplified Navigation Links */}
          <div className="d-flex align-items-center">
            {isAuthenticated && (
              <>
                <span className="text-white me-3">Hello, {user?.name || 'User'}</span>
                <button 
                  className="btn btn-danger" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}
            
            {!isAuthenticated && (
              <Link className="btn btn-light" to="/login">Login</Link>
            )}
          </div>
        </div>
      </nav>
      
      {/* Simple Navigation Menu */}
      {isAuthenticated && (
        <div className="bg-light py-2">
          <div className="container">
            <div className="d-flex flex-wrap">
              {user?.role === "student" && (
                <>
                  <Link className="me-3 mb-1" to="/student/dashboard">Home</Link>
                  <Link className="me-3 mb-1" to="/student/catalog">Courses</Link>
                  <Link className="me-3 mb-1" to="/student/search">Find Tutors</Link>
                  <Link className="me-3 mb-1" to="/student/meetings">Meetings</Link>
                </>
              )}
              
              {user?.role === "tutor" && (
                <>
                  <Link className="me-3 mb-1" to="/tutor/dashboard">Home</Link>
                  <Link className="me-3 mb-1" to="/tutor/catalog">My Courses</Link>
                  <Link className="me-3 mb-1" to="/tutor/search">Find Students</Link>
                  <Link className="me-3 mb-1" to="/tutor/meetings">Meetings</Link>
                </>
              )}
              
              {user?.role === "admin" && (
                <Link className="me-3 mb-1" to="/admin/dashboard">Dashboard</Link>
              )}
              
              <Link className="me-3 mb-1" to="/profile">My Profile</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Header