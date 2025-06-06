"use client"

import { useState } from "react"
import { IoClose } from "react-icons/io5"
import { FaCompressAlt } from "react-icons/fa"
import { MdCallEnd } from "react-icons/md"
import { AiFillSound } from "react-icons/ai"
import { FaVideoSlash } from "react-icons/fa"
import { BsMicMute } from "react-icons/bs"
import { MdOutlineScreenShare } from "react-icons/md"
import { useSocketContext } from "../context/SocketContext"
export default function CallingDialouge({ minimize, close }) {
  const { onlineUsers } = useSocketContext()
  const { callConnected, setCallConnected } = useState(false)
  return (
    <>
      <div className="Video-Call">
        <div className="closeOption">
          <ul>
            <li onClick={minimize}>
              <FaCompressAlt title="minimize" style={{ cursor: "pointer" }} />
            </li>
            <li onClick={close}>
              {" "}
              <IoClose title="close" style={{ cursor: "pointer" }} />
            </li>
          </ul>
        </div>
        <div className="calling">
          {callConnected ? (
            <></>
          ) : (
            <>
              <span className="calling-status">
                <span className="Dp">DP</span>
                <p>{onlineUsers ? "Ringing......" : "Calling......"}</p>
              </span>
            </>
          )}
        </div>
        <div className="calling-option">
          <button>
            <AiFillSound />
          </button>
          <button>
            <FaVideoSlash />
          </button>
          <button onClick={close}>
            <MdCallEnd />
          </button>
          <button>
            <MdOutlineScreenShare />
          </button>
          <button>
            <BsMicMute />
          </button>
        </div>
      </div>
    </>
  )
}

