"use client"

import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import Loader from "./Loader"
export default function Login() {
  const { login, loading } = useContext(AuthContext)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const nav = useNavigate()

  const movetoForgotpassword = () => {
    nav("/forgotpassword")
  }

  const movetoRegister = () => {
    nav("/register")
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    await login(email, password)
  }

  return (
    <>
      {loading ? (
        <>
          <Loader />
        </>
      ) : (
        <>
          <div className="LoginBox">
            <div className="loginForm">
              <form method="post" onSubmit={onSubmit}>
                <h1>Login</h1>
                <span className="formInput">
                  <input type="text" placeholder="Username" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="buttons">
                    <button type="submit" className="login">
                      Login
                    </button>
                    <p
                      style={{ color: "#FF6347", fontFamily: "cursive", display: "inline-block", cursor: "pointer" }}
                      onClick={movetoForgotpassword}
                    >
                      Forgot Password?
                    </p>
                  </span>
                </span>
                <span className="do_not_register">
                  <p>Don't have an account?</p>
                  <p
                    style={{
                      color: "#FF6347",
                      fontFamily: "cursive",
                      display: "inline-block",
                      cursor: "pointer",
                    }}
                    onClick={movetoRegister}
                  >
                    Register
                  </p>
                </span>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  )
}

