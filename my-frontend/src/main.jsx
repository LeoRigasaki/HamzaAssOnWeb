import React from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import App from "./App"
import { store } from "./features/store"
import "./index.css"

// Import Bootstrap CSS and JS
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import "bootstrap-icons/font/bootstrap-icons.css"

// Setup socket.io for global access
import io from "socket.io-client"
import { SOCKET_URL } from "./config/api"

// Create window.io namespace to store socket related objects
window.io = {
  connect: (token) => {
    if (window.io.socket) {
      console.log("Socket already exists, disconnecting previous connection");
      window.io.socket.disconnect();
    }
    
    // Create new socket connection with auth token
    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Store socket globally for component access
    window.io.socket = socket;
    window.socket = socket; // Alternate reference for backward compatibility
    
    // Setup global socket events
    socket.on("connect", () => {
      console.log("Socket connected globally");
      window.io.connected = true;
    });
    
    socket.on("disconnect", () => {
      console.log("Socket disconnected globally");
      window.io.connected = false;
    });
    
    socket.on("connect_error", (error) => {
      console.error("Socket connection error globally:", error);
      window.io.connected = false;
    });
    
    return socket;
  },
  disconnect: () => {
    if (window.io.socket) {
      window.io.socket.disconnect();
      window.io.socket = null;
      window.io.connected = false;
    }
  },
  socket: null,
  connected: false,
  sockets: {} // For storing multiple socket connections if needed
};

const container = document.getElementById("root")
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)