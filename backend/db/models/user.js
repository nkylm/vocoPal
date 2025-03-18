const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define a schema for permissions
const PermissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recordings: { type: Boolean, default: false },
  accessLevel: {
    type: String,
    enum: ["Can edit", "Can view", "No access"],
    default: "No access",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending"
  }
});

// Updated UserSchema to include permissions and relations
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["patient", "therapist"], required: true },
    initials: { type: String },
    avatarColor: { type: String },
    // Initialize empty arrays for permissions
    sharedWith: { type: [PermissionSchema], default: [] },
    hasAccessTo: { type: [PermissionSchema], default: [] },
    relation: { type: String }, // e.g., 'Wife', 'Speech Therapist', etc.
  },
  { timestamps: true },
);

// Pre-save middleware to generate initials
UserSchema.pre("save", function (next) {
  if (!this.initials) {
    const nameParts = this.name.split(" ");
    if (nameParts.length >= 2) {
      this.initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      this.initials = nameParts[0].substring(0, 2).toUpperCase();
    }
  }

  // Generate random avatar color if not provided
  if (!this.avatarColor) {
    const colors = [
      "#F0C651",
      "#F5C2E0",
      "#A4CAF3",
      "#B9E5BE",
      "#FFB347",
      "#D8BFD8",
    ];
    this.avatarColor = colors[Math.floor(Math.random() * colors.length)];
  }

  // Make sure arrays are initialized
  if (!this.sharedWith) this.sharedWith = [];
  if (!this.hasAccessTo) this.hasAccessTo = [];

  next();
});

// Method to check if password matches
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
