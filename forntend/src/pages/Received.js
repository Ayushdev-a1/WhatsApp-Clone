"use client"

import { useEffect, useState } from "react"

export default function Received() {
  const [requests, setRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  const email = localStorage.getItem("email")

  // Fetching requests
  const fetchRequests = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/friends/getFriendRequest?email=${email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      setRequests(data.friendRequests)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching friend requests:", error)
      setLoading(false)
    }
  }

  // Fetching friend list
  const fetchFriends = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/friends/getFriends?email=${email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      setFriends(data.friends)
    } catch (error) {
      console.error("Error fetching friends:", error)
    }
  }

  useEffect(() => {
    fetchRequests()
    fetchFriends()
  }, [])

  const respondToRequest = async (senderId, status) => {
    try {
      const response = await fetch("http://localhost:5000/api/friends/respondToRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senderId, status }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      // Show alert based on the status
      if (status === "accepted") {
        alert("Friend request accepted!")
      } else if (status === "rejected") {
        alert("Friend request rejected.")
      }

      setRequests(requests.filter((req) => req.senderId._id !== senderId))
      fetchFriends()
    } catch (error) {
      console.error("Error responding to friend request:", error)
    }
  }

  // Filter out requests from friends
  const filteredRequests = requests.filter((req) => !friends.some((friend) => friend._id === req.senderId._id))

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      {filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No friend requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <div key={request.senderId._id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-3">
                  {request.senderId.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{request.senderId.email}</p>
                  <p className="text-xs text-gray-500">Wants to connect with you</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => respondToRequest(request.senderId._id, "accepted")}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Accept
                </button>
                <button
                  onClick={() => respondToRequest(request.senderId._id, "rejected")}
                  className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

