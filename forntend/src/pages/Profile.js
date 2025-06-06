"use client"

import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import { MdEdit } from "react-icons/md"
import { FaCamera, FaCheck } from "react-icons/fa"

export default function Profile() {
  const { profileData, setProfileData } = useContext(AuthContext)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("Always stay blessed")
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)

  useEffect(() => {
    if (profileData) {
      setName(profileData.name || "")
    }
  }, [profileData])

  const handleNameChange = (e) => setName(e.target.value)
  const handleBioChange = (e) => setBio(e.target.value)

  const toggleEditName = () => setIsEditingName(!isEditingName)
  const toggleEditBio = () => setIsEditingBio(!isEditingBio)

  const updateProfile = async () => {
    try {
      const URL = "http://localhost:5000/api/auth/profile"
      const requestBody = { name }

      const response = await fetch(URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        setProfileData(data)
        alert("Profile Updated Successfully")
      } else {
        console.error("Failed to update profile:", data)
        alert("Failed to Update Profile")
      }

      setIsEditingName(false)
      setIsEditingBio(false)
    } catch (error) {
      console.error("Error occurred:", error)
    }
  }

  const choosePic = () => {
    // Code to choose a picture
  }

  if (!profileData) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 overflow-hidden">
            {profileData.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <button
            onClick={choosePic}
            className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-md hover:bg-blue-600"
          >
            <FaCamera size={14} />
          </button>
        </div>

        <h2 className="text-xl font-semibold">{profileData.name}</h2>
        <p className="text-gray-500">{profileData.email}</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <div className="flex items-center p-3 bg-gray-100 rounded-md">
            {isEditingName ? (
              <>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className="flex-1 bg-transparent outline-none"
                  onKeyPress={(e) => e.key === "Enter" && updateProfile()}
                />
                <button onClick={updateProfile} className="ml-2 text-blue-500 hover:text-blue-700">
                  <FaCheck size={16} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1">{name}</span>
                <button onClick={toggleEditName} className="ml-2 text-gray-500 hover:text-gray-700">
                  <MdEdit size={18} />
                </button>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            This is not your username. This name will be visible to your contacts.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
          <div className="flex items-center p-3 bg-gray-100 rounded-md">
            {isEditingBio ? (
              <>
                <input
                  type="text"
                  value={bio}
                  onChange={handleBioChange}
                  className="flex-1 bg-transparent outline-none"
                  onKeyPress={(e) => e.key === "Enter" && updateProfile()}
                />
                <button onClick={updateProfile} className="ml-2 text-blue-500 hover:text-blue-700">
                  <FaCheck size={16} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1">{bio}</span>
                <button onClick={toggleEditBio} className="ml-2 text-gray-500 hover:text-gray-700">
                  <MdEdit size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <div className="p-3 bg-gray-100 rounded-md">{profileData.phone}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <div className="p-3 bg-gray-100 rounded-md">
            {profileData.city}, {profileData.state}, {profileData.country}
          </div>
        </div>
      </div>
    </div>
  )
}

