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

  console.log("/share: ", req.body);

  try {
    // Find the current user (who is sharing)
    const currentUser = await User.findById(req.user);

    console.log("currentUser: ", currentUser);

    // Make sure current user is a patient
    if (currentUser.role !== "patient") {
      return res
        .status(403)
        .json({ message: "Only patients can share their metrics" });
    }

    // Find the user to share with
    const targetUser = await User.findOne({ email });

    console.log("targetUser: ", targetUser);

    if (!targetUser) {
      return res
        .status(404)
        .json({ message: "User not found with this email" });
    }

    // Ensure arrays exist
    if (!currentUser.sharedWith) currentUser.sharedWith = [];
    if (!targetUser.hasAccessTo) targetUser.hasAccessTo = [];

    // Check if already shared
    const alreadyShared = currentUser.sharedWith.some(
      (p) => p.userId && p.userId.toString() === targetUser._id.toString(),
    );

    if (alreadyShared) {
      // Update existing permission
      currentUser.sharedWith = currentUser.sharedWith.map((p) => {
        if (p.userId && p.userId.toString() === targetUser._id.toString()) {
          return {
            ...p,
            analytics,
            recordings,
            accessLevel,
          };
        }
        return p;
      });

      // Update corresponding entry in targetUser
      if (targetUser.hasAccessTo) {
        targetUser.hasAccessTo = targetUser.hasAccessTo.map((p) => {
          if (p.userId && p.userId.toString() === currentUser._id.toString()) {
            return {
              ...p,
              analytics,
              recordings,
              accessLevel,
            };
          }
          return p;
        });
      }
    } else {
      // Add new permission
      currentUser.sharedWith.push({
        userId: targetUser._id,
        analytics,
        recordings,
        accessLevel,
      });

      // Update target user's hasAccessTo array
      targetUser.hasAccessTo.push({
        userId: currentUser._id,
        analytics,
        recordings,
        accessLevel,
      });

      // Set relation if provided
      if (relation && !targetUser.relation) {
        targetUser.relation = relation;
      }
    }

    await targetUser.save();
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
