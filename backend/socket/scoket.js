const Server = require("socket.io")
const http = require("http")
const express = require("express")
const app = express()

const server = http.createServer(app)
const io = Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

const userSocketMap = {}
const userStatusMap = {}
const activeCallsMap = {}
const groupCallsMap = {}
const userGroups = {}

const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId]
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id)

  const userId = socket.handshake.query.userId
  if (userId !== "undefined") {
    userSocketMap[userId] = socket.id
    userStatusMap[userId] = "online"
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    // Notify user about any missed calls
    if (activeCallsMap[userId]) {
      socket.emit("missed-call", activeCallsMap[userId])
      delete activeCallsMap[userId]
    }
  }

  // Handle typing events
  socket.on("typing", ({ Chatid, isTyping }) => {
    const receiverSocketId = getReceiverSocketId(Chatid)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { userId, isTyping })
    }
  })

  // WebRTC Signaling for 1-to-1 calls
  socket.on("call-user", ({ to, from, callType, signal, callerName }) => {
    console.log(`Call request from ${from} to ${to}, type: ${callType}`)
    const receiverSocketId = getReceiverSocketId(to)

    if (receiverSocketId) {
      console.log(`Receiver ${to} is online, sending incoming call`)
      // Track the call
      activeCallsMap[from] = { partner: to, type: callType }
      activeCallsMap[to] = { partner: from, type: callType }

      io.to(receiverSocketId).emit("incoming-call", {
        from,
        callType,
        signal,
        callerName,
      })
    } else {
      console.log(`Receiver ${to} is offline, sending call failed`)
      // Receiver is offline
      socket.emit("call-failed", {
        to,
        reason: "user-offline",
      })
    }
  })

  socket.on("call-accepted", ({ to, from, signal, acceptorName }) => {
    console.log(`Call accepted by ${from} to ${to}`)
    const receiverSocketId = getReceiverSocketId(to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-accepted", {
        from,
        signal,
        acceptorName,
      })
    }
  })

  socket.on("call-rejected", ({ to, from, reason }) => {
    console.log(`Call rejected by ${from} to ${to}, reason: ${reason}`)
    const receiverSocketId = getReceiverSocketId(to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-rejected", { from, reason })
    }

    // Clean up call tracking
    if (activeCallsMap[from]) delete activeCallsMap[from]
    if (activeCallsMap[to]) delete activeCallsMap[to]
  })

  socket.on("end-call", ({ to, from }) => {
    console.log(`Call ended by ${from} to ${to}`)
    const receiverSocketId = getReceiverSocketId(to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-ended", { from })
    }

    // Clean up call tracking
    if (activeCallsMap[from]) delete activeCallsMap[from]
    if (activeCallsMap[to]) delete activeCallsMap[to]
  })

  socket.on("ice-candidate", ({ to, candidate }) => {
    const receiverSocketId = getReceiverSocketId(to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice-candidate", { from: userId, candidate })
    }
  })

  // Group Management
  socket.on("create-group", ({ groupId, groupName, members, createdBy }) => {
    console.log(`Group created: ${groupName} (${groupId}) by ${createdBy}`)

    // Store group info
    const group = {
      id: groupId,
      name: groupName,
      members: [...members, createdBy],
      createdBy,
      createdAt: new Date(),
    }

    // Add group to each member's groups
    group.members.forEach((memberId) => {
      if (!userGroups[memberId]) {
        userGroups[memberId] = []
      }
      userGroups[memberId].push(groupId)

      // Notify online members
      const memberSocketId = getReceiverSocketId(memberId)
      if (memberSocketId) {
        io.to(memberSocketId).emit("group-created", group)
      }
    })
  })

  socket.on("join-group", ({ groupId, userId }) => {
    // Add user to group members
    if (!userGroups[userId]) {
      userGroups[userId] = []
    }
    if (!userGroups[userId].includes(groupId)) {
      userGroups[userId].push(groupId)
    }

    // Notify user they've joined
    socket.emit("joined-group", { groupId })
  })

  socket.on("leave-group", ({ groupId, userId }) => {
    // Remove user from group
    if (userGroups[userId]) {
      userGroups[userId] = userGroups[userId].filter((id) => id !== groupId)
    }

    // Notify user they've left
    socket.emit("left-group", { groupId })
  })

  // Group Video Call Signaling
  socket.on("start-group-call", ({ groupId, from, callType }) => {
    console.log(`Group call started in ${groupId} by ${from}`)

    // Create a room for the group call
    socket.join(`group-${groupId}`)

    // Track the group call
    groupCallsMap[groupId] = {
      initiator: from,
      participants: [from],
      type: callType,
      startedAt: new Date(),
    }

    // Notify all group members
    if (userGroups) {
      Object.entries(userGroups).forEach(([memberId, groups]) => {
        if (groups.includes(groupId) && memberId !== from) {
          const memberSocketId = getReceiverSocketId(memberId)
          if (memberSocketId) {
            io.to(memberSocketId).emit("group-call-started", {
              groupId,
              from,
              callType,
            })
          }
        }
      })
    }
  })

  socket.on("join-group-call", ({ groupId, userId }) => {
    console.log(`${userId} joined group call in ${groupId}`)

    // Add user to the call room
    socket.join(`group-${groupId}`)

    // Add to participants list
    if (groupCallsMap[groupId]) {
      groupCallsMap[groupId].participants.push(userId)

      // Notify others in the call
      socket.to(`group-${groupId}`).emit("user-joined-call", {
        groupId,
        userId,
      })

      // Send current participants to the joining user
      socket.emit("group-call-participants", {
        groupId,
        participants: groupCallsMap[groupId].participants,
      })
    }
  })

  socket.on("leave-group-call", ({ groupId, userId }) => {
    console.log(`${userId} left group call in ${groupId}`)

    // Remove from room
    socket.leave(`group-${groupId}`)

    // Remove from participants
    if (groupCallsMap[groupId]) {
      groupCallsMap[groupId].participants = groupCallsMap[groupId].participants.filter((id) => id !== userId)

      // Notify others
      socket.to(`group-${groupId}`).emit("user-left-call", {
        groupId,
        userId,
      })

      // End call if no participants left
      if (groupCallsMap[groupId].participants.length === 0) {
        delete groupCallsMap[groupId]
      }
    }
  })

  socket.on("group-call-signal", ({ groupId, from, to, signal }) => {
    const receiverSocketId = getReceiverSocketId(to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("group-call-signal", {
        groupId,
        from,
        signal,
      })
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)

    // Clean up any active calls for this user
    if (activeCallsMap[userId]) {
      const partnerId = activeCallsMap[userId].partner
      const partnerSocketId = getReceiverSocketId(partnerId)

      if (partnerSocketId) {
        io.to(partnerSocketId).emit("call-ended", { from: userId, reason: "user-disconnected" })
      }

      delete activeCallsMap[userId]
      if (activeCallsMap[partnerId]) delete activeCallsMap[partnerId]
    }

    // Clean up any group calls
    if (userGroups && userGroups[userId]) {
      userGroups[userId].forEach((groupId) => {
        if (groupCallsMap[groupId] && groupCallsMap[groupId].participants.includes(userId)) {
          // Remove from participants
          groupCallsMap[groupId].participants = groupCallsMap[groupId].participants.filter((id) => id !== userId)

          // Notify others
          io.to(`group-${groupId}`).emit("user-left-call", {
            groupId,
            userId,
          })
        }
      })
    }

    delete userSocketMap[userId]
    delete userStatusMap[userId]
    io.emit("getOnlineUsers", Object.keys(userSocketMap))
  })
})

module.exports = { app, io, server, getReceiverSocketId }

