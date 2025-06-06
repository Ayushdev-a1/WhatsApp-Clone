"use client"

import { useEffect, useState } from "react"
import { IoIosAddCircleOutline } from "react-icons/io"
import { FaSearch } from "react-icons/fa"
import { BsThreeDotsVertical } from "react-icons/bs"
import { useSocketContext } from "../context/SocketContext"

export default function ChatList({ SelectedChat, setSelectedChat, setChatid, setActiveSection, ActiveSection }) {
  const [chatList, setChatList] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const { newsocket } = useSocketContext()

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
        setChatList(data.friends)
        if (data.friends.length > 0) {
          setChatid(data.friends[0]._id)
        }
      } catch (error) {
        console.error("Error fetching friends:", error)
      }
    }

    fetchFriends()
  }, [setChatid])

  useEffect(() => {
    if (newsocket) {
      newsocket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users)
      })
    }

    return () => {
      if (newsocket) {
        newsocket.off("getOnlineUsers")
      }
    }
  }, [newsocket])

  const openChat = (chat) => {
    setSelectedChat(chat)
    setActiveSection("chat")
    if (chat._id) {
      setChatid(chat._id)
    }
  }

  const isUserOnline = (userId) => onlineUsers.includes(userId)

  const filteredChats = searchQuery
    ? chatList.filter(
        (chat) =>
          chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : chatList

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <div className="flex space-x-2">
            <button className="text-gray-600 hover:text-gray-900">
              <IoIosAddCircleOutline size={22} />
            </button>
            <button className="text-gray-600 hover:text-gray-900">
              <BsThreeDotsVertical size={20} />
            </button>
          </div>
        </div>

        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No chats found</div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => openChat(chat)}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 ${SelectedChat?._id === chat._id ? "bg-blue-50" : ""}`}
            >
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mr-3">
                {chat.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium truncate">{chat.name}</h3>
                  <span className="text-xs text-gray-500">12:34 PM</span>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 truncate mr-2">{chat.lastMessage || "No messages yet"}</p>
                  {isUserOnline(chat._id) && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

