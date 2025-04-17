"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import {
  getUpcomingSessions,
  getSessionHistory,
  updateSessionStatus,
  addMeetingLink,
} from "../../features/sessions/sessionSlice"

const TutorMeetings = () => {
  const dispatch = useDispatch()
  const { sessions, upcomingSessions, sessionHistory, isLoading, error } = useSelector((state) => state.sessions)

  const [activeTab, setActiveTab] = useState("upcoming")
  const [statusUpdating, setStatusUpdating] = useState(null)
  const [meetingLinkData, setMeetingLinkData] = useState({
    sessionId: null,
    meetingLink: "",
  })
  const [showLinkModal, setShowLinkModal] = useState(false)

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

  const handleAddMeetingLink = () => {
    if (meetingLinkData.meetingLink.trim()) {
      dispatch(
        addMeetingLink({
          id: meetingLinkData.sessionId,
          meetingLink: meetingLinkData.meetingLink,
        }),
      ).then(() => {
        setShowLinkModal(false)
        setMeetingLinkData({
          sessionId: null,
          meetingLink: "",
        })
        // Refresh the sessions
        dispatch(getUpcomingSessions())
      })
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
                <h5 className="mb-1">{session.subject}</h5>
                <p className="mb-1">
                  <strong>Student:</strong> {session.student.name}
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
                        <>
                          <Link to={`/video/${session._id}`} className="btn btn-success btn-sm">
                            Start Video
                          </Link>
                          <button className="btn btn-outline-primary btn-sm" onClick={() => openLinkModal(session._id)}>
                            Add Meeting Link
                          </button>
                        </>
                      )}
                      <Link to={`/chat/${session.student._id}`} className="btn btn-primary btn-sm">
                        Chat with {session.student.name}
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

