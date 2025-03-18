const mongoose = require("mongoose");

const ThresholdsSchema = new mongoose.Schema({
  threshold_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Threshold",
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  volume_min: { type: Number, required: true },
  volume_max: { type: Number, required: true },
  pitch_min: { type: Number, required: true },
  pitch_max: { type: Number, required: true },
  speed_min: { type: Number, required: true },
  speed_max: { type: Number, required: true },
  volume_fluctuation_max: { type: Number, required: true },
  pitch_fluctuation_min: { type: Number, required: true },
  pitch_fluctuation_max: { type: Number, required: true },
  speed_fluctuation_max: { type: Number, required: true },
});

module.exports = mongoose.model("Thresholds", ThresholdsSchema);
