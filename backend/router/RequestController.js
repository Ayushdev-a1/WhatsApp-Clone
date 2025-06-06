const express = require("express")
const User = require("../modals/user")

const router = express.Router()

// Send request
router.post("/send", async (req, res) => {
  const { senderEmail, receiverEmail } = req.body

  if (!senderEmail || !receiverEmail || senderEmail === receiverEmail) {
    return res.status(400).json({ message: "Invalid input" })
  }
  try {
    const sender = await User.findOne({ email: senderEmail })
    const receiver = await User.findOne({ email: receiverEmail })

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" })
    }

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" })
    }

    const existingRequest = receiver.friendRequests.find(
      (request) => request.senderId.toString() === sender._id.toString(),
    )

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" })
    }

    receiver.friendRequests.push({ senderId: sender._id, receiverId: receiver._id })
    await receiver.save()

    res.status(200).json({ message: "Friend request sent" })
  } catch (error) {
    console.error("bhakkk", error)
    res.status(500).json({ message: "Server error", error })
  }
})

// Get friend requests
router.get("/getFriendRequest", async (req, res) => {
  const { email } = req.query
  try {
    const user = await User.findOne({ email }).populate("friendRequests.senderId", "email")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({ friendRequests: user.friendRequests })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error", error })
  }
})
// Respond to request
router.post("/respondToRequest", async (req, res) => {
  const { email, senderId, status } = req.body

  try {
    const user = await User.findOne({ email }).populate("friendRequests.senderId")
    const sender = await User.findById(senderId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" })
    }

    const request = user.friendRequests.find((req) => req.senderId._id.toString() === senderId)

    if (!request) {
      return res.status(404).json({ message: "Friend request not found" })
    }

    if (status === "accepted") {
      user.friends.push(sender._id)
      sender.friends.push(user._id)
      await sender.save()
    }

    user.friendRequests = user.friendRequests.filter((req) => req.senderId._id.toString() !== senderId)
    await user.save()

    res.status(200).json({ message: "Friend request updated" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error })
  }
})
// Get friends list
router.get("/getFriends", async (req, res) => {
  const { email } = req.query
  try {
    const user = await User.findOne({ email }).populate({
      path: "friends",
      select: "email name Chatid",
    })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    // user.friends.forEach(friend => console.log('Friend:', friend));
    res.status(200).json({ friends: user.friends })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error", error })
  }
})

// //getsentfriedlist
// router.get('/getFriends', async (req, res) => {
//   const { email } = req.query;
//   try {
//     const user = await User.findOne({ email }).populate('friends', 'email name');

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({ friends: user.friends });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// });

module.exports = router

