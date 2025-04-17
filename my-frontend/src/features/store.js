import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./auth/authSlice"
import courseReducer from "./courses/courseSlice"
import sessionReducer from "./sessions/sessionSlice"
import userReducer from "./users/userSlice"
import chatReducer from "./chat/chatSlice"
import adminReducer from "./admin/adminSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    sessions: sessionReducer,
    users: userReducer,
    chat: chatReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["chat/connectSocket/fulfilled"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload.socket", "meta.arg.socket"],
        // Ignore these paths in the state
        ignoredPaths: ["chat.socket"],
      },
    }),
})

