const express = require("express");
const router = express.Router();
const SpeechData = require("../db/models/speechData");
const authMiddleware = require("../util/authMiddleware");

// GET /api/speechData/:userId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/:patientId", authMiddleware, async (req, res) => {
  console.log("/api/speechData/:patientId");

  try {
    const { patientId } = req.params;
    const { startDate, endDate } = req.query;

    console.log("Requested Patient ID:", patientId);

    // Build query object
    const query = { user_id: patientId };

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

    console.log("Query:", query);

    // Query the database
    const speechData = await SpeechData.find(query).sort({ date_recorded: -1 });

    if (!speechData.length) {
      return res
        .status(404)
        .json({ message: "No speech data found for the given criteria." });
    }

    res.status(200).json(speechData);
  } catch (error) {
    console.error("Error fetching speech data:", error);
    res.status(500).json({ error: "Failed to fetch speech data" });
  }
});

// POST /api/speechData
router.post("/", async (req, res) => {
  try {
    console.log("/api/speechData");
    // Extract data from the request body
    const { user_id, date_recorded, metrics, audio_url, audio_notes } =
      req.body;

    // Validate required fields
    if (!user_id || !metrics) {
      return res
        .status(400)
        .json({ error: "User ID and metrics are required." });
    }

    // Create a new SpeechData instance
    const speechData = new SpeechData({
      user_id,
      date_recorded: date_recorded || new Date(), // Use the current date if none is provided
      metrics,
      audio_url,
      audio_notes,
    });

    // Save the data to the database
    const savedData = await speechData.save();

    // Respond with the saved document
    res.status(201).json({
      message: "Speech metrics added successfully.",
      data: savedData,
    });
  } catch (error) {
    console.error("Error adding speech metrics:", error);
    res.status(500).json({ error: "Failed to add speech metrics." });
  }
});

router.get("/:userId/videos", async (req, res) => {
    try {
      const { userId } = req.params;
  
      const videos = await SpeechData.find({ user_id: userId }).sort({ date_recorded: -1 });
  
      if (!videos.length) {
        return res.status(404).json({ message: "No recordings found for this user" });
      }
  
      res.status(200).json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error.message);
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });
  

module.exports = router;
