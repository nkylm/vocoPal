const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: {type: String, required: true},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: [{ type: String, enum: ['patient', 'therapist']}],
    linked_users: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
