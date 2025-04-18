import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "../../config/api"
import { API_URLS, SOCKET_URL } from "../../config/api"
import io from "socket.io-client"

const API_URL = API_URLS.MESSAGES

// Connect to socket
export const connectSocket = createAsyncThunk("chat/connectSocket", async (_, thunkAPI) => {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      return thunkAPI.rejectWithValue("No token found")
    }

    // Use the global socket instance if available
    if (window.io && window.io.socket) {
      return { connected: true };
    }

    // Create new socket connection with auth token
    const socket = window.io.connect(token);
    
    // Return success, but we don't store the socket in redux state
    return { connected: true };
  } catch (error) {
    const message = error.message || "Failed to connect to socket"
    return thunkAPI.rejectWithValue(message)
  }
})

// Disconnect socket
export const disconnectSocket = createAsyncThunk("chat/disconnectSocket", async (_, thunkAPI) => {
  try {
    if (window.io) {
      window.io.disconnect();
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

// Send message
export const sendMessage = createAsyncThunk("chat/sendMessage", async (messageData, thunkAPI) => {
  try {
    if (!messageData.receiver) {
      return thunkAPI.rejectWithValue("Receiver ID is required")
    }
    
    const { user } = thunkAPI.getState().auth;
    
    // Create optimistic response
    const optimisticMessage = {
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
    };
    
    // If socket is connected, use that instead of HTTP
    if (window.io && window.io.socket && window.io.connected) {
      // Emit message via socket
      window.io.socket.emit("privateMessage", {
        receiver: messageData.receiver,
        content: messageData.content,
        session: messageData.session,
      });
      
      // Return optimistic message without waiting for server response
      return {
        success: true,
        data: optimisticMessage
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

    // Also emit via socket if connected
    if (window.io && window.io.socket && window.io.connected) {
      window.io.socket.emit("markAsRead", {
        sender: userId,
      });
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
      const { message } = action.payload;
      
      if (!message) return;
      
      console.log("Processing message in Redux:", message);
      
      // Extract sender and receiver IDs, handling both object and string formats
      const receiverId = typeof message.receiver === 'object' ? message.receiver._id : message.receiver;
      const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
      
      // Get current user ID from state (not from store)
      // If we're in a conversation, currentChat will be the other user's ID
      const currentUserId = state.currentChat;
      
      // If we can't determine the current user, try to infer from the message
      // This is a fallback mechanism only
      let conversationId;
      
      if (state.currentChat) {
        // We know which conversation we're in
        if (senderId === state.currentChat || receiverId === state.currentChat) {
          conversationId = state.currentChat;
        }
      } else {
        // Determine conversation ID based on message participants
        if (receiverId) {
          conversationId = receiverId;
        } else if (senderId) {
          conversationId = senderId;
        } else {
          // Can't determine where to store the message
          return;
        }
      }
      
      console.log(`Storing message in conversation: ${conversationId}`);
      
      // Initialize the messages array for this conversation if it doesn't exist
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      // Check if this message is a duplicate to avoid adding it twice
      const isDuplicate = state.messages[conversationId].some(msg => 
        // Check by ID if available (for server messages)
        (msg._id && message._id && msg._id === message._id) ||
        // Or by content and timestamp (for optimistic updates)
        (msg.content === message.content && 
         Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 1000)
      );
      
      // Only add if not a duplicate
      if (!isDuplicate) {
        // If this is a server message replacing an optimistic one, remove the optimistic one
        if (message._id && !String(message._id).startsWith('temp-')) {
          state.messages[conversationId] = state.messages[conversationId].filter(msg => 
            !msg.isOptimistic || msg.content !== message.content
          );
        }
        
        // Add the new message
        state.messages[conversationId].push(message);
      } else {
        console.log("Skipping duplicate message");
      }
    
      // Update unread count if receiving a new message not from current user
      if (state.currentChat !== senderId && senderId !== receiverId) {
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
    // Add a direct way to update message read status
    markMessageReadByReceiver: (state, action) => {
      const { userId } = action.payload;
      
      if (state.messages[userId]) {
        state.messages[userId] = state.messages[userId].map(msg => ({
          ...msg,
          isRead: true
        }));
      }
      
      // Also update conversations list
      state.conversations = state.conversations.map(conv => {
        if (conv.user._id === userId || conv.user === userId) {
          return {
            ...conv,
            unreadCount: 0,
            lastMessage: conv.lastMessage ? { ...conv.lastMessage, isRead: true } : null
          };
        }
        return conv;
      });
    }
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
      })
      .addCase(connectSocket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isConnected = false;
      })
      // Disconnect socket
      .addCase(disconnectSocket.fulfilled, (state) => {
        state.isConnected = false;
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
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;

        // Handle the optimistic message or actual server response
        if (action.payload && action.payload.data) {
          const message = action.payload.data;
          const receiverId = typeof message.receiver === 'object' ? message.receiver._id : message.receiver;

          // Add to messages if not already added by socket event
          if (!state.messages[receiverId]) {
            state.messages[receiverId] = [];
          }
          
          // Check if this message already exists to prevent duplicates
          const isDuplicate = state.messages[receiverId].some(msg => 
            (msg._id && message._id && msg._id === message._id) ||
            (msg.isOptimistic && msg.content === message.content)
          );
          
          if (!isDuplicate) {
            state.messages = {
              ...state.messages,
              [receiverId]: [...state.messages[receiverId], message],
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

        // Update conversations to clear unread counts
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

        // Update the read status of all messages in this conversation
        if (state.messages[userId]) {
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

export const { 
  reset, 
  setCurrentChat, 
  receiveMessage, 
  updateTypingStatus,
  markMessageReadByReceiver
} = chatSlice.actions;

export default chatSlice.reducer;