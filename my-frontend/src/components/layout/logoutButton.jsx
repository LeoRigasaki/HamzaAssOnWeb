import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice';

const LogoutButton = ({ className = "dropdown-item" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Use useCallback to prevent recreation of this function on each render
  const handleLogout = useCallback(async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      setIsLoading(true);
      try {
        await dispatch(logout()).unwrap();
        // Set a small timeout to allow the state to update before navigating
        setTimeout(() => {
          navigate("/login");
        }, 100);
      } catch (error) {
        console.error("Logout failed:", error);
        // Even if dispatch fails, we'll still navigate to login
        // since the reducer should have cleared the auth state
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    }
  }, [dispatch, navigate]);

  return (
    <button 
      className={className} 
      onClick={handleLogout} 
      disabled={isLoading}
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
};

export default React.memo(LogoutButton);