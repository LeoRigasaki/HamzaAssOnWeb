import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { getUpcomingSessions, getSessionHistory, updateSessionStatus } from "../../features/sessions/sessionSlice"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const StudentMeetings = () => {
  const dispatch = useDispatch()
  const { upcomingSessions, sessionHistory, isLoading, error } = useSelector((state) => state.sessions)

  const [activeTab, setActiveTab] = useState("upcoming")
  const [statusUpdating, setStatusUpdating] = useState(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const [localError, setLocalError] = useState(null)

  // Load data on initial render and when refresh is triggered
  useEffect(() => {
    const loadData = async () => {
      try {
        setLocalError(null);
        await Promise.all([
          dispatch(getUpcomingSessions()).unwrap(),
          dispatch(getSessionHistory()).unwrap()
        ]);
      } catch (err) {
        console.error("Failed to load sessions:", err);
        setLocalError("Failed to load your sessions. Please try again.");
      }
    };
    
    loadData();
  }, [dispatch, refreshCount]);

  // Add a manual refresh function
  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  const handleStatusChange = (sessionId, status) => {
    setStatusUpdating(sessionId)
    dispatch(updateSessionStatus({ id: sessionId, status }))
      .unwrap()
      .then(() => {
        // Refresh the sessions on success
        handleRefresh();
      })
      .catch(err => {
        console.error("Error updating status:", err);
        setLocalError("Failed to update session status. Please try again.");
      })
      .finally(() => {
        setStatusUpdating(null);
      });
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (err) {
      console.error("Date formatting error:", err);
      return "Invalid date";
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge bg-warning">Pending</span>
      case "accepted":
        return <span className="badge bg-primary">Accepted</span>
      case "rejected":
        return <span className="badge bg-danger">Rejected</span>
      case "completed":
        return <span className="badge bg-success">Completed</span>
      case "cancelled":
        return <span className="badge bg-secondary">Cancelled</span>
      default:
        return <span className="badge bg-light text-dark">Unknown</span>
    }
  }

  // Helper function to safely get tutor name
  const getTutorName = (session) => {
    try {
      if (!session) return "Tutor";
      
      // Debug output for testing
      if (process.env.NODE_ENV === 'development') {
        console.log("Session tutor data:", session.tutor);
      }
      
      if (session.tutor) {
        if (typeof session.tutor === 'object' && session.tutor.name) {
          return session.tutor.name;
        }
        if (typeof session.tutor === 'string') {
          return "Tutor";
        }
      }
      
      return "Tutor";
    } catch (err) {
      console.error("Error getting tutor name:", err);
      return "Tutor";
    }
  }

  // Helper function to check if chat link should be enabled
  const isChatLinkEnabled = (session) => {
    try {
      return session && session.tutor && 
             (typeof session.tutor === 'object' && session.tutor._id);
    } catch (err) {
      console.error("Error checking chat link:", err);
      return false;
    }
  }

  // Helper function to get tutor ID for chat link
  const getChatLinkId = (session) => {
    try {
      if (!session || !session.tutor) return "";
      
      if (typeof session.tutor === 'object' && session.tutor._id) {
        return session.tutor._id;
      }
      
      if (typeof session.tutor === 'string') {
        return session.tutor;
      }
      
      return "";
    } catch (err) {
      console.error("Error getting chat ID:", err);
      return "";
    }
  }

  const renderSessionList = (sessionList) => {
    if (isLoading && !sessionList.length) {
      return <LoadingSpinner />
    }

    if (!sessionList || sessionList.length === 0) {
      return (
        <div className="text-center py-5">
          <p>No sessions found.</p>
          <Link to="/student/search" className="btn btn-primary">
            Find Tutors
          </Link>
        </div>
      )
    }

    return (
      <div className="list-group">
        {sessionList.map((session) => (
          <div key={session._id} className="list-group-item list-group-item-action">
            <div className="d-flex w-100 justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">{session.subject || "Untitled Session"}</h5>
                <p className="mb-1">
                  <strong>Tutor:</strong> {getTutorName(session)}
                </p>
                <p className="mb-1">
                  <strong>Date:</strong> {formatDate(session.date)}
                </p>
                <p className="mb-1">
                  <strong>Time:</strong> {session.startTime || "Not set"} - {session.endTime || "Not set"}
                </p>
                {session.notes && (
                  <p className="mb-1">
                    <strong>Notes:</strong> {session.notes}
                  </p>
                )}
              </div>
              <div className="text-end">
                <div className="mb-2">{getStatusBadge(session.status)}</div>
                <div className="btn-group">
                  {session.status === "accepted" && (
                    <>
                      {session.meetingLink ? (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success btn-sm"
                        >
                          Join Meeting
                        </a>
                      ) : (
                        <Link to={`/video/${session._id}`} className="btn btn-success btn-sm">
                          Start Video
                        </Link>
                      )}
                      <Link 
                        to={isChatLinkEnabled(session) ? `/chat/${getChatLinkId(session)}` : "#"} 
                        className={`btn btn-primary btn-sm ${!isChatLinkEnabled(session) ? 'disabled' : ''}`}
                      >
                        Chat with {getTutorName(session)}
                      </Link>
                    </>
                  )}
                  {session.status === "pending" && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStatusChange(session._id, "cancelled")}
                      disabled={statusUpdating === session._id}
                    >
                      {statusUpdating === session._id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                  {session.status === "completed" && (
                    <Link to={`/student/review/${session._id}`} className="btn btn-outline-primary btn-sm">
                      Leave Review
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Sessions</h2>
        <button 
          className="btn btn-outline-secondary"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : <><i className="bi bi-arrow-clockwise me-1"></i> Refresh</>}
        </button>
      </div>

      {(error || localError) && (
        <div className="alert alert-danger" role="alert">
          {error || localError}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => setLocalError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming Sessions
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Session History
          </button>
        </li>
      </ul>

      {activeTab === "upcoming" ? renderSessionList(upcomingSessions) : renderSessionList(sessionHistory)}
    </div>
  )
}

export default StudentMeetings