import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  connectSocket,
  setupSocketListeners,
  receiveMessage
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
  const [localMessages, setLocalMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const messagesEndRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log("ChatRoom rendered with userId:", userId);
    console.log("Connection status:", connectionStatus);
    console.log("isConnected from Redux:", isConnected);
  }, [userId, connectionStatus, isConnected]);

  // Connect to socket when component mounts
  useEffect(() => {
    if (!isConnected && userId) {
      console.log("Attempting to connect socket");
      setConnectionStatus("connecting");
      dispatch(connectSocket())
        .unwrap()
        .then(() => {
          console.log("Socket connected successfully");
          setConnectionStatus("connected");
        })
        .catch((error) => {
          console.error("Socket connection error:", error);
          setLocalError("Failed to connect to chat server. Please try again later.");
          setConnectionStatus("error");
        });
    } else if (isConnected) {
      setConnectionStatus("connected");
    }
  }, [dispatch, isConnected, userId]);

  // Set up socket listeners when socket is connected
  useEffect(() => {
    if (connectionStatus === "connected" && userId) {
      console.log("Setting up socket listeners");
      
      // Create a custom message handler
      const handleNewMessage = (message) => {
        console.log("New message received:", message);
        
        // Check if this message is relevant to the current chat
        const isRelevantMessage = 
          (message.sender && message.sender._id === userId) || 
          (message.receiver && message.receiver._id === userId);
        
        if (isRelevantMessage) {
          console.log("Message is relevant to this chat, updating local state");
          // First dispatch to Redux store
          dispatch(receiveMessage({ message }));
          
          // Then update local state
          setLocalMessages(prevMessages => [...prevMessages, message]);
        }
      };
      
      // Add custom event listener for new messages
      if (socket && socket.on) {
        console.log("Adding newMessage event listener");
        socket.on("newMessage", handleNewMessage);
        
        // Explicitly join this conversation room
        console.log("Joining conversation with:", userId);
        socket.emit("joinConversation", userId);
      }
      
      // Return cleanup function
      return () => {
        if (socket && socket.off) {
          console.log("Removing newMessage event listener");
          socket.off("newMessage", handleNewMessage);
          
          // Leave the conversation when component unmounts
          console.log("Leaving conversation with:", userId);
          socket.emit("leaveConversation", userId);
        }
      };
    }
  }, [dispatch, connectionStatus, userId, socket]);

  // Update local messages when messages from store change
  useEffect(() => {
    if (messages && messages[userId]) {
      console.log("Updating local messages from Redux store");
      setLocalMessages(messages[userId]);
    } else {
      setLocalMessages([]);
    }
  }, [messages, userId]);

  // Load messages when userId changes
  useEffect(() => {
    if (userId) {
      console.log("Fetching messages for user:", userId);
      dispatch(getMessages(userId))
        .unwrap()
        .then(result => {
          console.log("Messages fetched successfully:", result);
          
          // Mark messages as read
          return dispatch(markMessagesAsRead(userId)).unwrap();
        })
        .then(() => {
          console.log("Messages marked as read");
        })
        .catch(error => {
          console.error("Error in message operations:", error);
          setLocalError("Failed to load messages. Please try again.");
        });
    }
  }, [dispatch, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Fetch other user's info
  useEffect(() => {
    if (localMessages.length > 0) {
      for (const message of localMessages) {
        if (message.sender && message.sender._id === userId) {
          setOtherUser(message.sender);
          break;
        } else if (message.receiver && message.receiver._id === userId) {
          setOtherUser(message.receiver);
          break;
        }
      }
    }
  }, [localMessages, userId]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (messageText.trim() && userId) {
      const newMessage = {
        receiver: userId,
        content: messageText,
      };
      
      console.log("Sending message:", newMessage);
      
      // Optimistically add message to local state first for immediate feedback
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        content: messageText,
        createdAt: new Date(),
        sender: {
          _id: user._id,
          name: user.name,
          role: user.role
        },
        receiver: {
          _id: userId,
          name: otherUser?.name || "User",
          role: otherUser?.role || "unknown"
        },
        isRead: false,
        isOptimistic: true // Flag to identify this is an optimistic update
      };
      
      setLocalMessages(prevMessages => [...prevMessages, optimisticMessage]);
      setMessageText("");
      
      // Then dispatch to server
      dispatch(sendMessage(newMessage))
        .unwrap()
        .then(response => {
          console.log("Message sent successfully:", response);
          
          // Remove optimistic message and add real one from server
          setLocalMessages(prevMessages => 
            prevMessages
              .filter(msg => msg._id !== optimisticMessage._id)
              .concat(response.data)
          );
        })
        .catch(err => {
          console.error("Send message error:", err);
          setLocalError("Failed to send message. Please try again.");
          
          // Remove the optimistic message on failure
          setLocalMessages(prevMessages => 
            prevMessages.filter(msg => msg._id !== optimisticMessage._id)
          );
          // Restore the message text so user can try again
          setMessageText(messageText);
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

  // Show loading state only on initial load
  if (isLoading && localMessages.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
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
              <span className={`badge ${connectionStatus === 'connected' ? 'bg-success' : 'bg-warning'}`}>
                {connectionStatus === 'connected' ? 'Online' : 'Connecting...'}
              </span>
            </div>

            <div className="card-body chat-container" style={{ height: "400px", overflowY: "auto" }}>
              {(error || localError) && (
                <div className="alert alert-danger" role="alert">
                  {error || localError}
                </div>
              )}

              <div className="chat-messages">
                {localMessages.length > 0 ? (
                  localMessages.map((message, index) => {
                    const isSentByMe = message.sender && message.sender._id === user._id;
                    const isOptimistic = message.isOptimistic;

                    return (
                      <div key={message._id || index} className={`message ${isSentByMe ? "message-sent" : "message-received"}`}>
                        <div className={`message-bubble ${isSentByMe ? "bg-primary text-white" : "bg-light"} ${isOptimistic ? "opacity-75" : ""}`}
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
                            {isSentByMe && (
                              <span className="ms-1">
                                {isOptimistic ? "●" : message.isRead ? "✓✓" : "✓"}
                              </span>
                            )}
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
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={!messageText.trim() || !userId || connectionStatus !== 'connected'}
                  >
                    {connectionStatus !== 'connected' ? 'Connecting...' : 'Send'}
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