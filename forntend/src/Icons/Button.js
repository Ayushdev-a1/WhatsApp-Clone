"use client"

import { useContext } from "react"
import "./button.css"
import { IoMdLogOut } from "react-icons/io"
import { useSocketContext } from "../context/SocketContext"
import { AuthContext } from "../context/AuthContext"

export default function Button() {
  const { disconnectSocket } = useSocketContext()
  const { logout } = useContext(AuthContext)

  // const  = () => {
  //   localStorage.removeItem('token');
  //   disconnectSocket();
  // };

  return (
    <>
      <button className="Logout-Btn">
        <IoMdLogOut title="Logout" onClick={logout} />
      </button>
    </>
  )
}

