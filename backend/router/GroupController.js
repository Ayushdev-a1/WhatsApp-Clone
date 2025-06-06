const express = require("express")
const Group = require("../modals/Group")
const User = require("../modals/user")
const protectUser = require("../middleware/protectUser")
const { v4: uuidv4 } = require("uuid")
const router = express.Router()

// Create a new group
router.post("/create", protectUser, async (req, res) => {
  try {
    const { name, description, members } = req.body

    // Validate members exist
    if (members && members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } })
      if (validMembers.length !== members.length) {
        return res.status(400).json({ message: "One or more members do not exist" })
      }
    }

    // Create the group
    const group = new Group({
      name,
      description,
      creator: req.user.id,
      members: members || [],
      admins: [req.user.id],
    })

    // Add creator to members if not already included
    if (!group.members.includes(req.user.id)) {
      group.members.push(req.user.id)
    }

    await group.save()

    // Populate creator and members info
    await group.populate([
      { path: "creator", select: "name email" },
      { path: "members", select: "name email" },
      { path: "admins", select: "name email" },
    ])

    res.status(201).json(group)
  } catch (error) {
    console.error("Error creating group:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all groups for a user
router.get("/", protectUser, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user.id,
      isActive: true,
    })
      .populate([
        { path: "creator", select: "name email" },
        { path: "members", select: "name email" },
        { path: "admins", select: "name email" },
      ])
      .sort({ updatedAt: -1 })

    res.json(groups)
  } catch (error) {
    console.error("Error fetching groups:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get a specific group
router.get("/:groupId", protectUser, async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.groupId,
      members: req.user.id,
      isActive: true,
    }).populate([
      { path: "creator", select: "name email" },
      { path: "members", select: "name email" },
      { path: "admins", select: "name email" },
      { path: "messages" },
    ])

    if (!group) {
      return res.status(404).json({ message: "Group not found or you're not a member" })
    }

    res.json(group)
  } catch (error) {
    console.error("Error fetching group:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update a group
router.put("/:groupId", protectUser, async (req, res) => {
  try {
    const { name, description } = req.body

    // Find the group and check if user is an admin
    const group = await Group.findOne({
      _id: req.params.groupId,
      admins: req.user.id,
      isActive: true,
    })

    if (!group) {
      return res.status(404).json({ message: "Group not found or you're not an admin" })
    }

    // Update fields
    if (name) group.name = name
    if (description !== undefined) group.description = description

    await group.save()

    // Populate fields
    await group.populate([
      { path: "creator", select: "name email" },
      { path: "members", select: "name email" },
      { path: "admins", select: "name email" },
    ])

    res.json(group)
  } catch (error) {
    console.error("Error updating group:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Add members to a group
router.post("/:groupId/members", protectUser, async (req, res) => {
  try {
    const { members } = req.body

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "Members array is required" })
    }

    // Find the group and check if user is an admin
    const group = await Group.findOne({
      _id: req.params.groupId,
      admins: req.user.id,
      isActive: true,
    })

    if (!group) {
      return res.status(404).json({ message: "Group not found or you're not an admin" })
    }

    // Validate members exist
    const validMembers = await User.find({ _id: { $in: members } })
    if (validMembers.length !== members.length) {
      return res.status(400).json({ message: "One or more members do not exist" })
    }

    // Add new members
    members.forEach((memberId) => {
      if (!group.members.includes(memberId)) {
        group.members.push(memberId)
      }
    })

    await group.save()

    // Populate fields
    await group.populate([
      { path: "creator", select: "name email" },
      { path: "members", select: "name email" },
      { path: "admins", select: "name email" },
    ])

    res.json(group)
  } catch (error) {
    console.error("Error adding members:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Remove a member from a group
router.delete("/:groupId/members/:memberId", protectUser, async (req, res) => {
  try {
    const { memberId } = req.params

    // Find the group
    const group = await Group.findOne({
      _id: req.params.groupId,
      isActive: true,
    })

    if (!group) {
      return res.status(404).json({ message: "Group not found" })
    }

    // Check if user is an admin or removing themselves
    const isAdmin = group.admins.includes(req.user.id)
    const isSelf = req.user.id === memberId

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Not authorized to remove this member" })
    }

    // Cannot remove the creator
    if (memberId === group.creator.toString()) {
      return res.status(400).json({ message: "Cannot remove the group creator" })
    }

    // Remove from members and admins
    group.members = group.members.filter((id) => id.toString() !== memberId)
    group.admins = group.admins.filter((id) => id.toString() !== memberId)

    await group.save()

    // Populate fields
    await group.populate([
      { path: "creator", select: "name email" },
      { path: "members", select: "name email" },
      { path: "admins", select: "name email" },
    ])

    res.json(group)
  } catch (error) {
    console.error("Error removing member:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Make a member an admin
router.post("/:groupId/admins/:memberId", protectUser, async (req, res) => {
  try {
    const { memberId } = req.params

    // Find the group and check if user is an admin
    const group = await Group.findOne({
      _id: req.params.groupId,
      admins: req.user.id,
      isActive: true,
    })

    if (!group) {
      return res.status(404).json({ message: "Group not found or you're not an admin" })
    }

    // Check if member exists in the group
    if (!group.members.includes(memberId)) {
      return res.status(400).json({ message: "User is not a member of this group" })
    }

    // Add to admins if not already
    if (!group.admins.includes(memberId)) {
      group.admins.push(memberId)
      await group.save()
    }

    // Populate fields
    await group.populate([
      { path: "creator", select: "name email" },
      { path: "members", select: "name email" },
      { path: "admins", select: "name email" },
    ])

    res.json(group)
  } catch (error) {
    console.error("Error adding admin:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Remove admin status
router.delete("/:groupId/admins/:adminId", protectUser, async (req, res) => {
  try {
    const { adminId } = req.params

    // Find the group and check if user is the creator
    const group = await Group.findOne({
      _id: req.params.groupId,
      creator: req.user.id,
      isActive: true,
    })

    if (!group) {
      return res.status(404).json({ message: "Group not found or you're not the creator" })
    }

    // Cannot remove creator as admin
    if (adminId === group.creator.toString()) {
      return res.status(400).json({ message: "Cannot remove creator as admin" })
    }

    // Remove from admins
    group.admins = group.admins.filter((id) => id.toString() !== adminId)
    await group.save()

    // Populate fields
    await group.populate([
      { path: "creator", select: "name email" },
      { path: "members", select: "name email" },
      { path: "admins", select: "name email" },
    ])

    res.json(group)
  } catch (error) {
    console.error("Error removing admin:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete (deactivate) a group
router.delete("/:groupId", protectUser, async (req, res) => {
  try {
    // Find the group and check if user is the creator
    const group = await Group.findOne({
      _id: req.params.groupId,
      creator: req.user.id,
      isActive: true,
    })

    if (!group) {
      return res.status(404).json({ message: "Group not found or you're not the creator" })
    }

    // Deactivate the group
    group.isActive = false
    await group.save()

    res.json({ message: "Group deleted successfully" })
  } catch (error) {
    console.error("Error deleting group:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router