//meeting schema

const mongoose = require("mongoose")

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  link: { type: String, required: true, unique: true },
})

const Meeting = mongoose.model("Meeting", meetingSchema)

module.exports = Meeting

