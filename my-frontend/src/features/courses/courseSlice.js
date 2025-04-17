import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "../../config/api"
import { API_URLS } from "../../config/api"

// Get all courses
export const getCourses = createAsyncThunk("courses/getCourses", async (_, thunkAPI) => {
  
  try {
    const response = await axios.get(API_URLS.COURSES)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get single course
export const getCourse = createAsyncThunk("courses/getCourse", async (id, thunkAPI) => {
  
  const state = thunkAPI.getState();
    
    // Only fetch if we don't already have data or force refresh is requested
    if (state.courses.course.length > 0 && !_.forceRefresh) {
      return { data: state.courses.course };
    }
  try {
    const response = await axios.get(`${API_URLS.COURSES}/${id}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Create new course
export const createCourse = createAsyncThunk("courses/createCourse", async (courseData, thunkAPI) => {
  try {
    const response = await axios.post(API_URLS.COURSES, courseData)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Update course
export const updateCourse = createAsyncThunk("courses/updateCourse", async ({ id, courseData }, thunkAPI) => {
  try {
    const response = await axios.put(`${API_URLS.COURSES}/${id}`, courseData)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Delete course
export const deleteCourse = createAsyncThunk("courses/deleteCourse", async (id, thunkAPI) => {
  try {
    await axios.delete(`${API_URLS.COURSES}/${id}`)
    return id
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Enroll in course
export const enrollCourse = createAsyncThunk("courses/enrollCourse", async (id, thunkAPI) => {
  try {
    const response = await axios.put(`${API_URLS.COURSES}/${id}/enroll`, {})
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get tutor courses
export const getTutorCourses = createAsyncThunk("courses/getTutorCourses", async (_, thunkAPI) => {
  
  const state = thunkAPI.getState();
    
    // Only fetch if we don't already have data or force refresh is requested
    if (state.courses.tutorCourses.length > 0 && !_.forceRefresh) {
      return { data: state.courses.tutorCourses };
    }

  try {
    const response = await axios.get(`${API_URLS.COURSES}/tutor/mycourses`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get student enrolled courses
export const getStudentCourses = createAsyncThunk("courses/getStudentCourses", async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URLS.COURSES}/student/enrolled`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

const initialState = {
  courses: [],
  course: null,
  tutorCourses: [],
  studentCourses: [],
  isLoading: false,
  error: null,
  success: false,
}

const courseSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.error = null
      state.success = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all courses
      .addCase(getCourses.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCourses.fulfilled, (state, action) => {
        state.isLoading = false
        state.courses = action.payload.data
      })
      .addCase(getCourses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Get single course
      .addCase(getCourse.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCourse.fulfilled, (state, action) => {
        state.isLoading = false
        state.course = action.payload.data
      })
      .addCase(getCourse.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Create course
      .addCase(createCourse.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
        state.courses.push(action.payload.data)
        state.tutorCourses.push(action.payload.data)
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Update course
      .addCase(updateCourse.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
        state.courses = state.courses.map((course) =>
          course._id === action.payload.data._id ? action.payload.data : course,
        )
        state.tutorCourses = state.tutorCourses.map((course) =>
          course._id === action.payload.data._id ? action.payload.data : course,
        )
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Delete course
      .addCase(deleteCourse.pending, (state) => {
        state.isLoading = true
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
        state.courses = state.courses.filter((course) => course._id !== action.payload)
        state.tutorCourses = state.tutorCourses.filter((course) => course._id !== action.payload)
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Enroll in course
      .addCase(enrollCourse.pending, (state) => {
        state.isLoading = true
      })
      .addCase(enrollCourse.fulfilled, (state, action) => {
        state.isLoading = false
        state.success = true
        state.studentCourses.push(action.payload.data)
        state.courses = state.courses.map((course) =>
          course._id === action.payload.data._id ? action.payload.data : course,
        )
      })
      .addCase(enrollCourse.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Get tutor courses
      .addCase(getTutorCourses.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getTutorCourses.fulfilled, (state, action) => {
        state.isLoading = false
        state.tutorCourses = action.payload.data
      })
      .addCase(getTutorCourses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Get student courses
      .addCase(getStudentCourses.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getStudentCourses.fulfilled, (state, action) => {
        state.isLoading = false
        state.studentCourses = action.payload.data
      })
      .addCase(getStudentCourses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { reset } = courseSlice.actions
export default courseSlice.reducer

