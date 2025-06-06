"use client"
import { useCallContext } from "../context/CallContext"
import { MdCallEnd, MdCall } from "react-icons/md"
import { BsCameraVideo } from "react-icons/bs"

export default function IncomingCallDialog() {
  const { callState, acceptCall, rejectCall } = useCallContext()

  if (!callState.isReceivingCall) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-80 overflow-hidden">
        <div className="bg-blue-600 p-4 text-white text-center">
          <h3 className="text-lg font-semibold">Incoming Call</h3>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">👤</span>
          </div>

          <p className="text-lg font-medium mb-1">Unknown Caller</p>
          <p className="text-sm text-gray-500 mb-4">{callState.callType === "video" ? "Video Call" : "Voice Call"}</p>

          <div className="flex justify-center space-x-6 w-full mt-2">
            <button onClick={rejectCall} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-1">
                <MdCallEnd size={24} color="white" />
              </div>
              <span className="text-sm">Decline</span>
            </button>

            <button onClick={acceptCall} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-1">
                {callState.callType === "video" ? (
                  <BsCameraVideo size={24} color="white" />
                ) : (
                  <MdCall size={24} color="white" />
                )}
              </div>
              <span className="text-sm">Accept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

