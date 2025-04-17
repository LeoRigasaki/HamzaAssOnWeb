import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import {
  getUpcomingSessions,
  getSessionHistory,
  updateSessionStatus,
  addMeetingLink,
} from "../../features/sessions/sessionSlice"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const TutorMeetings = () => {
  const dispatch = useDispatch()
  const { upcomingSessions, sessionHistory, isLoading, error } = useSelector((state) => state.sessions)

  const [activeTab, setActiveTab] = useState("upcoming")
  const [statusUpdating, setStatusUpdating] = useState(null)
  const [meetingLinkData, setMeetingLinkData] = useState({
    sessionId: null,
    meetingLink: "",
  })
  const [showLinkModal, setShowLinkModal] = useState(false)
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

  const handleAddMeetingLink = () => {
    if (meetingLinkData.meetingLink.trim()) {
      dispatch(
        addMeetingLink({
          id: meetingLinkData.sessionId,
          meetingLink: meetingLinkData.meetingLink,
        }),
      )
        .unwrap()
        .then(() => {
          setShowLinkModal(false);
          setMeetingLinkData({
            sessionId: null,
            meetingLink: "",
          });
          // Refresh the sessions
          handleRefresh();
        })
        .catch(err => {
          console.error("Error adding meeting link:", err);
          setLocalError("Failed to add meeting link. Please try again.");
        });
    }
  }

  const openLinkModal = (sessionId) => {
    setMeetingLinkData({
      sessionId,
      meetingLink: "",
    })
    setShowLinkModal(true)
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

  // Helper function to safely get student name
  const getStudentName = (session) => {
    try {
      if (!session) return "Student";
      
      // Debug output for testing
      if (process.env.NODE_ENV === 'development') {
        console.log("Session student data:", session.student);
      }
      
      if (session.student) {
        if (typeof session.student === 'object' && session.student.name) {
          return session.student.name;
        }
        if (typeof session.student === 'string') {
          return "Student";
        }
      }
      
      return "Student";
    } catch (err) {
      console.error("Error getting student name:", err);
      return "Student";
    }
  }

  // Helper function to check if chat link should be enabled
  const isChatLinkEnabled = (session) => {
    try {
      return session && session.student && 
             (typeof session.student === 'object' && session.student._id);
    } catch (err) {
      console.error("Error checking chat link:", err);
      return false;
    }
  }

  // Helper function to get student ID for chat link
  const getChatLinkId = (session) => {
    try {
      if (!session || !session.student) return "";
      
      if (typeof session.student === 'object' && session.student._id) {
        return session.student._id;
      }
      
      if (typeof session.student === 'string') {
        return session.student;
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
          <Link to="/tutor/search" className="btn btn-primary">
            Find Students
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
                  <strong>Student:</strong> {getStudentName(session)}
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
                {session.meetingLink && (
                  <p className="mb-1">
                    <strong>Meeting Link:</strong>{" "}
                    <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                      {session.meetingLink}
                    </a>
                  </p>
                )}
              </div>
              <div className="text-end">
                <div className="mb-2">{getStatusBadge(session.status)}</div>
                <div className="btn-group">
                  {session.status === "pending" && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusChange(session._id, "accepted")}
                        disabled={statusUpdating === session._id}
                      >
                        {statusUpdating === session._id ? "Accepting..." : "Accept"}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleStatusChange(session._id, "rejected")}
                        disabled={statusUpdating === session._id}
                      >
                        {statusUpdating === session._id ? "Rejecting..." : "Reject"}
                      </button>
                    </>
                  )}
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
                        <>
                          <Link to={`/video/${session._id}`} className="btn btn-success btn-sm">
                            Start Video
                          </Link>
                          <button className="btn btn-outline-primary btn-sm" onClick={() => openLinkModal(session._id)}>
                            Add Meeting Link
                          </button>
                        </>
                      )}
                      <Link 
                        to={isChatLinkEnabled(session) ? `/chat/${getChatLinkId(session)}` : "#"} 
                        className={`btn btn-primary btn-sm ${!isChatLinkEnabled(session) ? 'disabled' : ''}`}
                      >
                        Chat with {getStudentName(session)}
                      </Link>
                    </>
                  )}
                  {session.status === "accepted" && new Date(session.date) < new Date() && (
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => handleStatusChange(session._id, "completed")}
                      disabled={statusUpdating === session._id}
                    >
                      {statusUpdating === session._id ? "Marking..." : "Mark as Completed"}
                    </button>
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

      {/* Meeting Link Modal */}
      {showLinkModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Meeting Link</h5>
                <button type="button" className="btn-close" onClick={() => setShowLinkModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="meetingLink" className="form-label">
                    Meeting URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    id="meetingLink"
                    value={meetingLinkData.meetingLink}
                    onChange={(e) =>
                      setMeetingLinkData({
                        ...meetingLinkData,
                        meetingLink: e.target.value,
                      })
                    }
                    placeholder="https://zoom.us/j/123456789"
                  />
                  <div className="form-text">Enter a Zoom, Google Meet, or other video conferencing link.</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleAddMeetingLink}>
                  Save Link
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </div>
      )}
    </div>
  )
}

export default TutorMeetings