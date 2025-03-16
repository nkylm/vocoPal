const mongoose = require("mongoose");

const SpeechDataSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  date_recorded: { type: Date, default: Date.now },
  metrics: {
    volume: { type: Number, required: true },
    pitch: { type: Number, required: true },
    speed: { type: Number, required: true },
  },
  thresholds: {
    volume_min: { type: Number, required: true },
    volume_max: { type: Number, required: true },
    pitch_min: { type: Number, required: true },
    pitch_max: { type: Number, required: true },
    speed_min: { type: Number, required: true },
    speed_max: { type: Number, required: true },
  },
  audio_notes: [
    {
      type: String,
      enum: [
        "fast",
        "slow",
        "normal-speed",
        "high-pitch",
        "low-pitch",
        "normal-pitch",
        "loud",
        "quiet",
        "normal-volume",
      ],
    },
  ],
  recording_url: { type: String }, // Store S3 file link
});

module.exports = mongoose.model("SpeechData", SpeechDataSchema);
