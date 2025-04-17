import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  connectSocket,
  setupSocketListeners,
} from "../../features/chat/chatSlice";

const ChatRoom = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { messages = {}, isLoading, error, isConnected, socket } = useSelector((state) => state.chat);

  const [messageText, setMessageText] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [localError, setLocalError] = useState(null);
  const messagesEndRef = useRef(null);

  // Add this for debugging
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
          setLocalError("Failed to connect to chat server. Please try again later.");
        });
    }
  }, [dispatch, isConnected, userId]);

  // Set up socket listeners when socket is connected
  useEffect(() => {
    if (isConnected && socket && userId) {
      console.log("Setting up socket listeners");
      try {
        setupSocketListeners(socket, dispatch);
        
        // Join a room for this conversation
        if (socket.emit) {
          console.log("Joining conversation with:", userId);
          socket.emit("joinConversation", userId);
        }
      } catch (error) {
        console.error("Error setting up socket listeners:", error);
        setLocalError("Error setting up chat connection.");
      }
    }
    
    // Clean up socket connection when component unmounts
    return () => {
      if (isConnected && socket && socket.emit && userId) {
        console.log("Leaving conversation with:", userId);
        try {
          socket.emit("leaveConversation", userId);
        } catch (error) {
          console.error("Error leaving conversation:", error);
        }
      }
    };
  }, [dispatch, isConnected, socket, userId]);

  // Load messages when userId changes
  useEffect(() => {
    if (userId) {
      console.log("Fetching messages for user:", userId);
      dispatch(getMessages(userId))
        .unwrap()
        .then(result => {
          console.log("Messages fetched successfully:", result);
          // Initialize messages array if it doesn't exist
          if (!messages[userId]) {
            messages[userId] = [];
          }
        })
        .catch(error => {
          console.error("Error fetching messages:", error);
          setLocalError("Failed to load messages. Please try again.");
        });
        
      // Only mark messages as read if userId is valid
      if (userId) {
        dispatch(markMessagesAsRead(userId))
          .catch(error => {
            console.error("Error marking messages as read:", error);
          });
      }
    }
  }, [dispatch, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, userId]);

  // Fetch other user's info
  useEffect(() => {
    // This would typically be an API call, but for now we'll use the messages
    if (messages && messages[userId] && messages[userId].length > 0) {
      const message = messages[userId][0];
      if (message.sender && message.sender._id === userId) {
        setOtherUser(message.sender);
      } else if (message.receiver && message.receiver._id === userId) {
        setOtherUser(message.receiver);
      }
    }
  }, [messages, userId]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (messageText.trim() && userId) {
      dispatch(
        sendMessage({
          receiver: userId,
          content: messageText,
        })
      )
        .then(() => {
          setMessageText("");
        })
        .catch((err) => {
          setLocalError("Failed to send message. Please try again.");
          console.error("Send message error:", err);
        });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Check for missing userId
  if (!userId) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          Invalid conversation. User ID is missing.
          <button 
            className="btn btn-primary ms-3" 
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check for loading state
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Initialize messages array if needed
  if (!messages[userId]) {
    messages[userId] = [];
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
              {(error || localError) && (
                <div className="alert alert-danger" role="alert">
                  {error || localError}
                </div>
              )}

              <div className="chat-messages">
                {messages[userId] && messages[userId].length > 0 ? (
                  messages[userId].map((message, index) => {
                    const isSentByMe = message.sender && message.sender._id === user._id;

                    return (
                      <div key={index} className={`message ${isSentByMe ? "message-sent" : "message-received"}`}>
                        <div className={`message-bubble ${isSentByMe ? "bg-primary text-white" : "bg-light"}`}
                             style={{
                               padding: "10px 15px",
                               borderRadius: "18px",
                               marginBottom: "8px",
                               maxWidth: "70%",
                               alignSelf: isSentByMe ? "flex-end" : "flex-start",
                               float: isSentByMe ? "right" : "left",
                               clear: "both"
                             }}>
                          <div className="message-text">{message.content}</div>
                          <div className="message-time" style={{ fontSize: "0.75rem", opacity: 0.8, textAlign: "right" }}>
                            {formatTime(message.createdAt)}
                            {isSentByMe && message.isRead && <span className="ms-1">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
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
                  <button type="submit" className="btn btn-primary" disabled={!messageText.trim() || !userId}>
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;