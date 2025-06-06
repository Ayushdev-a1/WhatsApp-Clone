"use client"

import { createContext, useState, useEffect, useRef, useContext, useCallback } from "react"
import { useSocketContext } from "./SocketContext"
import { AuthContext } from "./AuthContext"
import Peer from "simple-peer"

const CallContext = createContext()

export const useCallContext = () => {
  return useContext(CallContext)
}

export const CallProvider = ({ children }) => {
  const { newsocket } = useSocketContext()
  const { profileData } = useContext(AuthContext)

  const [callState, setCallState] = useState({
    isReceivingCall: false,
    isCallInProgress: false,
    isCallAccepted: false,
    callType: null, // 'video' or 'audio'
    caller: null,
    callerName: null,
    callee: null,
    callSignal: null,
    callStatus: null, // 'ringing', 'connecting', 'connected', 'ended'
    isGroupCall: false,
    groupId: null,
  })

  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState({}) // For both 1:1 and group calls
  const [callControls, setCallControls] = useState({
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
  })

  const [groupCallParticipants, setGroupCallParticipants] = useState([])
  const [callQuality, setCallQuality] = useState("auto") // 'low', 'medium', 'high', 'auto'

  const peerRef = useRef()
  const peersRef = useRef({}) // For group calls
  const localVideoRef = useRef()
  const remoteVideoRef = useRef()
  const connectionTimeoutRef = useRef()
  const endCallRef = useRef()

  // Debug logging
  const logCall = useCallback((action, data = {}) => {
    console.log(`[CALL] ${action}:`, { ...data, time: new Date().toISOString() })
  }, [])

  // Clean up function for media streams
  const cleanupMediaStream = useCallback((stream) => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
      })
    }
  }, [])

  // Reset call state completely
  const resetCallState = useCallback(() => {
    setCallState({
      isReceivingCall: false,
      isCallInProgress: false,
      isCallAccepted: false,
      callType: null,
      caller: null,
      callerName: null,
      callee: null,
      callSignal: null,
      callStatus: null,
      isGroupCall: false,
      groupId: null,
    })

    setCallControls({
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
    })

    setGroupCallParticipants([])

    // Clean up peer connections
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }

    // Clean up group call peers
    Object.values(peersRef.current).forEach((peer) => {
      if (peer) {
        peer.destroy()
      }
    })
    peersRef.current = {}

    // Clean up timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }

    // Clean up streams
    cleanupMediaStream(localStream)
    setLocalStream(null)

    Object.values(remoteStreams).forEach((stream) => {
      cleanupMediaStream(stream)
    })
    setRemoteStreams({})
  }, [localStream, cleanupMediaStream])

  // Socket event handlers
  useEffect(() => {
    if (!newsocket) return

    // Handle incoming call
    newsocket.on("incoming-call", ({ from, callType, signal, callerName }) => {
      logCall("Received incoming call", { from, callType, callerName })

      setCallState({
        isReceivingCall: true,
        isCallInProgress: true,
        isCallAccepted: false,
        callType,
        caller: from,
        callerName,
        callee: profileData?._id,
        callSignal: signal,
        callStatus: "ringing",
        isGroupCall: false,
        groupId: null,
      })
    })

    // Handle call accepted
    newsocket.on("call-accepted", ({ from, signal, acceptorName }) => {
      logCall("Call accepted", { from, acceptorName })

      setCallState((prev) => ({
        ...prev,
        isCallAccepted: true,
        callStatus: "connecting",
      }))

      // Add the remote peer's signal
      if (peerRef.current) {
        peerRef.current.signal(signal)
      }
    })

    // Handle call rejected
    newsocket.on("call-rejected", ({ from, reason }) => {
      logCall("Call rejected", { from, reason })

      // Show rejection message briefly before resetting
      setCallState((prev) => ({
        ...prev,
        callStatus: `rejected-${reason || "unknown"}`,
        isCallInProgress: false,
        isCallAccepted: false,
      }))

      // Reset call state after a brief delay
      setTimeout(() => {
        resetCallState()
      }, 3000)
    })

    // Handle call ended
    newsocket.on("call-ended", ({ from, reason }) => {
      logCall("Call ended", { from, reason })

      setCallState((prev) => ({
        ...prev,
        callStatus: "ended",
        isCallInProgress: false,
        isCallAccepted: false,
      }))

      // Reset call state after a brief delay
      setTimeout(() => {
        resetCallState()
      }, 1500)
    })

    // Handle call failed
    newsocket.on("call-failed", ({ to, reason }) => {
      logCall("Call failed", { to, reason })

      setCallState((prev) => ({
        ...prev,
        callStatus: `failed-${reason}`,
        isCallInProgress: false,
      }))

      // Reset call state after a brief delay
      setTimeout(() => {
        resetCallState()
      }, 3000)
    })

    // Handle ICE candidates
    newsocket.on("ice-candidate", ({ from, candidate }) => {
      logCall("Received ICE candidate", { from })

      if (peerRef.current) {
        peerRef.current.signal(candidate)
      }

      // For group calls
      if (peersRef.current[from]) {
        peersRef.current[from].signal(candidate)
      }
    })

    // Group call events
    newsocket.on("group-call-started", ({ groupId, from, callType }) => {
      logCall("Group call started", { groupId, from, callType })

      setCallState({
        isReceivingCall: true,
        isCallInProgress: true,
        isCallAccepted: false,
        callType,
        caller: from,
        callee: null,
        callSignal: null,
        callStatus: "group-ringing",
        isGroupCall: true,
        groupId,
      })
    })

    newsocket.on("group-call-participants", ({ groupId, participants }) => {
      logCall("Received group call participants", { groupId, participants })
      setGroupCallParticipants(participants)
    })

    newsocket.on("user-joined-call", ({ groupId, userId }) => {
      logCall("User joined group call", { groupId, userId })

      setGroupCallParticipants((prev) => {
        if (!prev.includes(userId)) {
          return [...prev, userId]
        }
        return prev
      })
    })

    newsocket.on("user-left-call", ({ groupId, userId }) => {
      logCall("User left group call", { groupId, userId })

      setGroupCallParticipants((prev) => prev.filter((id) => id !== userId))

      // Remove their stream
      setRemoteStreams((prev) => {
        const newStreams = { ...prev }
        delete newStreams[userId]
        return newStreams
      })

      // Clean up peer connection
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy()
        delete peersRef.current[userId]
      }
    })

    newsocket.on("group-call-signal", ({ groupId, from, signal }) => {
      logCall("Received group call signal", { groupId, from })

      if (peersRef.current[from]) {
        peersRef.current[from].signal(signal)
      } else {
        // Create a new peer for this user
        createGroupCallPeer(from, signal, false)
      }
    })

    return () => {
      newsocket.off("incoming-call")
      newsocket.off("call-accepted")
      newsocket.off("call-rejected")
      newsocket.off("call-ended")
      newsocket.off("call-failed")
      newsocket.off("ice-candidate")
      newsocket.off("group-call-started")
      newsocket.off("group-call-participants")
      newsocket.off("user-joined-call")
      newsocket.off("user-left-call")
      newsocket.off("group-call-signal")
    }
  }, [newsocket, profileData, resetCallState, logCall])

  // Initialize local video when ref changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream, localVideoRef])

  // Clean up streams when component unmounts
  useEffect(() => {
    return () => {
      cleanupMediaStream(localStream)

      Object.values(remoteStreams).forEach((stream) => {
        cleanupMediaStream(stream)
      })
    }
  }, [localStream, remoteStreams, cleanupMediaStream])

  // Helper to get media constraints based on call type and quality
  const getMediaConstraints = useCallback(
    (callType) => {
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
      }

      let videoConstraints = false

      if (callType === "video") {
        switch (callQuality) {
          case "low":
            videoConstraints = {
              width: { ideal: 320 },
              height: { ideal: 240 },
              frameRate: { max: 15 },
            }
            break
          case "medium":
            videoConstraints = {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { max: 24 },
            }
            break
          case "high":
            videoConstraints = {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { max: 30 },
            }
            break
          case "auto":
          default:
            videoConstraints = true
            break
        }
      }

      return {
        audio: audioConstraints,
        video: videoConstraints,
      }
    },
    [callQuality],
  )

  // Create a peer for group calls
  const createGroupCallPeer = useCallback(
    (userId, incomingSignal = null, isInitiator = false) => {
      if (!localStream || !newsocket) return null

      logCall("Creating group call peer", { userId, isInitiator })

      const peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: localStream,
      })

      peer.on("signal", (signal) => {
        newsocket.emit("group-call-signal", {
          groupId: callState.groupId,
          from: profileData._id,
          to: userId,
          signal,
        })
      })

      peer.on("stream", (stream) => {
        logCall("Received stream from peer", { userId })
        setRemoteStreams((prev) => ({
          ...prev,
          [userId]: stream,
        }))
      })

      peer.on("close", () => {
        logCall("Peer connection closed", { userId })

        // Clean up
        if (peersRef.current[userId]) {
          delete peersRef.current[userId]
        }

        setRemoteStreams((prev) => {
          const newStreams = { ...prev }
          delete newStreams[userId]
          return newStreams
        })
      })

      peer.on("error", (err) => {
        console.error("Peer error:", err, { userId })
      })

      // If we received a signal, process it
      if (incomingSignal) {
        peer.signal(incomingSignal)
      }

      // Store the peer
      peersRef.current[userId] = peer

      return peer
    },
    [localStream, newsocket, callState.groupId, profileData, logCall],
  )

  // Initialize group call
  const initializeGroupCall = useCallback(
    async (groupId, callType) => {
      try {
        logCall("Initializing group call", { groupId, callType })

        // Get user media
        const constraints = getMediaConstraints(callType)
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        setLocalStream(stream)

        // Update call state
        setCallState({
          isReceivingCall: false,
          isCallInProgress: true,
          isCallAccepted: true,
          callType,
          caller: profileData._id,
          callee: null,
          callSignal: null,
          callStatus: "connected",
          isGroupCall: true,
          groupId,
        })

        // Notify server
        if (newsocket) {
          newsocket.emit("start-group-call", {
            groupId,
            from: profileData._id,
            callType,
          })

          // Join the call room
          newsocket.emit("join-group-call", {
            groupId,
            userId: profileData._id,
          })
        }

        return true
      } catch (error) {
        console.error("Error initializing group call:", error)
        resetCallState()
        return false
      }
    },
    [getMediaConstraints, profileData, newsocket, resetCallState, logCall],
  )

  // Join an existing group call
  const joinGroupCall = useCallback(
    async (groupId, callType) => {
      try {
        logCall("Joining group call", { groupId, callType })

        // Get user media
        const constraints = getMediaConstraints(callType)
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        setLocalStream(stream)

        // Update call state
        setCallState((prev) => ({
          ...prev,
          isReceivingCall: false,
          isCallInProgress: true,
          isCallAccepted: true,
          callStatus: "connected",
        }))

        // Join the call room
        if (newsocket) {
          newsocket.emit("join-group-call", {
            groupId,
            userId: profileData._id,
          })
        }

        return true
      } catch (error) {
        console.error("Error joining group call:", error)
        resetCallState()
        return false
      }
    },
    [getMediaConstraints, profileData, newsocket, resetCallState, logCall],
  )

  // Connect with each participant in a group call
  useEffect(() => {
    if (!callState.isGroupCall || !callState.isCallAccepted || !localStream || !newsocket) return

    // Create peer connections with all participants except self
    groupCallParticipants.forEach((participantId) => {
      if (participantId !== profileData._id && !peersRef.current[participantId]) {
        createGroupCallPeer(participantId, null, true)
      }
    })
  }, [
    groupCallParticipants,
    callState.isGroupCall,
    callState.isCallAccepted,
    localStream,
    newsocket,
    profileData,
    createGroupCallPeer,
  ])

  // Initiate a 1-to-1 call
  const initiateCall = useCallback(
    async (receiverId, callType) => {
      try {
        logCall("Initiating call", { receiverId, callType })

        // Get user media
        const constraints = getMediaConstraints(callType)
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        setLocalStream(stream)

        // Create a new peer connection
        const peer = new Peer({
          initiator: true,
          trickle: true,
          stream,
        })

        peer.on("signal", (signal) => {
          // Send the signal to the callee
          if (newsocket) {
            newsocket.emit("call-user", {
              to: receiverId,
              from: profileData._id,
              callType,
              signal,
              callerName: profileData.name,
            })
          }
        })

        peer.on("stream", (stream) => {
          logCall("Received stream from callee")
          setRemoteStreams((prev) => ({
            ...prev,
            [receiverId]: stream,
          }))
        })

        peer.on("connect", () => {
          logCall("Peer connection established")
          setCallState((prev) => ({
            ...prev,
            callStatus: "connected",
          }))

          // Clear connection timeout
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current)
          }
        })

        peer.on("close", () => {
          logCall("Peer connection closed")
          endCallRef.current()
        })

        peer.on("error", (err) => {
          console.error("Peer error:", err)
          endCallRef.current()
        })

        peerRef.current = peer

        // Set a timeout for connection establishment
        connectionTimeoutRef.current = setTimeout(() => {
          if (callState.callStatus === "connecting") {
            logCall("Call connection timeout")
            endCallRef.current()
          }
        }, 30000) // 30 seconds timeout

        setCallState({
          isReceivingCall: false,
          isCallInProgress: true,
          isCallAccepted: false,
          callType,
          caller: profileData._id,
          callee: receiverId,
          callSignal: null,
          callStatus: "ringing",
          isGroupCall: false,
          groupId: null,
        })

        return true
      } catch (error) {
        console.error("Error initiating call:", error)
        resetCallState()
        return false
      }
    },
    [getMediaConstraints, profileData, newsocket, callState.callStatus, endCallRef, resetCallState, logCall],
  )

  
  // Reject an incoming call
  const rejectCall = useCallback(
    (reason = "rejected") => {
      logCall("Rejecting call", { reason })

      if (callState.isGroupCall) {
        // For group calls, just reset the state
        resetCallState()
      } else {
        // For 1-to-1 calls, notify the caller
        if (callState.caller && newsocket) {
          newsocket.emit("call-rejected", {
            to: callState.caller,
            from: profileData._id,
            reason,
          })
        }

        resetCallState()
      }
    },
    [callState, profileData, newsocket, resetCallState, logCall],
  )

  // Accept an incoming call
  const acceptCall = useCallback(async () => {
    try {
      logCall("Accepting call")

      // Get user media based on call type
      const constraints = getMediaConstraints(callState.callType)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setLocalStream(stream)

      if (callState.isGroupCall) {
        // For group calls
        return joinGroupCall(callState.groupId, callState.callType)
      } else {
        // For 1-to-1 calls
        // Create a new peer connection
        const peer = new Peer({
          initiator: false,
          trickle: true,
          stream,
        })

        peer.on("signal", (signal) => {
          // Send the signal to the caller
          if (newsocket) {
            newsocket.emit("call-accepted", {
              to: callState.caller,
              from: profileData._id,
              signal,
              acceptorName: profileData.name,
            })
          }
        })

        peer.on("stream", (stream) => {
          logCall("Received stream from caller")
          setRemoteStreams((prev) => ({
            ...prev,
            [callState.caller]: stream,
          }))
        })

        peer.on("connect", () => {
          logCall("Peer connection established")
          setCallState((prev) => ({
            ...prev,
            callStatus: "connected",
          }))
        })

        peer.on("close", () => {
          logCall("Peer connection closed")
          endCallRef.current()
        })

        peer.on("error", (err) => {
          console.error("Peer error:", err)
          endCallRef.current()
        })

        // Signal the peer with the caller's signal
        peer.signal(callState.callSignal)

        peerRef.current = peer

        setCallState((prev) => ({
          ...prev,
          isCallAccepted: true,
          isReceivingCall: false,
          callStatus: "connecting",
        }))

        return true
      }
    } catch (error) {
      console.error("Error accepting call:", error)
      rejectCall("media-error")
      return false
    }
  }, [callState, getMediaConstraints, profileData, newsocket, joinGroupCall, endCallRef, rejectCall, logCall])

 
  // End an ongoing call
  const endCall = useCallback(() => {
    logCall("Ending call")

    if (callState.isGroupCall) {
      // Leave group call
      if (newsocket && callState.groupId) {
        newsocket.emit("leave-group-call", {
          groupId: callState.groupId,
          userId: profileData._id,
        })
      }
    } else {
      // End 1-to-1 call
      const peerId = callState.caller === profileData._id ? callState.callee : callState.caller

      if (peerId && newsocket) {
        newsocket.emit("end-call", {
          to: peerId,
          from: profileData._id,
        })
      }
    }

    // Close the peer connection
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }

    // Close group call peer connections
    Object.values(peersRef.current).forEach((peer) => {
      if (peer) {
        peer.destroy()
      }
    })
    peersRef.current = {}

    // Clean up timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }

    // Stop all tracks in the local stream
    cleanupMediaStream(localStream)

    setLocalStream(null)
    setRemoteStreams({})

    setCallState((prev) => ({
      ...prev,
      isCallInProgress: false,
      isCallAccepted: false,
      callStatus: "ended",
    }))

    // Reset call state after a brief delay
    setTimeout(() => {
      resetCallState()
    }, 1500)
  }, [callState, profileData, newsocket, localStream, cleanupMediaStream, resetCallState, logCall])

  // Update the ref
  useEffect(() => {
    endCallRef.current = endCall
  }, [endCall])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })

      setCallControls((prev) => ({
        ...prev,
        isMuted: !prev.isMuted,
      }))
    }
  }, [localStream])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream && callState.callType === "video") {
      const videoTracks = localStream.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })

      setCallControls((prev) => ({
        ...prev,
        isVideoOff: !prev.isVideoOff,
      }))
    }
  }, [localStream, callState.callType])

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (!callState.isCallInProgress) return

    try {
      if (!callControls.isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        // Replace the video track with the screen sharing track
        if (localStream) {
          const videoTrack = screenStream.getVideoTracks()[0]

          // Replace track in all peer connections
          if (peerRef.current) {
            const senders = peerRef.current.getSenders()
            const sender = senders.find((s) => s.track.kind === "video")
            if (sender) {
              sender.replaceTrack(videoTrack)
            }
          }

          // Replace in group call peers
          Object.values(peersRef.current).forEach((peer) => {
            if (peer) {
              const senders = peer.getSenders()
              const sender = senders.find((s) => s.track.kind === "video")
              if (sender) {
                sender.replaceTrack(videoTrack)
              }
            }
          })

          // Update local video display
          const newStream = new MediaStream([...localStream.getAudioTracks(), videoTrack])

          // Stop old video tracks
          localStream.getVideoTracks().forEach((track) => track.stop())

          setLocalStream(newStream)

          // Handle when user stops screen sharing
          videoTrack.onended = () => {
            toggleScreenShare()
          }
        }
      } else {
        // Stop screen sharing and revert to camera
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callState.callType === "video",
        })

        const videoTrack = stream.getVideoTracks()[0]

        // Replace track in all peer connections
        if (peerRef.current) {
          const senders = peerRef.current.getSenders()
          const sender = senders.find((s) => s.track.kind === "video")
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack)
          }
        }

        // Replace in group call peers
        Object.values(peersRef.current).forEach((peer) => {
          if (peer) {
            const senders = peer.getSenders()
            const sender = senders.find((s) => s.track.kind === "video")
            if (sender && videoTrack) {
              sender.replaceTrack(videoTrack)
            }
          }
        })

        // Update local video display
        const newStream = new MediaStream([...localStream.getAudioTracks(), ...stream.getVideoTracks()])

        setLocalStream(newStream)
      }

      setCallControls((prev) => ({
        ...prev,
        isScreenSharing: !prev.isScreenSharing,
      }))
    } catch (error) {
      console.error("Error toggling screen share:", error)
    }
  }, [callState.isCallInProgress, callState.callType, callControls.isScreenSharing, localStream])

  // Set call quality
  const setCallQualityLevel = useCallback((quality) => {
    setCallQuality(quality)
  }, [])

  // Start a group call
  const startGroupCall = useCallback(
    (groupId, callType) => {
      return initializeGroupCall(groupId, callType)
    },
    [initializeGroupCall],
  )

  return (
    <CallContext.Provider
      value={{
        callState,
        localStream,
        remoteStreams,
        callControls,
        localVideoRef,
        remoteVideoRef,
        groupCallParticipants,
        callQuality,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        setCallQualityLevel,
        startGroupCall,
        joinGroupCall,
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

