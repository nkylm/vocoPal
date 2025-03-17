const express = require("express");
const router = express.Router();
const User = require("../db/models/user");
const authMiddleware = require("../util/authMiddleware"); // Assuming you have auth middleware

// Get list of users with whom the current user has shared data
router.get("/shared-with", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user).populate(
      "sharedWith.userId",
      "name email role initials avatarColor relation",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ sharedWith: user.sharedWith || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get list of users who shared their data with the current user
router.get("/has-access-to", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user).populate(
      "hasAccessTo.userId",
      "name email role initials avatarColor relation",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ hasAccessTo: user.hasAccessTo || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Share data with a user by email
router.post("/share", authMiddleware, async (req, res) => {
  const { email, analytics, recordings, accessLevel, relation } = req.body;

  try {
    const currentUser = await User.findById(req.user);
    if (currentUser.role !== "patient") {
      return res.status(403).json({ message: "Only patients can share their metrics" });
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Check if already shared
    const alreadyShared = currentUser.sharedWith.some(
      (p) => p.userId && p.userId.toString() === targetUser._id.toString()
    );

    if (alreadyShared) {
      return res.status(400).json({ message: "Already shared with this user" });
    }

    // Add new pending permission
    currentUser.sharedWith.push({
      userId: targetUser._id,
      analytics,
      recordings,
      accessLevel,
      status: "pending"  // Set initial status as pending
    });

    // Add to target user's hasAccessTo array
    targetUser.hasAccessTo.push({
      userId: currentUser._id,
      analytics,
      recordings,
      accessLevel,
      status: "pending"  // Set initial status as pending
    });

    if (relation && !targetUser.relation) {
      targetUser.relation = relation;
    }

    await targetUser.save();
    await currentUser.save();

    res.json({
      message: "Access request sent successfully",
      sharedWith: currentUser.sharedWith
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add new endpoint to handle accept/decline requests
router.post("/respond-to-request", authMiddleware, async (req, res) => {
  const { patientId, response } = req.body;

  try {
    const therapist = await User.findById(req.user);
    const patient = await User.findById(patientId);

    if (!therapist || !patient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update therapist's hasAccessTo
    const therapistAccessIndex = therapist.hasAccessTo.findIndex(
      p => p.userId.toString() === patientId
    );

    if (therapistAccessIndex === -1) {
      return res.status(404).json({ message: "Request not found" });
    }

    therapist.hasAccessTo[therapistAccessIndex].status = response;

    // Update patient's sharedWith
    const patientShareIndex = patient.sharedWith.findIndex(
      p => p.userId.toString() === therapist._id.toString()
    );

    if (patientShareIndex !== -1) {
      patient.sharedWith[patientShareIndex].status = response;
    }

    await therapist.save();
    await patient.save();

    res.json({ message: `Request ${response} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update permissions for a specific user
router.put("/permissions/:userId", authMiddleware, async (req, res) => {
  const { analytics, recordings, accessLevel } = req.body;
  const { userId } = req.params;

  try {
    const currentUser = await User.findById(req.user);

    // Ensure sharedWith array exists
    if (!currentUser.sharedWith) currentUser.sharedWith = [];

    // Find the permission in sharedWith array
    const permissionIndex = currentUser.sharedWith.findIndex(
      (p) => p.userId && p.userId.toString() === userId,
    );

    if (permissionIndex === -1) {
      return res.status(404).json({ message: "Permission not found" });
    }

    // Update the permission
    currentUser.sharedWith[permissionIndex].analytics = analytics;
    currentUser.sharedWith[permissionIndex].recordings = recordings;
    currentUser.sharedWith[permissionIndex].accessLevel = accessLevel;

    // Also update the corresponding hasAccessTo entry for the target user
    const targetUser = await User.findById(userId);

    if (targetUser) {
      // Ensure hasAccessTo array exists
      if (!targetUser.hasAccessTo) targetUser.hasAccessTo = [];

      const targetPermissionIndex = targetUser.hasAccessTo.findIndex(
        (p) => p.userId && p.userId.toString() === currentUser._id.toString(),
      );

      if (targetPermissionIndex !== -1) {
        targetUser.hasAccessTo[targetPermissionIndex].analytics = analytics;
        targetUser.hasAccessTo[targetPermissionIndex].recordings = recordings;
        targetUser.hasAccessTo[targetPermissionIndex].accessLevel = accessLevel;

        await targetUser.save();
      }
    }

    await currentUser.save();

    res.json({
      message: "Permission updated successfully",
      sharedWith: currentUser.sharedWith,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove access for a user
router.delete("/permissions/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const currentUser = await User.findById(req.user);

    // Ensure sharedWith array exists
    if (!currentUser.sharedWith) currentUser.sharedWith = [];

    // Filter out the permission for the specified user
    currentUser.sharedWith = currentUser.sharedWith.filter(
      (p) => !p.userId || p.userId.toString() !== userId,
    );

    // Also remove the corresponding hasAccessTo entry for the target user
    const targetUser = await User.findById(userId);

    if (targetUser) {
      // Ensure hasAccessTo array exists
      if (!targetUser.hasAccessTo) targetUser.hasAccessTo = [];

      targetUser.hasAccessTo = targetUser.hasAccessTo.filter(
        (p) => !p.userId || p.userId.toString() !== currentUser._id.toString(),
      );

      await targetUser.save();
    }

    await currentUser.save();

    res.json({
      message: "Permission removed successfully",
      sharedWith: currentUser.sharedWith,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
