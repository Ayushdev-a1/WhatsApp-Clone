"use client"

import { createContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState()
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState("")
  const navigate = useNavigate()

  const register = async (email, name, phone, country, state, city, password, cpassword) => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          phone,
          country,
          state,
          city,
          password,
          cpassword,
        }),
      })
      const json = await res.json()
      console.log(json)
      if (json.token) {
        localStorage.setItem("token", json.token)
        setLoggedIn(true)
        navigate("/")
      } else {
        alert(json.msg)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const data = { email, password }
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.token) {
        localStorage.setItem("token", json.token)
        setLoggedIn(true)
        navigate("/")
      } else {
        alert(json.msg)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const getUserData = async () => {
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
    }
  }

  useEffect(() => {
    getUserData()
  }, [])

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("User_id")
    setLoggedIn(false)
    setUser(null)
    setProfileData("")
    navigate("/login")
  }

  return (
    <AuthContext.Provider
      value={{ register, login, logout, getUserData, setProfileData, loggedIn, profileData, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

