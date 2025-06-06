"use client"

import { createContext, useState, useEffect, useContext } from "react"
import { io } from "socket.io-client"
import { AuthContext } from "./AuthContext"

export const SocketContext = createContext()

export const useSocketContext = () => {
  return useContext(SocketContext)
}

export const SocketProvider = ({ children }) => {
  const { loggedIn } = useContext(AuthContext)
  const [newsocket, setNewSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const User_id = localStorage.getItem("User_id")

  useEffect(() => {
    if (User_id) {
      console.log("Establishing socket connection...")
      const Socket = io("http://localhost:5001", {
        transports: ["websocket"],
        query: {
          userId: User_id,
        },
      })

      setNewSocket(Socket)

      Socket.on("connect", () => {
        console.log("Socket connected:", Socket.id)
      })

      Socket.on("disconnect", () => {
        console.log("Socket disconnected")
      })

      Socket.on("getOnlineUsers", (users) => {
        console.log("Online users:", users)
        setOnlineUsers(users)
      })

      return () => {
        Socket.close()
        setNewSocket(null)
      }
    } else {
      console.log("Not logged in or User ID missing")
    }
  }, [loggedIn, User_id])

  const disconnectSocket = () => {
    if (newsocket) {
      newsocket.disconnect()
      setNewSocket(null)
      setOnlineUsers([])
      console.log("Socket disconnected upon logout")
    }
  }

  return (
    <SocketContext.Provider value={{ newsocket, onlineUsers, disconnectSocket }}>{children}</SocketContext.Provider>
  )
}

