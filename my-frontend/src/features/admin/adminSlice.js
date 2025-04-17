import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "../../config/api"
import { API_URLS } from "../../config/api"

// Get admin dashboard statistics
export const getAdminStats = createAsyncThunk("admin/getAdminStats", async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URLS.ADMIN}/stats`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get all users with optional filters
export const getAllUsers = createAsyncThunk("admin/getAllUsers", async (filters = {}, thunkAPI) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.role) queryParams.append("role", filters.role)
    if (filters.page) queryParams.append("page", filters.page)
    if (filters.limit) queryParams.append("limit", filters.limit)

    const response = await axios.get(`${API_URLS.ADMIN}/users?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get specific user details
export const getUserDetails = createAsyncThunk("admin/getUserDetails", async (userId, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URLS.ADMIN}/users/${userId}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Update user
export const updateUserStatus = createAsyncThunk("admin/updateUserStatus", async ({ userId, status }, thunkAPI) => {
  try {
    const response = await axios.put(`${API_URLS.ADMIN}/users/${userId}`, { isActive: status })
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Delete user
export const deleteUser = createAsyncThunk("admin/deleteUser", async (userId, thunkAPI) => {
  try {
    await axios.delete(`${API_URLS.ADMIN}/users/${userId}`)
    return userId
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get all sessions with optional filters
export const getAllSessions = createAsyncThunk("admin/getAllSessions", async (filters = {}, thunkAPI) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.status) queryParams.append("status", filters.status)
    if (filters.page) queryParams.append("page", filters.page)
    if (filters.limit) queryParams.append("limit", filters.limit)

    const response = await axios.get(`${API_URLS.ADMIN}/sessions?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get all courses with optional filters
export const getAllCourses = createAsyncThunk("admin/getAllCourses", async (filters = {}, thunkAPI) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.status === "active") queryParams.append("isActive", true)
    if (filters.status === "inactive") queryParams.append("isActive", false)
    if (filters.page) queryParams.append("page", filters.page)
    if (filters.limit) queryParams.append("limit", filters.limit)

    const response = await axios.get(`${API_URLS.COURSES}?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

const initialState = {
  stats: null,
  users: [],
  userDetails: null,
  sessions: [],
  courses: [],
  isLoading: false,
  error: null,
  success: false,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
}

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    resetAdminState: (state) => {
      state.isLoading = false
      state.error = null
      state.success = false
    },
    clearUserDetails: (state) => {
      state.userDetails = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Get admin stats
      .addCase(getAdminStats.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getAdminStats.fulfilled, (state, action) => {
        state.isLoading = false
        state.stats = action.payload.data
      })
      .addCase(getAdminStats.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Get all users
      .addCase(getAllUsers.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.isLoading = false
        state.users = action.payload.data
        state.pagination = {
          currentPage: action.payload.pagination?.current || 1,
          totalPages: action.payload.pagination?.pages || 1,
          totalItems: action.payload.total || action.payload.data.length,
          itemsPerPage: action.payload.pagination?.limit || 10,
        }
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Get user details
      .addCase(getUserDetails.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.isLoading = false
        state.userDetails = action.payload.data
      })
      .addCase(getUserDetails.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Update user
      .addCase(updateUserStatus.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
        state.users = state.users.map((user) => (user._id === action.payload.data._id ? action.payload.data : user))
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
        state.users = state.users.filter((user) => user._id !== action.payload)
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Get all sessions
      .addCase(getAllSessions.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getAllSessions.fulfilled, (state, action) => {
        state.isLoading = false
        state.sessions = action.payload.data
        state.pagination = {
          currentPage: action.payload.pagination?.current || 1,
          totalPages: action.payload.pagination?.pages || 1,
          totalItems: action.payload.total || action.payload.data.length,
          itemsPerPage: action.payload.pagination?.limit || 10,
        }
      })
      .addCase(getAllSessions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Get all courses
      .addCase(getAllCourses.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getAllCourses.fulfilled, (state, action) => {
        state.isLoading = false
        state.courses = action.payload.data
        state.pagination = {
          currentPage: action.payload.pagination?.current || 1,
          totalPages: action.payload.pagination?.pages || 1,
          totalItems: action.payload.total || action.payload.data.length,
          itemsPerPage: action.payload.pagination?.limit || 10,
        }
      })
      .addCase(getAllCourses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { resetAdminState, clearUserDetails } = adminSlice.actions
export default adminSlice.reducer

