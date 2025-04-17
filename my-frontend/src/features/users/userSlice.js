import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "../../config/api"
import { API_URLS } from "../../config/api"

// Search tutors
export const searchTutors = createAsyncThunk("users/searchTutors", async (searchParams, thunkAPI) => {
  try {
    const queryString = new URLSearchParams(searchParams).toString()
    const response = await axios.get(`${API_URLS.USERS}/tutors/search?${queryString}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get tutor profile
export const getTutorProfile = createAsyncThunk("users/getTutorProfile", async (id, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URLS.USERS}/tutors/${id}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

export const getStudentProfile = createAsyncThunk("users/getStudentProfile", async (id, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URLS.USERS}/students/${id}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

export const searchStudents = createAsyncThunk("users/searchStudents", async (searchParams, thunkAPI) => {
  try {
    const queryString = new URLSearchParams(searchParams).toString()
    const response = await axios.get(`${API_URLS.USERS}/students/search?${queryString}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Update profile
export const updateProfile = createAsyncThunk("users/updateProfile", async (profileData, thunkAPI) => {
  try {
    const response = await axios.put(`${API_URLS.USERS}/profile`, profileData)
    return response.data
  } catch (error) {
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

// Update tutor availability
export const updateTutorAvailability = createAsyncThunk(
  "users/updateTutorAvailability",
  async (availability, thunkAPI) => {
    try {
      const response = await axios.put(`${API_URLS.USERS}/tutors/availability`, { availability })
      return response.data
    } catch (error) {
      const message = error.response?.data?.error || error.message || "Something went wrong"
      return thunkAPI.rejectWithValue(message)
    }
  },
)

// Update student learning goals
export const updateLearningGoals = createAsyncThunk("users/updateLearningGoals", async (data, thunkAPI) => {
  try {
    const response = await axios.put(`${API_URLS.USERS}/students/learning-goals`, data)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

const initialState = {
  tutors: [],
  students: [], // Initialize students as an empty array
  currentTutor: null,
  currentStudent: null,
  isLoading: false,
  error: null,
  success: false,
  passwordUpdateSuccess: false,
}

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.error = null
      state.success = false
      state.passwordUpdateSuccess = false
    },
    clearSuccess: (state) => {
      state.success = false
      state.passwordUpdateSuccess = false
    }
  },
  extraReducers: (builder) => {
    builder
      // Search tutors
      .addCase(searchTutors.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(searchTutors.fulfilled, (state, action) => {
        state.isLoading = false
        state.tutors = action.payload.data || []
      })
      .addCase(searchTutors.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.tutors = [] // Reset to empty array on error
      })
      
      // Search students
      .addCase(searchStudents.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(searchStudents.fulfilled, (state, action) => {
        state.isLoading = false
        state.students = action.payload?.data || [] // Handle case when data might be undefined
      })
      .addCase(searchStudents.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.students = [] // Reset to empty array on error
      })
      
      // Get tutor profile
      .addCase(getTutorProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getTutorProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentTutor = action.payload.data
      })
      .addCase(getTutorProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Get student profile
      .addCase(getStudentProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getStudentProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentStudent = action.payload.data
      })
      .addCase(getStudentProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.success = false
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.success = false
      })
      
      // Update password
      .addCase(updatePassword.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.passwordUpdateSuccess = false
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.isLoading = false
        state.passwordUpdateSuccess = true
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.passwordUpdateSuccess = false
      })
      
      // Update tutor availability
      .addCase(updateTutorAvailability.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.success = false
      })
      .addCase(updateTutorAvailability.fulfilled, (state) => {
        state.isLoading = false
        state.success = true
      })
      .addCase(updateTutorAvailability.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.success = false
      })
      
      // Update student learning goals
      .addCase(updateLearningGoals.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.success = false
      })
      .addCase(updateLearningGoals.fulfilled, (state) => {
        state.isLoading = false
        state.success = true
      })
      .addCase(updateLearningGoals.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.success = false
      })
  },
})

export const { reset, clearSuccess } = userSlice.actions
export default userSlice.reducer