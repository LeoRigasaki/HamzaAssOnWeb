import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "../../config/api"
import { API_URLS } from "../../config/api"

// Register user
export const register = createAsyncThunk("auth/register", async (userData, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URLS.AUTH}/register`, userData)
    if (response.data) {
      localStorage.setItem("token", response.data.token)
      return response.data
    }
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Login user
export const login = createAsyncThunk("auth/login", async (userData, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URLS.AUTH}/login`, userData)
    if (response.data) {
      localStorage.setItem("token", response.data.token)
      return response.data
    }
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get current user
export const getCurrentUser = createAsyncThunk("auth/getCurrentUser", async (_, thunkAPI) => {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      return thunkAPI.rejectWithValue("No token found")
    }

    const response = await axios.get(`${API_URLS.AUTH}/me`)
    return response.data
  } catch (error) {
    // Remove token if auth fails
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
    }
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})
// Update password
export const updatePassword = createAsyncThunk("users/updatePassword", async (passwordData, thunkAPI) => {
  try {
    const response = await axios.put(`${API_URLS.AUTH}/updatepassword`, passwordData)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})
// Logout user
export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    await axios.get(`${API_URLS.AUTH}/logout`)
    localStorage.removeItem("token")
    return null
  } catch (error) {
    // Even if the logout API fails, we still want to remove the token
    localStorage.removeItem("token")
    return null
  }
})

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  initialized: false  // Add a new state to track initialization
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.initialized = true
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.user = null
        state.isAuthenticated = false
        state.token = null
        state.initialized = true
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.initialized = true
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.user = null
        state.isAuthenticated = false
        state.token = null
        state.initialized = true
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.data
        state.initialized = true
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.user = null
        state.isAuthenticated = false
        state.token = null
        state.initialized = true
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.initialized = true
      })
  },
})

export const { reset } = authSlice.actions
export default authSlice.reducer