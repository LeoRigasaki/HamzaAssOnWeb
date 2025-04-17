import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

const API_URL = "http://localhost:5000/api/v1/sessions"

// Get all sessions
export const getSessions = createAsyncThunk("sessions/getSessions", async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const response = await axios.get(API_URL, config)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get upcoming sessions
export const getUpcomingSessions = createAsyncThunk("sessions/getUpcomingSessions", async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const response = await axios.get(`${API_URL}/upcoming`, config)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get session history
export const getSessionHistory = createAsyncThunk("sessions/getSessionHistory", async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const response = await axios.get(`${API_URL}/history`, config)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get single session
export const getSession = createAsyncThunk("sessions/getSession", async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const response = await axios.get(`${API_URL}/${id}`, config)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Create new session
export const createSession = createAsyncThunk("sessions/createSession", async (sessionData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const response = await axios.post(API_URL, sessionData, config)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Update session status
export const updateSessionStatus = createAsyncThunk(
  "sessions/updateSessionStatus",
  async ({ id, status }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      const response = await axios.put(`${API_URL}/${id}`, { status }, config)
      return response.data
    } catch (error) {
      const message = error.response?.data?.error || error.message || "Something went wrong"
      return thunkAPI.rejectWithValue(message)
    }
  },
)

// Add meeting link
export const addMeetingLink = createAsyncThunk("sessions/addMeetingLink", async ({ id, meetingLink }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const response = await axios.put(`${API_URL}/${id}/meeting-link`, { meetingLink }, config)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

const initialState = {
  sessions: [],
  upcomingSessions: [],
  sessionHistory: [],
  currentSession: null,
  isLoading: false,
  error: null,
  success: false,
}

const sessionSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.error = null
      state.success = false
    },
    clearCurrentSession: (state) => {
      state.currentSession = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all sessions
      .addCase(getSessions.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getSessions.fulfilled, (state, action) => {
        state.isLoading = false
        state.sessions = action.payload.data
      })
      .addCase(getSessions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Get upcoming sessions
      .addCase(getUpcomingSessions.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getUpcomingSessions.fulfilled, (state, action) => {
        state.isLoading = false
        state.upcomingSessions = action.payload.data
      })
      .addCase(getUpcomingSessions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Get session history
      .addCase(getSessionHistory.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getSessionHistory.fulfilled, (state, action) => {
        state.isLoading = false
        state.sessionHistory = action.payload.data
      })
      .addCase(getSessionHistory.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Get single session
      .addCase(getSession.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getSession.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentSession = action.payload.data
      })
      .addCase(getSession.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Create session
      .addCase(createSession.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
        state.sessions.push(action.payload.data)
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Update session status
      .addCase(updateSessionStatus.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateSessionStatus.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true

        const updatedSession = action.payload.data

        // Update in all session lists
        state.sessions = state.sessions.map((session) =>
          session._id === updatedSession._id ? updatedSession : session,
        )

        state.upcomingSessions = state.upcomingSessions.map((session) =>
          session._id === updatedSession._id ? updatedSession : session,
        )

        state.sessionHistory = state.sessionHistory.map((session) =>
          session._id === updatedSession._id ? updatedSession : session,
        )

        if (state.currentSession && state.currentSession._id === updatedSession._id) {
          state.currentSession = updatedSession
        }
      })
      .addCase(updateSessionStatus.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Add meeting link
      .addCase(addMeetingLink.pending, (state) => {
        state.isLoading = true
      })
      .addCase(addMeetingLink.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true

        const updatedSession = action.payload.data

        // Update in all session lists
        state.sessions = state.sessions.map((session) =>
          session._id === updatedSession._id ? updatedSession : session,
        )

        state.upcomingSessions = state.upcomingSessions.map((session) =>
          session._id === updatedSession._id ? updatedSession : session,
        )

        if (state.currentSession && state.currentSession._id === updatedSession._id) {
          state.currentSession = updatedSession
        }
      })
      .addCase(addMeetingLink.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { reset, clearCurrentSession } = sessionSlice.actions
export default sessionSlice.reducer

