const express = require("express")
const Meeting = require("../modals/meeting")
const protectUser = require("../middleware/protectUser")
const { v4: uuidv4 } = require("uuid")
const router = express.Router()
const PORT = process.env.PORT || 5000
//create meeting

router.post("/create", protectUser, async (req, res) => {
  const { title, startTime, endTime } = req.body
  try {
    const link = uuidv4()

    const meeting = new Meeting({
      title,
      host: req.user.id,
      startTime,
      endTime,
      link,
    })
    await meeting.save()
    res.json({ meeting, link: `http://localhost:${PORT}/${link}` })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})
//get meetings created by the user all the way

router.get("/getmeetings", protectUser, async (req, res) => {
  try {
    const meetings = await Meeting.find({ host: req.user.id }).populate("host", "username")
    res.json(meetings)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})
//join meeting by id

router.get("/join_by_id", protectUser, async (req, res) => {
  const { id } = req.params
  try {
    const meeting = await Meeting.findById(id).populate("host", "username")
    if (!meeting) {
      return res.status(404).json({ msg: "Meeting not found" })
    }
    if (!meeting.participants.includes(req.user.id)) {
      return res.status(400).json({ msg: "You are not a participant" })
    }
    res.json(meeting)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

//join meeting

router.post("/join_by_link", protectUser, async (req, res) => {
  const { link } = req.body
  try {
    const meeting = await Meeting.findOne({ link })
    if (!meeting) {
      return res.status(404).json({ msg: "Meeting not found" })
    }
    if (meeting.participants.includes(req.user.id)) {
      return res.status(400).json({ msg: "You are already a participant" })
    }
    meeting.participants.push(req.user.id)
    await meeting.save()
    res.json(meeting)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})
//getMeeting
router.get("/getmeeting", protectUser, async (req, res) => {
  const { meetingId } = req.params
  try {
    const meeting = await Meeting.findById(meetingId).populate("host participants", "username")
    if (!meeting) return res.status(404).json({ msg: "Meeting not found" })

    res.json(meeting)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})
//delete meeting

router.delete("/delete", protectUser, async (req, res) => {
  const { meetingId } = req.body
  try {
    const meeting = await Meeting.findById(meetingId)
    if (!meeting) return res.status(404).json({ msg: "Meeting not found" })
    if (meeting.host.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" })
    }
    await meeting.remove()
    res.json({ msg: "Meeting deleted" })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})
module.exports = router

