"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import {
  getAdminStats,
  getAllUsers,
  getAllSessions,
  getAllCourses,
  updateUserStatus,
} from "../../features/admin/adminSlice"
import { Bar, Pie, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js"
import ErrorAlert from "../../components/common/ErrorAlert"
import LoadingSpinner from "../../components/common/LoadingSpinner"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

const AdminDashboard = () => {
  const dispatch = useDispatch()
  const { stats, users, sessions, courses, isLoading, error } = useSelector((state) => state.admin)

  const [activeTab, setActiveTab] = useState("dashboard")
  const [userFilter, setUserFilter] = useState("all")
  const [sessionFilter, setSessionFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    dispatch(getAdminStats())
  }, [dispatch])

  useEffect(() => {
    if (activeTab === "users") {
      dispatch(getAllUsers({ role: userFilter !== "all" ? userFilter : null }))
    } else if (activeTab === "sessions") {
      dispatch(getAllSessions({ status: sessionFilter !== "all" ? sessionFilter : null }))
    } else if (activeTab === "courses") {
      dispatch(getAllCourses({ status: courseFilter !== "all" ? courseFilter : null }))
    }
  }, [dispatch, activeTab, userFilter, sessionFilter, courseFilter])

  const handleUserStatusChange = (userId, status) => {
    dispatch(updateUserStatus({ userId, status })).then(() =>
      dispatch(getAllUsers({ role: userFilter !== "all" ? userFilter : null })),
    )
  }

  const openUserModal = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const closeUserModal = () => {
    setSelectedUser(null)
    setShowUserModal(false)
  }

  // Filter data based on search term
  const filteredUsers =
    users?.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  const filteredSessions =
    sessions?.filter(
      (session) =>
        session.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.tutor?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  const filteredCourses =
    courses?.filter(
      (course) =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.tutor?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage

  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
  const currentSessions = filteredSessions.slice(indexOfFirstItem, indexOfLastItem)
  const currentCourses = filteredCourses.slice(indexOfFirstItem, indexOfLastItem)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Chart data for dashboard
  const userChartData = {
    labels: ["Students", "Tutors", "Admins"],
    datasets: [
      {
        label: "Users by Role",
        data: [
          stats?.users?.students || 0,
          stats?.users?.tutors || 0,
          stats?.users?.total - (stats?.users?.students || 0) - (stats?.users?.tutors || 0) || 0,
        ],
        backgroundColor: ["rgba(54, 162, 235, 0.7)", "rgba(255, 99, 132, 0.7)", "rgba(255, 206, 86, 0.7)"],
        borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 99, 132, 1)", "rgba(255, 206, 86, 1)"],
        borderWidth: 1,
      },
    ],
  }

  const sessionChartData = {
    labels: ["Pending", "Accepted", "Completed", "Cancelled"],
    datasets: [
      {
        label: "Sessions by Status",
        data: [
          stats?.sessions?.pending || 0,
          stats?.sessions?.accepted || 0,
          stats?.sessions?.completed || 0,
          stats?.sessions?.total -
            (stats?.sessions?.pending || 0) -
            (stats?.sessions?.accepted || 0) -
            (stats?.sessions?.completed || 0) || 0,
        ],
        backgroundColor: [
          "rgba(255, 206, 86, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(255, 99, 132, 0.7)",
        ],
        borderColor: [
          "rgba(255, 206, 86, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  const popularSubjectsData = {
    labels: stats?.popularSubjects?.map((subject) => subject._id) || [],
    datasets: [
      {
        label: "Sessions per Subject",
        data: stats?.popularSubjects?.map((subject) => subject.count) || [],
        backgroundColor: "rgba(75, 192, 192, 0.7)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  }

  const growthData = {
    labels: ["Last Week", "2 Weeks Ago", "3 Weeks Ago", "4 Weeks Ago"],
    datasets: [
      {
        label: "New Users",
        data: [
          stats?.users?.newLast30Days / 4 || 0,
          stats?.users?.newLast30Days / 4 || 0,
          stats?.users?.newLast30Days / 4 || 0,
          stats?.users?.newLast30Days / 4 || 0,
        ],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        yAxisID: "y",
      },
      {
        label: "New Sessions",
        data: [
          stats?.sessions?.newLast30Days / 4 || 0,
          stats?.sessions?.newLast30Days / 4 || 0,
          stats?.sessions?.newLast30Days / 4 || 0,
          stats?.sessions?.newLast30Days / 4 || 0,
        ],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        yAxisID: "y1",
      },
    ],
  }

  const renderDashboard = () => (
    <div className="dashboard-content">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card h-100 bg-primary text-white shadow">
                <div className="card-body">
                  <h5 className="card-title">Total Users</h5>
                  <h2 className="display-4">{stats?.users?.total || 0}</h2>
                  <p className="card-text">New this month: +{stats?.users?.newLast30Days || 0}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 bg-success text-white shadow">
                <div className="card-body">
                  <h5 className="card-title">Total Sessions</h5>
                  <h2 className="display-4">{stats?.sessions?.total || 0}</h2>
                  <p className="card-text">Completed: {stats?.sessions?.completed || 0}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 bg-info text-white shadow">
                <div className="card-body">
                  <h5 className="card-title">Total Messages</h5>
                  <h2 className="display-4">{stats?.messages?.total || 0}</h2>
                  <p className="card-text">Active conversations</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 bg-warning text-white shadow">
                <div className="card-body">
                  <h5 className="card-title">Average Rating</h5>
                  <h2 className="display-4">
                    {stats?.reviews?.averageRating?.toFixed(1) || "N/A"}
                    <small className="fs-6"> / 5</small>
                  </h2>
                  <p className="card-text">From {stats?.reviews?.total || 0} reviews</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-8">
              <div className="card shadow">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Platform Growth</h5>
                </div>
                <div className="card-body">
                  <Line
                    data={growthData}
                    options={{
                      responsive: true,
                      interaction: {
                        mode: "index",
                        intersect: false,
                      },
                      stacked: false,
                      scales: {
                        y: {
                          type: "linear",
                          display: true,
                          position: "left",
                          title: {
                            display: true,
                            text: "Users",
                          },
                        },
                        y1: {
                          type: "linear",
                          display: true,
                          position: "right",
                          grid: {
                            drawOnChartArea: false,
                          },
                          title: {
                            display: true,
                            text: "Sessions",
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow">
                <div className="card-header bg-white">
                  <h5 className="mb-0">User Distribution</h5>
                </div>
                <div className="card-body">
                  <Pie data={userChartData} />
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card shadow">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Session Status</h5>
                </div>
                <div className="card-body">
                  <Pie data={sessionChartData} />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card shadow">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Most Popular Subjects</h5>
                </div>
                <div className="card-body">
                  <Bar
                    data={popularSubjectsData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        title: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Recent Activity</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Details</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions?.slice(0, 5).map((session, index) => (
                          <tr key={index}>
                            <td>Session</td>
                            <td>
                              {session.subject} - {session.student?.name} with {session.tutor?.name}
                            </td>
                            <td>{new Date(session.date).toLocaleDateString()}</td>
                            <td>
                              <span
                                className={`badge ${
                                  session.status === "completed"
                                    ? "bg-success"
                                    : session.status === "pending"
                                      ? "bg-warning"
                                      : session.status === "cancelled"
                                        ? "bg-danger"
                                        : "bg-info"
                                }`}
                              >
                                {session.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderUserManagement = () => (
    <div className="user-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">User Management</h4>
        <div className="d-flex gap-2">
          <div className="btn-group">
            <button
              className={`btn ${userFilter === "all" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setUserFilter("all")
                setCurrentPage(1)
              }}
            >
              All
            </button>
            <button
              className={`btn ${userFilter === "student" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setUserFilter("student")
                setCurrentPage(1)
              }}
            >
              Students
            </button>
            <button
              className={`btn ${userFilter === "tutor" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setUserFilter("tutor")
                setCurrentPage(1)
              }}
            >
              Tutors
            </button>
            <button
              className={`btn ${userFilter === "admin" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setUserFilter("admin")
                setCurrentPage(1)
              }}
            >
              Admins
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow">
        <div className="card-body">
          <div className="input-group mb-3">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  setCurrentPage(1)
                }}
              >
                Clear
              </button>
            )}
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Country</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span
                              className={`badge ${
                                user.role === "student"
                                  ? "bg-primary"
                                  : user.role === "tutor"
                                    ? "bg-success"
                                    : "bg-warning"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td>{user.country}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={user.isActive}
                                onChange={() => handleUserStatusChange(user._id, !user.isActive)}
                              />
                              <label className="form-check-label">{user.isActive ? "Active" : "Inactive"}</label>
                            </div>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="btn-group">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => openUserModal(user)}>
                                View
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this user?")) {
                                    // Add delete functionality
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          {searchTerm ? "No users found matching your search" : "No users found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredUsers.length > itemsPerPage && (
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: Math.ceil(filteredUsers.length / itemsPerPage) }, (_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => paginate(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${currentPage === Math.ceil(filteredUsers.length / itemsPerPage) ? "disabled" : ""}`}
                    >
                      <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  const renderSessionManagement = () => (
    <div className="session-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Session Management</h4>
        <div className="d-flex gap-2">
          <div className="btn-group">
            <button
              className={`btn ${sessionFilter === "all" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setSessionFilter("all")
                setCurrentPage(1)
              }}
            >
              All
            </button>
            <button
              className={`btn ${sessionFilter === "pending" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setSessionFilter("pending")
                setCurrentPage(1)
              }}
            >
              Pending
            </button>
            <button
              className={`btn ${sessionFilter === "accepted" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setSessionFilter("accepted")
                setCurrentPage(1)
              }}
            >
              Accepted
            </button>
            <button
              className={`btn ${sessionFilter === "completed" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setSessionFilter("completed")
                setCurrentPage(1)
              }}
            >
              Completed
            </button>
            <button
              className={`btn ${sessionFilter === "cancelled" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setSessionFilter("cancelled")
                setCurrentPage(1)
              }}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow">
        <div className="card-body">
          <div className="input-group mb-3">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by subject, student or tutor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  setCurrentPage(1)
                }}
              >
                Clear
              </button>
            )}
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Student</th>
                      <th>Tutor</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSessions.length > 0 ? (
                      currentSessions.map((session) => (
                        <tr key={session._id}>
                          <td>{session.subject}</td>
                          <td>{session.student?.name || "Unknown"}</td>
                          <td>{session.tutor?.name || "Unknown"}</td>
                          <td>{new Date(session.date).toLocaleDateString()}</td>
                          <td>
                            {session.startTime} - {session.endTime}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                session.status === "completed"
                                  ? "bg-success"
                                  : session.status === "pending"
                                    ? "bg-warning"
                                    : session.status === "accepted"
                                      ? "bg-info"
                                      : "bg-danger"
                              }`}
                            >
                              {session.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button className="btn btn-sm btn-outline-primary">View</button>
                              <button className="btn btn-sm btn-outline-danger">Cancel</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          {searchTerm ? "No sessions found matching your search" : "No sessions found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredSessions.length > itemsPerPage && (
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: Math.ceil(filteredSessions.length / itemsPerPage) }, (_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => paginate(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${currentPage === Math.ceil(filteredSessions.length / itemsPerPage) ? "disabled" : ""}`}
                    >
                      <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  const renderCourseManagement = () => (
    <div className="course-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Course Management</h4>
        <div className="d-flex gap-2">
          <div className="btn-group">
            <button
              className={`btn ${courseFilter === "all" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setCourseFilter("all")
                setCurrentPage(1)
              }}
            >
              All
            </button>
            <button
              className={`btn ${courseFilter === "active" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setCourseFilter("active")
                setCurrentPage(1)
              }}
            >
              Active
            </button>
            <button
              className={`btn ${courseFilter === "inactive" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setCourseFilter("inactive")
                setCurrentPage(1)
              }}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow">
        <div className="card-body">
          <div className="input-group mb-3">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title, subject or tutor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  setCurrentPage(1)
                }}
              >
                Clear
              </button>
            )}
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Tutor</th>
                      <th>Enrollment</th>
                      <th>Start Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCourses.length > 0 ? (
                      currentCourses.map((course) => (
                        <tr key={course._id}>
                          <td>{course.title}</td>
                          <td>{course.subject}</td>
                          <td>{course.tutor?.name || "Unknown"}</td>
                          <td>
                            {course.enrolledStudents?.length || 0}/{course.maxStudents}
                            <div className="progress" style={{ height: "6px" }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${((course.enrolledStudents?.length || 0) / course.maxStudents) * 100}%`,
                                }}
                                aria-valuenow={course.enrolledStudents?.length || 0}
                                aria-valuemin="0"
                                aria-valuemax={course.maxStudents}
                              ></div>
                            </div>
                          </td>
                          <td>{new Date(course.startDate).toLocaleDateString()}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={course.isActive}
                                onChange={() => {
                                  // Add toggleActive functionality
                                }}
                              />
                              <label className="form-check-label">{course.isActive ? "Active" : "Inactive"}</label>
                            </div>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button className="btn btn-sm btn-outline-primary">View</button>
                              <button className="btn btn-sm btn-outline-danger">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          {searchTerm ? "No courses found matching your search" : "No courses found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredCourses.length > itemsPerPage && (
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: Math.ceil(filteredCourses.length / itemsPerPage) }, (_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => paginate(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${currentPage === Math.ceil(filteredCourses.length / itemsPerPage) ? "disabled" : ""}`}
                    >
                      <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="admin-dashboard container-fluid py-4">
      <div className="row">
        <div className="col-12 mb-4">
          <div className="d-sm-flex align-items-center justify-content-between">
            <h1 className="h3 mb-0 text-gray-800">Admin Dashboard</h1>
            <div>
              <button className="btn btn-sm btn-outline-primary">
                <i className="bi bi-download me-1"></i> Export Data
              </button>
              <button className="btn btn-sm btn-outline-secondary ms-2">
                <i className="bi bi-gear me-1"></i> Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorAlert error={error} />}

      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <i className="bi bi-speedometer2 me-1"></i> Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "users" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("users")
                  setCurrentPage(1)
                }}
              >
                <i className="bi bi-people me-1"></i> Users
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "sessions" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("sessions")
                  setCurrentPage(1)
                }}
              >
                <i className="bi bi-calendar-check me-1"></i> Sessions
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "courses" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("courses")
                  setCurrentPage(1)
                }}
              >
                <i className="bi bi-book me-1"></i> Courses
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "users" && renderUserManagement()}
        {activeTab === "sessions" && renderSessionManagement()}
        {activeTab === "courses" && renderCourseManagement()}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Details</h5>
                <button type="button" className="btn-close" onClick={closeUserModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p>
                      <strong>Name:</strong> {selectedUser.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedUser.email}
                    </p>
                    <p>
                      <strong>Role:</strong> {selectedUser.role}
                    </p>
                    <p>
                      <strong>Country:</strong> {selectedUser.country}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedUser.isActive ? "Active" : "Inactive"}
                    </p>
                    <p>
                      <strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="col-md-6">
                    {selectedUser.role === "student" && (
                      <>
                        <h6>Learning Goals:</h6>
                        <ul>
                          {selectedUser.learningGoals?.map((goal, index) => <li key={index}>{goal}</li>) || (
                            <li>No learning goals specified</li>
                          )}
                        </ul>

                        <h6>Preferred Subjects:</h6>
                        <div>
                          {selectedUser.preferredSubjects?.map((subject, index) => (
                            <span key={index} className="badge bg-info me-1 mb-1">
                              {subject}
                            </span>
                          )) || <span>No preferred subjects specified</span>}
                        </div>
                      </>
                    )}

                    {selectedUser.role === "tutor" && (
                      <>
                        <h6>Expertise:</h6>
                        <div className="mb-2">
                          {selectedUser.expertise?.map((exp, index) => (
                            <span key={index} className="badge bg-success me-1 mb-1">
                              {exp}
                            </span>
                          )) || <span>No expertise specified</span>}
                        </div>

                        <p>
                          <strong>Hourly Rate:</strong> ${selectedUser.hourlyRate || 0}/hour
                        </p>
                        <p>
                          <strong>Experience:</strong> {selectedUser.experience || 0} years
                        </p>
                        <p>
                          <strong>Education:</strong> {selectedUser.education || "Not specified"}
                        </p>
                        <p>
                          <strong>Rating:</strong> {selectedUser.averageRating?.toFixed(1) || "N/A"}/5 (
                          {selectedUser.totalReviews || 0} reviews)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <hr />

                <h6>Bio:</h6>
                <p>{selectedUser.bio || "No bio provided"}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeUserModal}>
                  Close
                </button>
                <button type="button" className="btn btn-primary">
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

