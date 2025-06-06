"use client"

// src/context/ChatContext.js
import { createContext, useState, useEffect, useRef, useContext } from "react"
import { useSocketContext } from "./SocketContext"
import Typing from "../Animation/Typing"

const ChatContext = createContext()

export const useChatContext = () => {
  return useContext(ChatContext)
}

export const ChatProvider = ({ children }) => {
  const { newsocket } = useSocketContext()
  const [messages, setMessages] = useState([])
  const [messageContent, setMessageContent] = useState("")
  const [file, setFile] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingStatus, setTypingStatus] = useState(null)
  const messageEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    if (newsocket) {
      newsocket.on("newMessage", (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage])
      })
      newsocket.on("typing", ({ userId, isTyping }) => {
        if (isTyping) {
          setTypingStatus(<Typing />)
        } else {
          setTypingStatus(null)
        }
      })
    }
    return () => {
      if (newsocket) {
        newsocket.off("newMessage")
        newsocket.off("typing")
      }
    }
  }, [newsocket])

  const fetchMessages = async (Chatid) => {
    try {
      const URL = `http://localhost:5000/api/messages/getMessage?id=${Chatid}`
      const response = await fetch(URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("token")}`,
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error("Error fetching initial messages:", error)
    }
  }

  const sendMessage = async (Chatid, messageContent) => {
    if (messageContent.trim() === "" && !file) return

    const URL = `http://localhost:5000/api/messages/sendMessage?id=${Chatid}`
    const formData = new FormData()
    formData.append("message", messageContent)
    if (file) formData.append("file", file)

    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          Authorization: `${localStorage.getItem("token")}`,
        },
        body: formData,
      })
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const newMessage = await response.json()
      setMessages((prevMessages) => [...prevMessages, newMessage])
      setMessageContent("")
      setFile(null)

      if (newsocket) {
        newsocket.emit("sendMessage", { Chatid, message: messageContent })
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleTyping = (Chatid, e) => {
    setMessageContent(e.target.value)
    if (!isTyping && newsocket) {
      setIsTyping(true)
      newsocket.emit("typing", { Chatid, isTyping: true })
    }
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (newsocket) {
        newsocket.emit("typing", { Chatid, isTyping: false })
      }
    }, 2000)
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        fetchMessages,
        sendMessage,
        handleTyping,
        messageContent,
        setMessageContent,
        file,
        setFile,
        isTyping,
        typingStatus,
        messageEndRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

