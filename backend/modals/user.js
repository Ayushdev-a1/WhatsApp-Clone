const mongoose = require("mongoose")

const Schema = mongoose.Schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  Chatid: { type: mongoose.Schema.Types.ObjectId, unique: true, ref: "User" },
  friendRequests: [
    {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    },
  ],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  password: { type: String, required: true },
  cpassword: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  date: { type: Date, default: Date.now },
})

const User = mongoose.model("User", UserSchema)

module.exports = User

