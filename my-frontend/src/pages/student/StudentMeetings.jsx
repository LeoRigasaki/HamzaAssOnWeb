"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { getUpcomingSessions, getSessionHistory, updateSessionStatus } from "../../features/sessions/sessionSlice"

const StudentMeetings = () => {
  const dispatch = useDispatch()
  const { sessions, upcomingSessions, sessionHistory, isLoading, error } = useSelector((state) => state.sessions)

  const [activeTab, setActiveTab] = useState("upcoming")
  const [statusUpdating, setStatusUpdating] = useState(null)

  useEffect(() => {
    dispatch(getUpcomingSessions())
    dispatch(getSessionHistory())
  }, [dispatch])

  const handleStatusChange = (sessionId, status) => {
    setStatusUpdating(sessionId)
    dispatch(updateSessionStatus({ id: sessionId, status })).then(() => {
      setStatusUpdating(null)
      // Refresh the sessions
      dispatch(getUpcomingSessions())
      dispatch(getSessionHistory())
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
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

  const renderSessionList = (sessionList) => {
    if (isLoading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )
    }

    if (sessionList.length === 0) {
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
                <h5 className="mb-1">{session.subject}</h5>
                <p className="mb-1">
                  <strong>Tutor:</strong> {session.tutor.name}
                </p>
                <p className="mb-1">
                  <strong>Date:</strong> {formatDate(session.date)}
                </p>
                <p className="mb-1">
                  <strong>Time:</strong> {session.startTime} - {session.endTime}
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
                {/* {session.status === "accepted" && (
  <div className="btn-group">
    <Link to={`/chat/${session.tutor._id}`} className="btn btn-primary btn-sm">
      <i className="bi bi-chat-dots me-1"></i> Start Chat
    </Link>
    <Link to={`/video/${session._id}`} className="btn btn-success btn-sm">
      <i className="bi bi-camera-video me-1"></i> Start Video
    </Link>
  </div>
)} */}
                  {session.status === "accepted" 
                  // && new Date(session.date) >= new Date() 
                  && (
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
                          Start Video with {session.tutor.name}
                        </Link>
                      )}
                      <Link to={`/chat/${session.tutor._id}`} className="btn btn-primary btn-sm">
                        Chat with {session.tutor.name}  
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
      <h2 className="mb-4">My Sessions</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
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

