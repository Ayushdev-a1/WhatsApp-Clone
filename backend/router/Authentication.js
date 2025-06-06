const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../modals/user")
const protectUser = require("../middleware/protectUser")
const mongoose = require("mongoose")
const router = express.Router()

// Register route
router.post("/register", async (req, res) => {
  const { name, email, cpassword, password, phone, city, state, country } = req.body
  try {
    let user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ msg: "User already exists" })
    }
    if (cpassword === password) {
      const Chatid = new mongoose.Types.ObjectId()
      user = new User({ name, email, phone, cpassword, password, city, state, country, Chatid })
      const salt = await bcrypt.genSalt()
      user.password = await bcrypt.hash(password, salt)
      user.cpassword = await bcrypt.hash(cpassword, salt)
      await user.save()
      const payload = {
        user: {
          id: user.id,
        },
      }
      jwt.sign(payload, process.env.JWT_SECRET, (err, token) => {
        if (err) throw err
        res.json({ token })
      })
    } else {
      return res.status(400).json({ msg: "Password and Confirm password should be same" })
    }
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" })
    }
    const payload = {
      user: {
        id: user.id,
      },
    }
    jwt.sign(payload, process.env.JWT_SECRET, (err, token) => {
      if (err) throw err
      res.json({ token })
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
})

//getuser
router.get("/getuser", protectUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -cpassword")
    res.send(user)
  } catch (error) {
    console.error("Internal server error:", error)
    res.status(500).json({ error: "Internal Server Error frt" })
  }
})
//profile updation
router.put("/profile", protectUser, async (req, res) => {
  const { name } = req.body

  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ msg: "User not found" })

    user.name = name || user.name
    await user.save()
    res.json(user)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})
//search user
router.get("/search", protectUser, async (req, res) => {
  const { email } = req.query

  try {
    const user = await User.findOne({ email }).select("-password -cpassword -phone")
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }
    res.json({ user })
  } catch (err) {
    console.error("servor", err.message)
    res.status(500).send("Server error")
  }
})

module.exports = router

