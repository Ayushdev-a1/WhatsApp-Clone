"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaRocketchat } from "react-icons/fa"
import { SiGotomeeting } from "react-icons/si"
import { SiGoogleclassroom } from "react-icons/si"
import { IoMdSettings } from "react-icons/io"
import { CgProfile } from "react-icons/cg"
import Chatbox from "../compnent/Chatbox"
import ChatList from "../compnent/ChatList"
import Defult from "./Defult"
import FriendsRequest from "./FriendsRequest"
import Profile from "./Profile"
import Button from "../Icons/Button"
import { useCallContext } from "../context/CallContext"
import IncomingCallDialog from "../compnent/IncomingCallDialog"

export default function Home() {
  const navigate = useNavigate()
  const [loggedOut, setLoggedOut] = useState(false)
  const [selectedChat, setSelectedChat] = useState(null)
  const [ActiveSection, setActiveSection] = useState("chat")
  const [profileData, setProfileData] = useState(null)
  const [error, setError] = useState(null)
  const [loggedin, setLoggedin] = useState(false)
  const [Chatid, setChatid] = useState(null)
  const [Loading, setLoading] = useState(false)

  const { callState } = useCallContext()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login")
    } else {
      setLoggedin(true)
    }
  }, [loggedOut, navigate])

  // Fetching logged-in user data
  const fetchProfileData = async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("http://localhost:5000/api/auth/getuser", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      })

      if (!response.ok) {
        console.log("failed")
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setProfileData(data)
      localStorage.setItem("email", data.email)
      localStorage.setItem("User_id", data._id)
    } catch (error) {
      console.error("Error getting user data", error)
      setError(error.message)
    }
  }

  useEffect(() => {
    if (loggedin) {
      fetchProfileData()
    }
  }, [loggedin])

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-lg overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-16 bg-gray-800 flex flex-col justify-between py-6">
            <div className="flex flex-col items-center space-y-6">
              <button
                className={`p-3 rounded-xl ${ActiveSection === "chat" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                onClick={() => setActiveSection("chat")}
              >
                <FaRocketchat size={20} />
              </button>
              <button
                className={`p-3 rounded-xl ${ActiveSection === "meeting" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                onClick={() => setActiveSection("meeting")}
              >
                <SiGotomeeting size={20} />
              </button>
              <button
                className={`p-3 rounded-xl ${ActiveSection === "Friends" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                onClick={() => setActiveSection("Friends")}
              >
                <SiGoogleclassroom size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <button
                className={`p-3 rounded-xl ${ActiveSection === "settings" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                onClick={() => setActiveSection("settings")}
              >
                <IoMdSettings size={20} />
              </button>
              <button
                className={`p-3 rounded-xl ${ActiveSection === "profile" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                onClick={() => setActiveSection("profile")}
              >
                <CgProfile size={20} />
              </button>
              <Button />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex">
            {/* Left panel */}
            {ActiveSection === "profile" && (
              <div className="w-full md:w-1/3 border-r">
                <Profile fetchProfileData={fetchProfileData} profileData={profileData} error={error} />
              </div>
            )}

            {ActiveSection === "meeting" && (
              <div className="w-full md:w-1/3 border-r">
                <h1 className="text-xl font-bold p-4">Meeting</h1>
              </div>
            )}

            {ActiveSection === "settings" && (
              <div className="w-full md:w-1/3 border-r">
                <h1 className="text-xl font-bold p-4">Settings</h1>
              </div>
            )}

            {ActiveSection === "Friends" && (
              <div className="w-full md:w-1/3 border-r">
                <FriendsRequest />
              </div>
            )}

            {ActiveSection === "chat" && (
              <div className="w-full md:w-1/3 border-r">
                <ChatList
                  SelectedChat={selectedChat}
                  setSelectedChat={setSelectedChat}
                  setChatid={setChatid}
                  setActiveSection={setActiveSection}
                  ActiveSection={ActiveSection}
                />
              </div>
            )}

            {/* Right panel - Chat or default */}
            <div className="hidden md:block md:w-2/3">
              {selectedChat ? (
                <Chatbox chatName={selectedChat?.name} Chatid={Chatid} />
              ) : (
                <Defult profileData={profileData} />
              )}
            </div>
          </div>
        </div>

        {/* Incoming call dialog */}
        {callState.isReceivingCall && <IncomingCallDialog />}
      </div>
    </>
  )
}

