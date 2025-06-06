const jwt = require("jsonwebtoken")
const User = require("../modals/user")
const protectUser = async (req, res, next) => {
  const token = req.header("Authorization")

  if (!token) {
    return res.status(401).json({ error: "Please provide valid credentials" })
  }
  try {
    const data = jwt.verify(token, process.env.jwt_secret)
    if (!data) {
      return res.status(401).json({ error: "Invalid token" })
    }
    const user = await User.findById(data.user.id)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    req.user = user
    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." })
    }
    res.status(500).json({ error: "Internal Server Error", error })
    console.log(error)
  }
}

module.exports = protectUser

