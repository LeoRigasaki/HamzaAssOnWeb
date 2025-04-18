import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  connectSocket,
  receiveMessage,
  setCurrentChat
} from "../../features/chat/chatSlice";

const ChatRoom = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { messages, isLoading, error, isConnected } = useSelector((state) => state.chat);

  const [messageText, setMessageText] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const messagesEndRef = useRef(null);
  const socketInitialized = useRef(false);
  const socketRef = useRef(null);

  // Set current chat in Redux
  useEffect(() => {
    if (userId) {
      dispatch(setCurrentChat(userId));
    }
    
    // Clean up when component unmounts
    return () => {
      dispatch(setCurrentChat(null));
      
      // Leave conversation when unmounting
      if (socketRef.current) {
        socketRef.current.emit("leaveConversation", userId);
      }
    };
  }, [dispatch, userId]);

  // Connect to socket when component mounts
  useEffect(() => {
    const connectToSocket = async () => {
      if (!isConnected && userId) {
        setConnectionStatus("connecting");
        try {
          await dispatch(connectSocket()).unwrap();
          setConnectionStatus("connected");
          
          // Use the global socket instance
          if (window.io && window.io.socket) {
            socketRef.current = window.io.socket;
            
            // Join conversation room
            socketRef.current.emit("joinConversation", userId);
            
            // Set up event listeners
            setupSocketListeners();
            socketInitialized.current = true;
          }
        } catch (error) {
          console.error("Socket connection error:", error);
          setLocalError("Failed to connect to chat server. Please try again later.");
          setConnectionStatus("error");
        }
      } else if (isConnected) {
        setConnectionStatus("connected");
        
        // Use the global socket if already connected
        if (window.io && window.io.socket) {
          socketRef.current = window.io.socket;
          
          // Join conversation room
          socketRef.current.emit("joinConversation", userId);
          
          // Set up event listeners
          setupSocketListeners();
          socketInitialized.current = true;
        }
      }
    };
    
    connectToSocket();
    
    return () => {
      cleanupSocketListeners();
    };
  }, [dispatch, isConnected, userId]);

  // Setup socket listeners
  const setupSocketListeners = () => {
    if (!socketRef.current) return;
    
    // Clean up existing listeners first
    cleanupSocketListeners();
    
    // Add new message handler
    socketRef.current.on("newMessage", handleNewMessage);
    
    // Add debugging handlers
    socketRef.current.on("connect", () => {
      console.log("Socket connected in ChatRoom");
      setConnectionStatus("connected");
    });
    
    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected in ChatRoom");
      setConnectionStatus("disconnected");
    });
    
    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error in ChatRoom:", error);
      setConnectionStatus("error");
    });
  };
  
  // Clean up socket listeners
  const cleanupSocketListeners = () => {
    if (!socketRef.current) return;
    
    socketRef.current.off("newMessage");
    socketRef.current.off("connect");
    socketRef.current.off("disconnect");
    socketRef.current.off("connect_error");
  };
  
  // Handle new message from socket
  const handleNewMessage = (message) => {
    console.log("New message received via socket:", message);
    
    if (!message || !userId) return;
    
    // Extract IDs, handling both object and string formats
    const messageSenderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
    const messageReceiverId = typeof message.receiver === 'object' ? message.receiver._id : message.receiver;
    
    // For this conversation, either:
    // - Current user is the sender and the other user is the receiver
    // - Current user is the receiver and the other user is the sender
    const isRelevantToCurrentChat = 
      (messageSenderId === userId || messageReceiverId === userId) && 
      (messageSenderId === user._id || messageReceiverId === user._id);
    
    if (isRelevantToCurrentChat) {
      // Dispatch to add to Redux store
      dispatch(receiveMessage({ message }));
      
      // Also update local messages immediately for faster UI update
      setLocalMessages(prevMessages => {
        // Check if message already exists in local messages
        const isDuplicate = prevMessages.some(msg => 
          msg._id === message._id || 
          (msg.content === message.content && Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 1000)
        );
        
        if (!isDuplicate) {
          const newMessages = [...prevMessages, message].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
          return newMessages;
        }
        return prevMessages;
      });
      
      // Mark messages as read if they're from the other user
      if (messageSenderId === userId) {
        dispatch(markMessagesAsRead(userId));
      }
    }
  };  

  // Load messages when userId changes
  useEffect(() => {
    if (userId) {
      dispatch(getMessages(userId))
        .unwrap()
        .then(result => {
          // Mark messages as read
          return dispatch(markMessagesAsRead(userId)).unwrap();
        })
        .catch(error => {
          setLocalError("Failed to load messages. Please try again.");
        });
    }
  }, [dispatch, userId]);

  // Update local messages when messages from store change
  useEffect(() => {
    if (messages && messages[userId]) {
      console.log("Updating local messages from Redux store. Count:", messages[userId].length);
      
      // Sort messages by creation date to ensure proper order
      const sortedMessages = [...messages[userId]].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      setLocalMessages(sortedMessages);
      
      // Try to set other user info if not already set
      if (!otherUser && sortedMessages.length > 0) {
        for (const message of sortedMessages) {
          if (message.sender && typeof message.sender === 'object' && message.sender._id === userId) {
            setOtherUser(message.sender);
            break;
          } else if (message.receiver && typeof message.receiver === 'object' && message.receiver._id === userId) {
            setOtherUser(message.receiver);
            break;
          }
        }
      }
    } else if (!messages[userId]) {
      setLocalMessages([]);
    }
  }, [messages, userId, otherUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageText.trim() || !userId) return;
    
    const messageData = {
      receiver: userId,
      content: messageText,
    };
    
    // Reset text input immediately for better UX
    setMessageText("");
    
    // Dispatch to send message
    dispatch(sendMessage(messageData))
      .unwrap()
      .catch(err => {
        console.error("Send message error:", err);
        setLocalError("Failed to send message. Please try again.");
        setMessageText(messageText);
      });
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      return "Unknown time";
    }
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
                  <button 
                    className="btn-close" 
                    onClick={() => setLocalError(null)} 
                    aria-label="Close"
                  ></button>
                </div>
              )}

              <div className="chat-messages">
                {localMessages.length > 0 ? (
                  localMessages.map((message, index) => {
                    const isSentByMe = message.sender && 
                      (message.sender._id === user._id || message.sender === user._id);
                    const isOptimistic = message.isOptimistic;
                    const messageId = message._id || `msg-${index}`;

                    return (
                      <div 
                        key={messageId} 
                        className={`message ${isSentByMe ? "message-sent" : "message-received"}`}
                      >
                        <div 
                          className={`message-bubble ${isSentByMe ? "bg-primary text-white" : "bg-light"} ${isOptimistic ? "opacity-75" : ""}`}
                          style={{
                            padding: "10px 15px",
                            borderRadius: "18px",
                            marginBottom: "8px",
                            maxWidth: "70%",
                            alignSelf: isSentByMe ? "flex-end" : "flex-start",
                            float: isSentByMe ? "right" : "left",
                            clear: "both"
                          }}
                        >
                          <div className="message-text">{message.content}</div>
                          <div 
                            className="message-time" 
                            style={{ fontSize: "0.75rem", opacity: 0.8, textAlign: "right" }}
                          >
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