const mongoose = require('mongoose');

const SpeechDataSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    date_recorded: { type: Date, default: Date.now },
    metrics: {
        volume: { type: Number, required: true },
        pitch_mean: { type: Number, required: true },
        speech_rate: { type: Number, required: true }
    },
    audio_url: { type: String }, // Optional highlight clip URL
    audio_notes: [{ type: String, enum: ['fast', 'slow', 'high pitch', 'low pitch', 'loud', 'quiet', 'normal'] }]
});

module.exports = mongoose.model('SpeechData', SpeechDataSchema);
