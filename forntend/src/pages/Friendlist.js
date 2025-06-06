"use client"

import { useEffect, useState } from "react"
import { IoMdPersonRemove } from "react-icons/io"

export default function FriendList() {
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const email = localStorage.getItem("email")
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
        setLoading(false)
      } catch (error) {
        console.error("Error fetching friends:", error)
        setLoading(false)
      }
    }

    fetchFriends()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="h-full">
      {friends.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No friends found.</p>
          <p className="text-sm mt-2">Search for users to add friends.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <div key={friend._id} className="flex items-center p-3 rounded-lg hover:bg-gray-100">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-3">
                {friend.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{friend.name}</h3>
                <p className="text-sm text-gray-500">{friend.email}</p>
              </div>
              <button
                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-red-500"
                title="Remove friend"
              >
                <IoMdPersonRemove size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

