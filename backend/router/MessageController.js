const express = require("express")
const router = express.Router()
const multer = require("multer")
const Message = require("../modals/message")
const protectUser = require("../middleware/protectUser")
const Conversation = require("../modals/Conversation")
const { io, getReceiverSocketId } = require("../socket/scoket")

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

const upload = multer({ storage: storage })

// Send message with file
router.post("/sendMessage", protectUser, upload.single("file"), async (req, res) => {
  try {
    const { message } = req.body
    const { id } = req.query
    const senderID = req.user.id
    const file = req.file

    let conversation = await Conversation.findOne({
      $or: [{ participants: { $all: [id, senderID] } }, { participants: { $all: [senderID, id] } }],
    })

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [id, senderID],
      })
    }

    const newMessage = new Message({
      senderID,
      id,
      message: message || null,
      file: file ? file.path : null,
    })

    if (newMessage) {
      conversation.messages.push(newMessage._id)
    }

    await Promise.all([conversation.save(), newMessage.save()])

    const receiverSocketId = getReceiverSocketId(id)

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage)
    }

    res.status(201).json(newMessage)
  } catch (error) {
    console.error("Internal Server Error:", error)
    res.status(500).json({ message: "Internal Server Error", error })
  }
})

// Get messages
router.get("/getMessage", protectUser, async (req, res) => {
  try {
    const { id } = req.query
    const senderID = req.user.id

    const conversation = await Conversation.findOne({
      $or: [{ participants: { $all: [id, senderID] } }, { participants: { $all: [senderID, id] } }],
    }).populate("messages")

    if (!conversation) {
      return res.status(200).json([])
    }

    const messages = conversation.messages
    res.status(200).json(messages)
  } catch (error) {
    console.error("Internal Server Error:", error)
    res.status(500).json({ message: "Internal Server Error", error })
  }
})

module.exports = router

