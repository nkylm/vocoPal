const express = require('express');
const router = express.Router();
const SpeechData = require('../db/models/speechData'); 

// GET /api/speechData/:userId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/:userId', async (req, res) => {
    console.log('/api/speechData/userId')
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        // Build the query object
        const query = { user_id: userId };

        // Add date filter if startDate or endDate is provided
        if (startDate || endDate) {
            query.date_recorded = {};
            if (startDate) {
                query.date_recorded.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date_recorded.$lte = new Date(endDate);
            }
        }

        // Query the database
        const speechData = await SpeechData.find(query).sort({ date_recorded: -1 }); // Sort by most recent

        if (speechData.length === 0) {
            return res.status(404).json({ message: 'No speechData found for the given criteria.' });
        }

        res.status(200).json(speechData);
    } catch (error) {
        console.error('Error fetching speechdata:', error);
        res.status(500).json({ error: 'Failed to fetch speechdata' });
    }
});

// POST /api/speechData
router.post('/', async (req, res) => {
    try {
        console.log('/api/speechData')
        // Extract data from the request body
        const { user_id, date_recorded, metrics, audio_url, audio_notes } = req.body;

        // Validate required fields
        if (!user_id || !metrics) {
            return res.status(400).json({ error: 'User ID and metrics are required.' });
        }

        // Create a new SpeechData instance
        const speechData = new SpeechData({
            user_id,
            date_recorded: date_recorded || new Date(), // Use the current date if none is provided
            metrics,
            audio_url,
            audio_notes
        });

        // Save the data to the database
        const savedData = await speechData.save();

        // Respond with the saved document
        res.status(201).json({
            message: 'Speech metrics added successfully.',
            data: savedData,
        });
    } catch (error) {
        console.error('Error adding speech metrics:', error);
        res.status(500).json({ error: 'Failed to add speech metrics.' });
    }
});

module.exports = router;
