"use client"

import { useEffect, useState } from "react"
import { IoMdVideocam, IoMdSend, IoMdCall } from "react-icons/io"
import { BsThreeDotsVertical } from "react-icons/bs"
import Typing from "../Animation/Typing"
import FilePreview from "./FilePreview.js"
import { ImAttachment } from "react-icons/im"
import { useChatContext } from "../context/ChatContext"
import { useCallContext } from "../context/CallContext"
import CallInterface from "./CallInterface.js"
import IncomingCallDialog from "./IncomingCallDialog.js"

export default function Chatbox({ chatName, Chatid }) {
  const [minimizeBox, setMinimizeBox] = useState(false)
  const [closeBox, setCloseBox] = useState(true)
  const [position, setPosition] = useState({ top: "11%", right: "12%" })
  const {
    messages,
    fetchMessages,
    sendMessage,
    handleTyping,
    messageContent,
    setMessageContent,
    file,
    setFile,
    typingStatus,
    messageEndRef,
  } = useChatContext()

  const { callState, initiateCall } = useCallContext()

  useEffect(() => {
    fetchMessages(Chatid)
  }, [Chatid, fetchMessages])

  const minimize = () => {
    setMinimizeBox(!minimizeBox)
  }

  const close = () => {
    setCloseBox(true)
  }

  const startVideoCall = () => {
    initiateCall(Chatid, "video")
    setCloseBox(false)
  }

  const startAudioCall = () => {
    initiateCall(Chatid, "audio")
    setCloseBox(false)
  }

  const handleDoubleClick = () => {
    const newPosition = {
      top: `${Math.floor(Math.random() * 50)}%`,
      left: `${Math.floor(Math.random() * 50)}%`,
    }
    setPosition(newPosition)
  }

  const renderMessageContent = (msg) => {
    if (msg.file) {
      const fileUrl = `http://localhost:5000/${msg.file}`
      const fileName = msg.file.split("/").pop()
      const fileType = fileName.split(".").pop()
      const fileSize = (msg.fileSize / 1024).toFixed(2)

      if (/\.pdf$/i.test(fileName)) {
        return <FilePreview fileUrl={fileUrl} fileName={fileName} fileType="pdf" fileSize={fileSize} />
      }
      if (/\.(jpe?g|png|gif)$/i.test(fileName)) {
        return <FilePreview fileUrl={fileUrl} fileName={fileName} fileType="image" fileSize={fileSize} />
      }
      if (/\.mp4$/i.test(fileName)) {
        return <FilePreview fileUrl={fileUrl} fileName={fileName} fileType="video" fileSize={fileSize} />
      }
      return <FilePreview fileUrl={fileUrl} fileName={fileName} fileType="unknown" fileSize={fileSize} />
    }
    return <span>{msg.message}</span>
  }

  return (
    <div className="flex flex-col h-full rounded-lg shadow-md overflow-hidden bg-white">
      {/* Chat header */}
      <div className="flex items-center px-4 py-3 bg-gray-100 border-b">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-3">
          {chatName?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-800">{chatName}</h3>
          <p className="text-xs text-gray-500">{typingStatus ? "Typing..." : "Online"}</p>
        </div>
        <div className="flex space-x-3 text-gray-600">
          <button onClick={startAudioCall} className="p-2 rounded-full hover:bg-gray-200" title="Voice Call">
            <IoMdCall size={20} />
          </button>
          <button onClick={startVideoCall} className="p-2 rounded-full hover:bg-gray-200" title="Video Call">
            <IoMdVideocam size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-200" title="More options">
            <BsThreeDotsVertical size={20} />
          </button>
        </div>
      </div>

      {/* Call interface */}
      {callState.isCallInProgress && !closeBox && (
        <div
          className={`${minimizeBox ? "fixed bottom-4 right-4 w-80 h-48 z-50" : "fixed inset-0 z-50"}`}
          style={minimizeBox ? {} : position}
        >
          <div className="w-full h-full overflow-hidden rounded-lg shadow-lg">
            <CallInterface minimize={minimize} close={close} isMinimized={minimizeBox} />
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-4 max-w-[75%] ${msg.id === Chatid ? "ml-auto" : "mr-auto"}`}>
            <div
              className={`rounded-lg p-3 ${msg.id === Chatid ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}
            >
              {renderMessageContent(msg)}
            </div>
            <div className={`text-xs mt-1 text-gray-500 ${msg.id === Chatid ? "text-right" : "text-left"}`}>
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
        <div ref={messageEndRef}></div>
        {typingStatus && (
          <div className="flex items-center ml-2 mb-2">
            <Typing />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t p-3 bg-white">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Type a message"
            value={messageContent}
            onChange={(e) => handleTyping(Chatid, e)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage(Chatid, messageContent)}
            className="flex-1 bg-transparent outline-none"
          />
          <div className="flex items-center space-x-2 ml-2">
            <label htmlFor="file" className="cursor-pointer text-gray-600 hover:text-gray-800">
              <ImAttachment size={18} />
              <input type="file" id="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            <button onClick={() => sendMessage(Chatid, messageContent)} className="text-blue-500 hover:text-blue-700">
              <IoMdSend size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Incoming call dialog */}
      <IncomingCallDialog />
    </div>
  )
}

