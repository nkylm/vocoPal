const express = require('express');
const router = express.Router();
const Thresholds = require('../db/models/thresholds'); // Import your Thresholds model
const mongoose = require('mongoose');
const authMiddleware = require('../util/authMiddleware');

// GET: Fetch thresholds for a specific user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user;

        console.log(userId)
        
        // Fetch thresholds for the given user_id
        const thresholds = await Thresholds.find({ user_id: userId })
        if (!thresholds.length) {
            return res.status(404).json({ message: 'No thresholds found for this user' });
        }

        console.log('thresholds: ', thresholds)

        res.status(200).json(thresholds);
    } catch (error) {
        console.error('Error fetching thresholds:', error.message);
        res.status(500).json({ error: 'Failed to fetch thresholds' });
    }
});

// POST: Add new thresholds for a specific user
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            volume_min,
            volume_max,
            pitch_min,
            pitch_max,
            speed_min,
            speed_max,
        } = req.body;

        const user_id = req.user

        // Validate required fields
        if (!user_id || volume_min == null || volume_max == null || pitch_min == null || pitch_max == null || speed_min == null || speed_max == null) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if thresholds already exist for the user
        const existingThreshold = await Thresholds.findOne({ user_id });

        if (existingThreshold) {
            // Update the existing thresholds
            existingThreshold.volume_min = volume_min;
            existingThreshold.volume_max = volume_max;
            existingThreshold.pitch_min = pitch_min;
            existingThreshold.pitch_max = pitch_max;
            existingThreshold.speed_min = speed_min;
            existingThreshold.speed_max = speed_max;

            const updatedThreshold = await existingThreshold.save();
            return res.status(200).json({
                message: 'Thresholds updated successfully',
                thresholds: updatedThreshold,
            });
        } else {
            // Create new thresholds
            const newThreshold = new Thresholds({
                threshold_id: new mongoose.Types.ObjectId(), // Generate a new ObjectId for threshold_id
                user_id,
                volume_min,
                volume_max,
                pitch_min,
                pitch_max,
                speed_min,
                speed_max,
            });

            const savedThreshold = await newThreshold.save();
            return res.status(201).json({
                message: 'Thresholds created successfully',
                thresholds: savedThreshold,
            });
        }
    } catch (error) {
        console.error('Error adding/updating thresholds:', error.message);
        res.status(500).json({ error: 'Failed to add or update thresholds' });
    }
});


module.exports = router;
