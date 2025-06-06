"use client"

import { useEffect, useState } from "react"

export default function Sent() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const email = localStorage.getItem("email")

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/friends/getSentRequests?email=${email}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        if (!response.ok) {
          if (response.status === 404) {
            alert("User not found")
          }
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        setRequests(data.friendRequests.filter((req) => req.senderId?.email === email))
        setLoading(false)
      } catch (error) {
        console.error("Error fetching sent friend requests:", error)
        setLoading(false)
      }
    }

    fetchRequests()
  }, [email])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No sent friend requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request._id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-3">
                  {(request.receiverId?.email || "Unknown").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{request.receiverId?.email || "Unknown"}</p>
                  <div className="flex items-center mt-1">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        request.status === "pending"
                          ? "bg-yellow-500"
                          : request.status === "accepted"
                            ? "bg-green-500"
                            : "bg-red-500"
                      }`}
                    ></span>
                    <p className="text-xs text-gray-500 capitalize">{request.status}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

