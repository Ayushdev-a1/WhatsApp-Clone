"use client"

import { useState } from "react"
import { FaSearch } from "react-icons/fa"
import Received from "./Received"
import Sent from "./Sent"
import Friendlist from "./Friendlist"
import { IoMdPersonAdd } from "react-icons/io"

export default function FriendsRequest() {
  const [section, setSection] = useState("friendsList")
  const [email, setEmail] = useState("")
  const [searchResult, setSearchResult] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const searchUser = async () => {
    if (!email) return

    setIsSearching(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:5000/api/auth/search?email=${email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      })

      if (response.status === 404) {
        alert("User not found")
        setSearchResult(null)
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setSearchResult(data.user)
    } catch (error) {
      console.error("Error searching user", error)
    } finally {
      setIsSearching(false)
    }
  }

  const sendFriendRequest = async (receiverEmail) => {
    try {
      const senderEmail = localStorage.getItem("email")

      if (!senderEmail || !receiverEmail) {
        throw new Error("Sender or receiver email is missing")
      }

      const response = await fetch("http://localhost:5000/api/friends/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderEmail,
          receiverEmail,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Error: ${errorData.message}`)
      }

      // Clear search after sending request
      setSearchResult(null)
      setEmail("")

      // Show notification
      setNotifications((prev) => [...prev, `Friend request sent to ${receiverEmail}`])

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => !n.includes(receiverEmail)))
      }, 3000)
    } catch (error) {
      console.error("Error sending friend request", error)
      alert(`Error sending friend request: ${error.message}`)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">Find Friends</h2>

        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchUser()}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isSearching && (
          <div className="flex justify-center my-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {searchResult && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{searchResult.name}</p>
              <p className="text-sm text-gray-500">{searchResult.email}</p>
            </div>
            <button
              onClick={() => sendFriendRequest(searchResult.email)}
              className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
            >
              <IoMdPersonAdd size={20} />
            </button>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mb-4">
            {notifications.map((notification, index) => (
              <div key={index} className="bg-green-100 text-green-800 px-3 py-2 rounded-md mb-2">
                {notification}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setSection("friendsList")}
            className={`px-4 py-2 font-medium text-sm ${section === "friendsList" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
          >
            Friends
          </button>
          <button
            onClick={() => setSection("Received")}
            className={`px-4 py-2 font-medium text-sm ${section === "Received" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
          >
            Received
          </button>
          <button
            onClick={() => setSection("Sent")}
            className={`px-4 py-2 font-medium text-sm ${section === "Sent" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
          >
            Sent
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {section === "friendsList" && <Friendlist />}
        {section === "Received" && <Received />}
        {section === "Sent" && <Sent />}
      </div>
    </div>
  )
}

