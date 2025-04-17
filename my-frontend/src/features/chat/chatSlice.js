import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "../../config/api"
import { API_URLS, SOCKET_URL } from "../../config/api"
import io from "socket.io-client"

const API_URL = "http://localhost:5000/api/v1/messages" // This line is replaced by the config import
let socket

// Connect to socket
export const connectSocket = createAsyncThunk("chat/connectSocket", async (_, thunkAPI) => {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      return thunkAPI.rejectWithValue("No token found")
    }

    // Create socket connection with auth token
    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    return socket
  } catch (error) {
    const message = error.message || "Failed to connect to socket"
    return thunkAPI.rejectWithValue(message)
  }
})

// Disconnect socket
export const disconnectSocket = createAsyncThunk("chat/disconnectSocket", async (_, thunkAPI) => {
  try {
    if (socket) {
      socket.disconnect()
    }
    return true
  } catch (error) {
    const message = error.message || "Failed to disconnect socket"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get user conversations
export const getConversations = createAsyncThunk("chat/getConversations", async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const response = await axios.get(`${API_URL}/conversations`, config)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get messages between users
export const getMessages = createAsyncThunk("chat/getMessages", async (userId, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URLS.MESSAGES}/${userId}`)
    return { userId, messages: response.data.data }
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get session messages
export const getSessionMessages = createAsyncThunk("chat/getSessionMessages", async (sessionId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const response = await axios.get(`${API_URL}/session/${sessionId}`, config)
    return { sessionId, messages: response.data.data }
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Send message
export const sendMessage = createAsyncThunk("chat/sendMessage", async (messageData, thunkAPI) => {
  try {
    const response = await axios.post(API_URLS.MESSAGES, messageData)

    // Emit message via socket if connected
    if (socket && socket.connected) {
      socket.emit("privateMessage", {
        receiver: messageData.receiver,
        content: messageData.content,
        session: messageData.session,
      })
    }

    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Mark messages as read
export const markMessagesAsRead = createAsyncThunk("chat/markMessagesAsRead", async (userId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const response = await axios.put(`${API_URL}/read/${userId}`, {}, config)

    // Emit read receipt via socket
    if (socket) {
      socket.emit("markAsRead", {
        sender: userId,
      })
    }

    return { userId, data: response.data }
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get unread message count
export const getUnreadCount = createAsyncThunk("chat/getUnreadCount", async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const response = await axios.get(`${API_URL}/unread`, config)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

const initialState = {
  socket: null,
  isConnected: false,
  conversations: [],
  messages: {},
  sessionMessages: {},
  currentChat: null,
  unreadCount: 0,
  isLoading: false,
  error: null,
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.error = null
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload
    },
    receiveMessage: (state, action) => {
      const { message } = action.payload

      // Add to appropriate message list
      const senderId = message.sender._id || message.sender

      if (!state.messages[senderId]) {
        state.messages[senderId] = []
      }

      state.messages[senderId].push(message)

      // If session message, add to session messages
      if (message.session) {
        const sessionId = message.session._id || message.session

        if (!state.sessionMessages[sessionId]) {
          state.sessionMessages[sessionId] = []
        }

        state.sessionMessages[sessionId].push(message)
      }

      // Update unread count if not current chat
      if (state.currentChat !== senderId) {
        state.unreadCount += 1
      }
    },
    updateTypingStatus: (state, action) => {
      const { user, isTyping } = action.payload

      // Find conversation and update typing status
      const conversation = state.conversations.find((conv) => conv.user._id === user._id || conv.user === user._id)

      if (conversation) {
        conversation.isTyping = isTyping
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Connect socket
      .addCase(connectSocket.pending, (state) => {
        state.isLoading = true
      })
      .addCase(connectSocket.fulfilled, (state) => {
        state.isLoading = false
        state.isConnected = true
        state.socket = "connected" // Can't store socket in state, just mark as connected
      })
      .addCase(connectSocket.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isConnected = false
      })
      // Disconnect socket
      .addCase(disconnectSocket.fulfilled, (state) => {
        state.isConnected = false
        state.socket = null
      })
      // Get conversations
      .addCase(getConversations.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.isLoading = false
        state.conversations = action.payload.data
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Get messages
      .addCase(getMessages.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        // Make sure we're not replacing the entire messages object
        if (!state.messages[action.payload.userId]) {
          state.messages[action.payload.userId] = [];
        }
        state.messages[action.payload.userId] = action.payload.messages;
        
        // Add some debugging
        console.log("Messages loaded:", action.payload.userId, action.payload.messages);
      })
    
      .addCase(getMessages.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Get session messages
      .addCase(getSessionMessages.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getSessionMessages.fulfilled, (state, action) => {
        state.isLoading = false
        state.sessionMessages[action.payload.sessionId] = action.payload.messages
      })
      .addCase(getSessionMessages.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false

        const message = action.payload.data
        const receiverId = message.receiver._id || message.receiver

        // Add to messages
        if (!state.messages[receiverId]) {
          state.messages[receiverId] = []
        }

        state.messages[receiverId].push(message)

        // If session message, add to session messages
        if (message.session) {
          const sessionId = message.session._id || message.session

          if (!state.sessionMessages[sessionId]) {
            state.sessionMessages[sessionId] = []
          }

          state.sessionMessages[sessionId].push(message)
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Mark messages as read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const userId = action.payload.userId

        // Update conversations
        state.conversations = state.conversations.map((conv) => {
          if (conv.user._id === userId || conv.user === userId) {
            return {
              ...conv,
              unreadCount: 0,
              lastMessage: {
                ...conv.lastMessage,
                isRead: true,
              },
            }
          }
          return conv
        })

        // Update messages
        if (state.messages[userId]) {
          state.messages[userId] = state.messages[userId].map((msg) => ({
            ...msg,
            isRead: true,
          }))
        }
      })
      // Get unread count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.data.count
      })
  },
})

export const { reset, setCurrentChat, receiveMessage, updateTypingStatus } = chatSlice.actions
export default chatSlice.reducer

// Socket event listeners
export const setupSocketListeners = (socket, dispatch) => {
  if (!socket) return

  // Remove any existing listeners to prevent duplicates
  socket.off("newMessage")
  socket.off("userTyping")
  socket.off("userStoppedTyping")
  socket.off("messagesRead")
  socket.off("sessionStatusChanged")

  // Add new listeners
  socket.on("newMessage", (message) => {
    console.log("Recieved Message: ", message);
    dispatch(receiveMessage({ message }))
  })

  socket.on("userTyping", (data) => {
    dispatch(updateTypingStatus({ user: data.user, isTyping: true }))
  })

  socket.on("userStoppedTyping", (data) => {
    dispatch(updateTypingStatus({ user: data.user, isTyping: false }))
  })

  socket.on("messagesRead", () => {
    // Refresh conversations to update read status
    dispatch(getConversations())
  })

  socket.on("sessionStatusChanged", (data) => {
    // Could dispatch an action to update session status
    console.log("Session status changed:", data)
  })

  // Add error handling
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error)
  })

  socket.on("error", (error) => {
    console.error("Socket error:", error)
  })
}

