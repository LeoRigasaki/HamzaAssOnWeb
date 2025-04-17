"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  connectSocket,
  setupSocketListeners,
} from "../../features/chat/chatSlice"

const ChatRoom = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { messages, isLoading, error, isConnected, socket } = useSelector((state) => state.chat)

  const [messageText, setMessageText] = useState("")
  const [otherUser, setOtherUser] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    console.log("Messages state:", messages);
    console.log("Current userId:", userId);
    console.log("Loading state:", isLoading);
    console.log("Connection state:", isConnected);
  }, [messages, userId, isLoading, isConnected]);
  // Connect to socket when component mounts
  useEffect(() => {
    if (!isConnected && userId) {
      dispatch(connectSocket())
        .then(() => {
          console.log("Socket connected successfully");
        })
        .catch((error) => {
          console.error("Socket connection error:", error);
        });
    }
  
    // Set up socket listeners when socket is connected
    if (isConnected && socket) {
      console.log("Setting up socket listeners");
      dispatch(setupSocketListeners(socket, dispatch));
  
      // Join a room for this conversation
      if (socket.emit) {
        console.log("Joining conversation with:", userId);
        socket.emit("joinConversation", userId);
      }
    }
  
    // Clean up socket connection when component unmounts
    return () => {
      if (isConnected && socket && socket.emit) {
        console.log("Leaving conversation with:", userId);
        socket.emit("leaveConversation", userId);
      }
    }
  }, [dispatch, isConnected, socket, userId]);
  // Load messages when userId changes
  // In ChatRoom.jsx
useEffect(() => {
  if (userId) {
    console.log("Fetching messages for user:", userId);
    dispatch(getMessages(userId))
      .unwrap()
      .then(result => {
        console.log("Messages fetched successfully:", result);
      })
      .catch(error => {
        console.error("Error fetching messages:", error);
      });
    dispatch(markMessagesAsRead(userId));
  }
}, [dispatch, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch other user's info
  useEffect(() => {
    // This would typically be an API call, but for now we'll use the messages
    if (messages && messages[userId] && messages[userId].length > 0) {
      const message = messages[userId][0]
      if (message.sender._id === userId) {
        setOtherUser(message.sender)
      } else if (message.receiver._id === userId) {
        setOtherUser(message.receiver)
      }
    }
  }, [messages, userId])

  const handleSendMessage = (e) => {
    e.preventDefault()

    if (messageText.trim()) {
      dispatch(
        sendMessage({
          receiver: userId,
          content: messageText,
        }),
      )
      setMessageText("")
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (isLoading || !messages[userId]) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-12">
          <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </button>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">{otherUser ? otherUser.name : "Chat"}</h4>
              <span className="badge bg-success">Online</span>
            </div>

            <div className="card-body chat-container" style={{ height: "400px", overflowY: "auto" }}>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="chat-messages">
                {messages && userId && messages[userId] && messages[userId].length > 0 ? (
                  messages[userId].map((message, index) => {
                    const isSentByMe = message.sender._id === user._id

                    return (
                      <div key={index} className={`message ${isSentByMe ? "message-sent" : "message-received"}`}>
                        <div className={`message-bubble ${isSentByMe ? "bg-primary text-white" : "bg-light"}`}>
                          <div className="message-text">{message.content}</div>
                          <div className="message-time">
                            {formatTime(message.createdAt)}
                            {isSentByMe && message.isRead && <span className="ms-1">✓</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-5">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="card-footer">
              <form onSubmit={handleSendMessage}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={!messageText.trim()}>
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatRoom

