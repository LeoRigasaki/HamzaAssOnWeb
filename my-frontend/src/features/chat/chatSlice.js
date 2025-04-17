import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "../../config/api"
import { API_URLS, SOCKET_URL } from "../../config/api"
import io from "socket.io-client"

const API_URL = API_URLS.MESSAGES
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
    const response = await axios.get(`${API_URL}/conversations`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get messages between users
export const getMessages = createAsyncThunk("chat/getMessages", async (userId, thunkAPI) => {
  try {
    if (!userId) {
      return thunkAPI.rejectWithValue("User ID is required")
    }
    const response = await axios.get(`${API_URL}/${userId}`)
    return { userId, messages: response.data.data }
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Get session messages
export const getSessionMessages = createAsyncThunk("chat/getSessionMessages", async (sessionId, thunkAPI) => {
  try {
    if (!sessionId) {
      return thunkAPI.rejectWithValue("Session ID is required")
    }
    const response = await axios.get(`${API_URL}/session/${sessionId}`)
    return { sessionId, messages: response.data.data }
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Send message
export const sendMessage = createAsyncThunk("chat/sendMessage", async (messageData, thunkAPI) => {
  try {
    if (!messageData.receiver) {
      return thunkAPI.rejectWithValue("Receiver ID is required")
    }
    
    // Don't make an HTTP request if we're using sockets
    // Only emit the message via socket
    if (socket && socket.connected) {
      // We'll return early with optimistic data for Redux
      // Socket will handle the actual server communication
      const { user } = thunkAPI.getState().auth;
      
      socket.emit("privateMessage", {
        receiver: messageData.receiver,
        content: messageData.content,
        session: messageData.session,
      });
      
      // Return optimistic message data instead of making a server call
      return {
        success: true,
        data: {
          _id: `temp-${Date.now()}`,
          content: messageData.content,
          createdAt: new Date().toISOString(),
          sender: {
            _id: user._id,
            name: user.name,
            role: user.role
          },
          receiver: messageData.receiver,
          isRead: false,
          isOptimistic: true
        }
      };
    }
    
    // Fallback to HTTP if socket is not available
    const response = await axios.post(API_URL, messageData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message || "Something went wrong"
    return thunkAPI.rejectWithValue(message)
  }
})

// Mark messages as read
export const markMessagesAsRead = createAsyncThunk("chat/markMessagesAsRead", async (userId, thunkAPI) => {
  try {
    if (!userId) {
      return thunkAPI.rejectWithValue("User ID is required")
    }
    
    const response = await axios.put(`${API_URL}/read/${userId}`, {})

    // Emit read receipt via socket
    if (socket && socket.connected) {
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
    const response = await axios.get(`${API_URL}/unread`)
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
      
      // Skip duplicate messages by checking for existing message IDs
      const receiverId = typeof message.receiver === 'object' ? message.receiver._id : message.receiver;
      const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
      
      // Determine which conversation this message belongs to
      const otherUserId = senderId === state.currentChat ? senderId : receiverId;
      
      // Create a new array if it doesn't exist
      if (!state.messages[otherUserId]) {
        state.messages[otherUserId] = [];
      }
      
      // Check if this message already exists (prevent duplicates)
      const isDuplicate = state.messages[otherUserId].some(msg => 
        // If it has the same ID and isn't a temporary ID
        (msg._id && msg._id === message._id && !msg._id.toString().startsWith('temp-')) ||
        // Or if it has the same content and timestamp (for optimistic updates)
        (msg.content === message.content && 
         new Date(msg.createdAt).getTime() === new Date(message.createdAt).getTime())
      );
      
      // Only add if not a duplicate
      if (!isDuplicate) {
        // If this is a real message replacing an optimistic one, remove the optimistic one
        if (message._id && !message._id.toString().startsWith('temp-')) {
          state.messages[otherUserId] = state.messages[otherUserId].filter(msg => 
            !msg.isOptimistic || msg.content !== message.content
          );
        }
        
        // Add the new message
        state.messages[otherUserId] = [...state.messages[otherUserId], message];
      }

      // If session message, add to session messages
      if (message.session) {
        const sessionId = message.session._id || message.session;

        if (!state.sessionMessages[sessionId]) {
          state.sessionMessages[sessionId] = [];
        }

        // Check for duplicates in session messages too
        const isSessionDuplicate = state.sessionMessages[sessionId].some(msg => 
          (msg._id && msg._id === message._id && !msg._id.toString().startsWith('temp-')) ||
          (msg.content === message.content && 
           new Date(msg.createdAt).getTime() === new Date(message.createdAt).getTime())
        );
        
        if (!isSessionDuplicate) {
          state.sessionMessages[sessionId] = [...state.sessionMessages[sessionId], message];
        }
      }

      // Update unread count if not current chat
      if (state.currentChat !== senderId) {
        state.unreadCount += 1;
      }
    },
    updateTypingStatus: (state, action) => {
      const { user, isTyping } = action.payload;

      // Find conversation and update typing status
      const conversationIndex = state.conversations.findIndex(
        (conv) => conv.user._id === user._id || conv.user === user._id
      );

      if (conversationIndex !== -1) {
        // Create a new array with the updated conversation
        state.conversations = [
          ...state.conversations.slice(0, conversationIndex),
          {
            ...state.conversations[conversationIndex],
            isTyping,
          },
          ...state.conversations.slice(conversationIndex + 1),
        ];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Connect socket
      .addCase(connectSocket.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(connectSocket.fulfilled, (state) => {
        state.isLoading = false;
        state.isConnected = true;
        state.socket = "connected"; // Can't store socket in state, just mark as connected
      })
      .addCase(connectSocket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isConnected = false;
      })
      // Disconnect socket
      .addCase(disconnectSocket.fulfilled, (state) => {
        state.isConnected = false;
        state.socket = null;
      })
      // Get conversations
      .addCase(getConversations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload.data;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get messages
      .addCase(getMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        // Create a new messages object with the updated messages for this userId
        state.messages = {
          ...state.messages,
          [action.payload.userId]: action.payload.messages,
        };
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get session messages
      .addCase(getSessionMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSessionMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        // Create a new sessionMessages object with the updated messages
        state.sessionMessages = {
          ...state.sessionMessages,
          [action.payload.sessionId]: action.payload.messages,
        };
      })
      .addCase(getSessionMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;

        // Handle the optimistic message or actual server response
        const message = action.payload.data;
        const receiverId = typeof message.receiver === 'object' ? message.receiver._id : message.receiver;

        // Add to messages if not already added by socket event
        if (!state.messages[receiverId]) {
          state.messages[receiverId] = [];
        }
        
        // Check if this message already exists to prevent duplicates
        const isDuplicate = state.messages[receiverId].some(msg => 
          (msg._id && msg._id === message._id) ||
          (msg.isOptimistic && msg.content === message.content)
        );
        
        if (!isDuplicate) {
          state.messages = {
            ...state.messages,
            [receiverId]: [...state.messages[receiverId], message],
          };
        }

        // If session message, add to session messages
        if (message.session) {
          const sessionId = message.session._id || message.session;

          if (!state.sessionMessages[sessionId]) {
            state.sessionMessages[sessionId] = [];
          }
          
          // Check for duplicates in session messages too
          const isSessionDuplicate = state.sessionMessages[sessionId].some(msg => 
            (msg._id && msg._id === message._id) ||
            (msg.isOptimistic && msg.content === message.content)
          );
          
          if (!isSessionDuplicate) {
            state.sessionMessages = {
              ...state.sessionMessages,
              [sessionId]: [...state.sessionMessages[sessionId], message],
            };
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Mark messages as read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const userId = action.payload.userId;

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
            };
          }
          return conv;
        });

        // Update messages
        if (state.messages[userId]) {
          // Create a new array with all messages marked as read
          state.messages = {
            ...state.messages,
            [userId]: state.messages[userId].map((msg) => ({
              ...msg,
              isRead: true,
            })),
          };
        }
      })
      // Get unread count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.data.count;
      });
  },
});

export const { reset, setCurrentChat, receiveMessage, updateTypingStatus } = chatSlice.actions;
export default chatSlice.reducer;

// Socket event listeners setup helper
export const setupSocketListeners = (socket, dispatch) => {
  if (!socket) return;

  // Check if socket has the off method before using it
  const removeListener = socket.off 
    ? (event) => socket.off(event)
    : () => console.log('Socket.off not available');

  // Remove any existing listeners to prevent duplicates
  if (socket.off) {
    removeListener("newMessage");
    removeListener("userTyping");
    removeListener("userStoppedTyping");
    removeListener("messagesRead");
    removeListener("sessionStatusChanged");
    removeListener("conversationJoined");
    removeListener("userLeftConversation");
  }

  // Add new listeners
  socket.on("newMessage", (message) => {
    console.log("Socket received new message:", message);
    // Only dispatch if this is a real message with an _id
    if (message && message._id) {
      dispatch(receiveMessage({ message }));
    }
  });

  socket.on("userTyping", (data) => {
    dispatch(updateTypingStatus({ user: data.user, isTyping: true }));
  });

  socket.on("userStoppedTyping", (data) => {
    dispatch(updateTypingStatus({ user: data.user, isTyping: false }));
  });

  socket.on("messagesRead", () => {
    // Refresh conversations to update read status
    dispatch(getConversations());
  });

  socket.on("conversationJoined", (data) => {
    console.log("Joined conversation:", data);
  });

  socket.on("userLeftConversation", (data) => {
    console.log("User left conversation:", data.userId);
  });

  socket.on("sessionStatusChanged", (data) => {
    console.log("Session status changed:", data);
  });

  // Add error handling
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
};