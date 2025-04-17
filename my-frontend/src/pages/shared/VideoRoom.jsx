"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { getSession } from "../../features/sessions/sessionSlice"

const VideoRoom = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { currentSession, isLoading, error } = useSelector((state) => state.sessions)

  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [peerConnection, setPeerConnection] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState("initializing")
  const [errorMessage, setErrorMessage] = useState("")

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  // WebRTC configuration
  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
  }

  // Load session details
  useEffect(() => {
    dispatch(getSession(sessionId))
  }, [dispatch, sessionId])

  // Initialize WebRTC when session is loaded
  useEffect(() => {
    if (currentSession) {
      initializeWebRTC()
    }

    return () => {
      // Clean up WebRTC resources when component unmounts
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
      if (peerConnection) {
        peerConnection.close()
      }
    }
  }, [currentSession])

  // Set up media streams
  const initializeWebRTC = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      setLocalStream(stream)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const pc = new RTCPeerConnection(configuration)
      setPeerConnection(pc)

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Set up event handlers for peer connection
      pc.onicecandidate = handleICECandidate
      pc.ontrack = handleTrackEvent
      pc.oniceconnectionstatechange = handleICEConnectionStateChange

      // Determine if we should create or answer the offer based on roles
      const isInitiator = user.role === "tutor"

      if (isInitiator) {
        setConnectionStatus("creating_offer")
        createOffer(pc)
      } else {
        setConnectionStatus("waiting_for_offer")
        // In a real app, we would listen for an offer from the signaling server
      }
    } catch (err) {
      console.error("Error initializing WebRTC:", err)
      setErrorMessage(`Could not access camera and microphone: ${err.message}`)
      setConnectionStatus("failed")
    }
  }

  // Create and send an offer
  const createOffer = async (pc) => {
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      setConnectionStatus("offer_created")

      // In a real app, we would send this offer to the peer via a signaling server
      console.log("Offer created:", offer)

      // For demo purposes, we'll simulate receiving an answer after a delay
      setTimeout(() => {
        // This would normally come from the signaling server
        const simulatedAnswer = {
          type: "answer",
          sdp: "v=0\r\no=- 8403615332284539743 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS remote-stream\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:someufrag\r\na=ice-pwd:someicepwd\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:active\r\na=mid:0\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=ssrc:1001 cname:remote-audio\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:someufrag\r\na=ice-pwd:someicepwd\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:active\r\na=mid:1\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:96 VP8/90000\r\na=ssrc:2001 cname:remote-video\r\n",
        }

        handleReceivedAnswer(simulatedAnswer)
      }, 2000)
    } catch (err) {
      console.error("Error creating offer:", err)
      setErrorMessage(`Failed to create connection offer: ${err.message}`)
      setConnectionStatus("failed")
    }
  }

  // Handle received answer
  const handleReceivedAnswer = async (answer) => {
    try {
      if (peerConnection && peerConnection.signalingState !== "closed") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
        setConnectionStatus("connected")
      }
    } catch (err) {
      console.error("Error handling answer:", err)
      setErrorMessage(`Failed to process answer: ${err.message}`)
      setConnectionStatus("failed")
    }
  }

  // Handle ICE candidates
  const handleICECandidate = (event) => {
    if (event.candidate) {
      // In a real app, we would send this candidate to the peer via a signaling server
      console.log("ICE candidate:", event.candidate)
    }
  }

  // Handle incoming tracks
  const handleTrackEvent = (event) => {
    setRemoteStream(event.streams[0])

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = event.streams[0]
    }
  }

  // Handle ICE connection state changes
  const handleICEConnectionStateChange = () => {
    if (peerConnection) {
      console.log("ICE connection state:", peerConnection.iceConnectionState)

      switch (peerConnection.iceConnectionState) {
        case "connected":
        case "completed":
          setConnectionStatus("connected")
          break
        case "failed":
        case "disconnected":
        case "closed":
          setConnectionStatus("disconnected")
          break
        default:
          break
      }
    }
  }

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        // Force re-render
        setLocalStream((prevStream) => {
          return new MediaStream(prevStream.getTracks())
        })
      }
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        // Force re-render
        setLocalStream((prevStream) => {
          return new MediaStream(prevStream.getTracks())
        })
      }
    }
  }

  // End call
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    if (peerConnection) {
      peerConnection.close()
    }
    navigate(-1)
  }

  // Check if audio/video are enabled
  const isAudioEnabled = localStream && localStream.getAudioTracks()[0]?.enabled
  const isVideoEnabled = localStream && localStream.getVideoTracks()[0]?.enabled

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    )
  }

  if (!currentSession) {
    return (
      <div className="alert alert-warning" role="alert">
        Session not found.
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Video Session: {currentSession.subject}</h4>
              <div>
                {connectionStatus === "connected" ? (
                  <span className="badge bg-success">Connected</span>
                ) : connectionStatus === "failed" || connectionStatus === "disconnected" ? (
                  <span className="badge bg-danger">Disconnected</span>
                ) : (
                  <span className="badge bg-warning">Connecting...</span>
                )}
              </div>
            </div>

            <div className="card-body">
              {errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}

              <div className="row">
                <div className="col-md-8">
                  {/* Remote video (large) */}
                  <div className="remote-video-container mb-3" style={{ height: "400px", backgroundColor: "#000" }}>
                    {remoteStream ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <div className="d-flex justify-content-center align-items-center h-100 text-white">
                        {connectionStatus === "connected" ? "No remote video" : "Connecting..."}
                      </div>
                    )}
                  </div>

                  {/* Video controls */}
                  <div className="video-controls d-flex justify-content-center mb-3">
                    <button
                      className={`btn ${isAudioEnabled ? "btn-outline-primary" : "btn-danger"} mx-2`}
                      onClick={toggleAudio}
                    >
                      <i className={`bi ${isAudioEnabled ? "bi-mic" : "bi-mic-mute"}`}></i>
                    </button>
                    <button
                      className={`btn ${isVideoEnabled ? "btn-outline-primary" : "btn-danger"} mx-2`}
                      onClick={toggleVideo}
                    >
                      <i className={`bi ${isVideoEnabled ? "bi-camera-video" : "bi-camera-video-off"}`}></i>
                    </button>
                    <button className="btn btn-danger mx-2" onClick={endCall}>
                      <i className="bi bi-telephone-x"></i> End Call
                    </button>
                  </div>
                </div>

                <div className="col-md-4">
                  {/* Local video (small) */}
                  <div className="local-video-container mb-3" style={{ height: "200px", backgroundColor: "#000" }}>
                    {localStream ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <div className="d-flex justify-content-center align-items-center h-100 text-white">
                        Initializing camera...
                      </div>
                    )}
                  </div>

                  {/* Session info */}
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Session Info</h5>
                    </div>
                    <div className="card-body">
                      <p className="mb-1">
                        <strong>Subject:</strong> {currentSession.subject}
                      </p>
                      <p className="mb-1">
                        <strong>Date:</strong> {new Date(currentSession.date).toLocaleDateString()}
                      </p>
                      <p className="mb-1">
                        <strong>Time:</strong> {currentSession.startTime} - {currentSession.endTime}
                      </p>
                      <p className="mb-0">
                        <strong>{user.role === "student" ? "Tutor" : "Student"}:</strong>{" "}
                        {user.role === "student" ? currentSession.tutor.name : currentSession.student.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoRoom

