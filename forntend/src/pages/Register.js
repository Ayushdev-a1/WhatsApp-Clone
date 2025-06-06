"use client"

import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import image from "../assets/imageR2.png"
import Loader from "./Loader"

export default function Register() {
  const navigate = useNavigate()
  const { register, loading } = useContext(AuthContext)

  const [email, setEmail] = useState("")
  const [showNextInput, setNextInput] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [password, setPassword] = useState("")
  const [cpassword, setCpassword] = useState("")

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
  }

  const handleChange = (setter) => (e) => {
    setter(e.target.value)
  }

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isEmailValid = isValidEmail(email)

  const nextInputs = (e) => {
    e.preventDefault()
    if (isEmailValid) {
      setNextInput(true)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    await register(email, name, phone, country, state, city, password, cpassword)
  }

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className="registerBox">
          <div className="image">
            <img src={image} alt="image" />
            <h1>Watch & chat ∼ Watcher</h1>
          </div>
          <div className="register">
            <h1>Let's Get Started</h1>
            <form method="post" onSubmit={onSubmit}>
              {showNextInput ? (
                <>
                  <div className="Next_inputs">
                    <div className="name">
                      <input
                        type="text"
                        name="name"
                        value={name}
                        id="name"
                        placeholder="Name"
                        onChange={handleChange(setName)}
                      />
                    </div>
                    <div className="otherfields">
                      <input
                        type="text"
                        name="phone"
                        value={phone}
                        id="phone"
                        placeholder="Phone"
                        onChange={handleChange(setPhone)}
                      />
                      <input
                        type="text"
                        name="country"
                        value={country}
                        id="country"
                        placeholder="Country"
                        onChange={handleChange(setCountry)}
                      />
                      <input
                        type="text"
                        name="state"
                        id="state"
                        value={state}
                        placeholder="State"
                        onChange={handleChange(setState)}
                      />
                      <input
                        type="text"
                        name="city"
                        id="city"
                        value={city}
                        placeholder="City"
                        onChange={handleChange(setCity)}
                      />
                    </div>
                    <div className="passwordSection">
                      <input
                        type="password"
                        name="password"
                        value={password}
                        id="password"
                        placeholder="Password"
                        onChange={handleChange(setPassword)}
                      />
                      <input
                        type="password"
                        name="cpassword"
                        value={cpassword}
                        id="cpassword"
                        placeholder="Confirm Password"
                        onChange={handleChange(setCpassword)}
                      />
                    </div>
                    <button className="continue" type="submit">
                      Register
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Email"
                    value={email}
                    onChange={handleEmailChange}
                  />
                  <button
                    className="continue"
                    onClick={nextInputs}
                    style={{ backgroundColor: isEmailValid ? "" : "#b6adad" }}
                    disabled={!isEmailValid}
                  >
                    Continue
                  </button>
                  <span className="terms">
                    <p>By proceeding, I agree to Watcher's Privacy Statement and Terms of Service.</p>
                  </span>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}

