"use client"

import { useEffect } from "react"
import { useCallContext } from "../context/CallContext"
import { IoClose } from "react-icons/io5"
import { FaCompressAlt, FaExpand } from "react-icons/fa"
import { MdCallEnd } from "react-icons/md"
import { IoMdMic, IoMdMicOff } from "react-icons/io"
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs"
import { MdOutlineScreenShare, MdOutlineStopScreenShare } from "react-icons/md"

export default function CallInterface({ minimize, close, isMinimized }) {
  const {
    callState,
    localStream,
    remoteStream,
    callControls,
    localVideoRef,
    remoteVideoRef,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useCallContext()

  useEffect(() => {
    // Set up video elements when streams are available
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }

    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [localStream, remoteStream, localVideoRef, remoteVideoRef])

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="text-white font-medium">{callState.callType === "video" ? "Video Call" : "Voice Call"}</div>
        <div className="flex space-x-2">
          {isMinimized ? (
            <button onClick={minimize} className="text-white p-1 rounded-full hover:bg-gray-700">
              <FaExpand size={18} />
            </button>
          ) : (
            <button onClick={minimize} className="text-white p-1 rounded-full hover:bg-gray-700">
              <FaCompressAlt size={18} />
            </button>
          )}
          <button onClick={close} className="text-white p-1 rounded-full hover:bg-gray-700">
            <IoClose size={20} />
          </button>
        </div>
      </div>

      {/* Video container */}
      <div className="flex-1 relative bg-black">
        {/* Remote video (full size) */}
        {callState.isCallAccepted && remoteStream && (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}

        {/* Local video (picture-in-picture) */}
        {localStream && callState.callType === "video" && (
          <div className="absolute bottom-4 right-4 w-1/4 h-1/4 border-2 border-white rounded-lg overflow-hidden">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}

        {/* Connecting or audio-only call display */}
        {(!callState.isCallAccepted || callState.callType === "audio") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">👤</span>
              </div>
              <p className="text-white text-lg">{!callState.isCallAccepted ? "Connecting..." : "Audio Call"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-6">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${callControls.isMuted ? "bg-red-500" : "bg-gray-600"} hover:opacity-90`}
        >
          {callControls.isMuted ? <IoMdMicOff size={24} color="white" /> : <IoMdMic size={24} color="white" />}
        </button>

        {callState.callType === "video" && (
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${callControls.isVideoOff ? "bg-red-500" : "bg-gray-600"} hover:opacity-90`}
          >
            {callControls.isVideoOff ? (
              <BsCameraVideoOff size={24} color="white" />
            ) : (
              <BsCameraVideo size={24} color="white" />
            )}
          </button>
        )}

        <button onClick={endCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700">
          <MdCallEnd size={24} color="white" />
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${callControls.isScreenSharing ? "bg-green-500" : "bg-gray-600"} hover:opacity-90`}
        >
          {callControls.isScreenSharing ? (
            <MdOutlineStopScreenShare size={24} color="white" />
          ) : (
            <MdOutlineScreenShare size={24} color="white" />
          )}
        </button>
      </div>
    </div>
  )
}

