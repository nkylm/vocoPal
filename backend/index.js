const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const FormData = require("form-data");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

const app = express();
const connectDB = require("./db/db");
const authRouter = require("./routes/auth");
const speechDataRouter = require("./routes/speechData");
const thresholdsRouter = require("./routes/thresholds");
const accessRouter = require("./routes/access");
const Thresholds = require("./db/models/thresholds");

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to determine audio notes based on metrics and thresholds
const getAudioNotes = (metrics, thresholds) => {
  const notes = [];

  // Volume checks
  if (metrics.volume > thresholds.volume_max) {
    notes.push("loud");
  } else if (metrics.volume < thresholds.volume_min) {
    notes.push("quiet");
  } else {
    notes.push("normal-volume");
  }

  // Pitch checks
  if (metrics.pitch > thresholds.pitch_max) {
    notes.push("high-pitch");
  } else if (metrics.pitch < thresholds.pitch_min) {
    notes.push("low-pitch");
  } else {
    notes.push("normal-pitch");
  }

  // Speed checks
  if (metrics.speed > thresholds.speed_max) {
    notes.push("fast");
  } else if (metrics.speed < thresholds.speed_min) {
    notes.push("slow");
  } else {
    notes.push("normal-speed");
  }

  // Volume fluctuation checks
  if (metrics.volume_fluctuation > thresholds.volume_fluctuation_max) {
    notes.push("unstable-volume");
  } else {
    notes.push("stable-volume");
  }

  // Pitch fluctuation checks
  if (metrics.pitch_fluctuation > thresholds.pitch_fluctuation_max) {
    notes.push("unstable-pitch");
  } else if (metrics.pitch < thresholds.pitch_min) {
    notes.push("monotone");
  } else {
    notes.push("stable-pitch");
  }

  // Speed fluctuation checks
  if (metrics.speed_fluctuation > thresholds.speed_fluctuation_max) {
    notes.push("unstable-speed");
  } else {
    notes.push("stable-speed");
  }

  return notes;
};

// Helper function to check if metrics are outside thresholds
const isOutsideThresholds = (metrics, thresholds) => {
  return (
    metrics.volume > thresholds.volume_max ||
    metrics.volume < thresholds.volume_min ||
    metrics.pitch > thresholds.pitch_max ||
    metrics.pitch < thresholds.pitch_min ||
    metrics.speed > thresholds.speed_max ||
    metrics.speed < thresholds.speed_min ||
    metrics.volume_fluctuation > thresholds.volume_fluctuation_max ||
    metrics.pitch_fluctuation > thresholds.pitch_fluctuation_max ||
    metrics.pitch_fluctuation < thresholds.pitch_fluctuation_min ||
    metrics.speed_fluctuation > thresholds.speed_fluctuation_max 
  );
};

async function calculateFileChecksum(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const stream = fs.createReadStream(filePath);
      let checksum = 0;

      stream.on("data", (chunk) => {
        // Use the same algorithm as the ESP32 for consistency
        for (let i = 0; i < chunk.length; i++) {
          checksum = ((checksum << 1) | (checksum >> 31)) + chunk[i]; // Rotate and add
        }
      });

      stream.on("end", () => {
        resolve(checksum.toString(16)); // Convert to hex string
      });

      stream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Endpoint to upload an audio file
app.post("/api/upload", upload.single("audio"), async (req, res) => {
  try {
    // Ensure file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("req: ", req.file);

    // Get checksum from header or form field
    const expectedChecksum =
      req.headers["x-file-checksum"] || req.body.checksum;

    if (!expectedChecksum) {
      console.log("No checksum provided");
      // You can choose to continue or return an error
      // return res.status(400).json({ error: "No checksum provided" });
    } else {
      console.log("Expected checksum:", expectedChecksum);

      // Calculate checksum on the server side
      const actualChecksum = await calculateFileChecksum(req.file.path);
      console.log("Actual checksum:", actualChecksum);

      // Verify checksum (if provided)
      if (
        expectedChecksum &&
        expectedChecksum.toLowerCase() !== actualChecksum.toLowerCase()
      ) {
        console.error("Checksum mismatch!");
        console.error(
          `Expected: ${expectedChecksum}, Actual: ${actualChecksum}`,
        );
        return res.status(400).json({
          error:
            "File integrity check failed. The uploaded file may be corrupted.",
          expected: expectedChecksum,
          actual: actualChecksum,
        });
      }

      console.log("Checksum verification passed");
    }

    const audioFilePath = req.file.path;
    const audioFileName = req.file.originalname;
    const userId = "67b401b7550a00da2009bc32"; // hard coded for now

    // Get user's thresholds
    const userThresholds = await Thresholds.findOne({ user_id: userId });
    if (!userThresholds) {
      return res.status(404).json({ error: "No thresholds found for user" });
    }

    console.log("userThresholds: ", userThresholds);

    // Send the file to the Python microservice
    const microserviceUrl = process.env.FLASK_HOSTED_URL;
    const formData = new FormData();
    formData.append("audio", fs.createReadStream(audioFilePath));

    console.log("microserviceUrl: ", microserviceUrl);
    console.log("formData: ", formData);

    const response = await axios.post(microserviceUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log("response: ", response.data);

    // Prepare metrics
    const metrics = {
      volume: response.data.relative_volume,
      pitch: response.data.f0_mean,
      speed: response.data.rate_of_speech,
      volume_fluctuation: response.data.volume_fluctuation,
      pitch_fluctuation: response.data.f0_std,
      speed_fluctuation: response.data.speech_rate_fluctuation
    };

    let s3Url = null;

    // Only upload to S3 if metrics are outside thresholds
    if (isOutsideThresholds(metrics, userThresholds)) {
      const s3Key = `recordings/${uuidv4()}${audioFileName}`;
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: fs.createReadStream(audioFilePath),
        ContentType: req.file.mimetype,
      };

      await s3.send(new PutObjectCommand(uploadParams));
      s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    }

    // Get audio notes based on metrics comparison
    const audioNotes = getAudioNotes(metrics, userThresholds);

    console.log("audioNotes: ", audioNotes);

    const speechDataPayload = {
      user_id: userId,
      date_recorded: new Date(),
      metrics,
      thresholds: {
        volume_min: userThresholds.volume_min,
        volume_max: userThresholds.volume_max,
        pitch_min: userThresholds.pitch_min,
        pitch_max: userThresholds.pitch_max,
        speed_min: userThresholds.speed_min,
        speed_max: userThresholds.speed_max,
        volume_fluctuation_max: userThresholds.volume_fluctuation_max,
        pitch_fluctuation_min: userThresholds.pitch_fluctuation_min, 
        pitch_fluctuation_max: userThresholds.pitch_fluctuation_max, 
        speed_fluctuation_max: userThresholds.speed_fluctuation_max
      },
      audio_notes: audioNotes,
      recording_url: s3Url, // Will be null if within thresholds
    };

    console.log("speechDataPayload: ", speechDataPayload);

    console.log(
      "process.env.BACKEND_HOSTED_URL: ",
      process.env.BACKEND_HOSTED_URL,
    );

    const speechDataResponse = await axios.post(
      `${process.env.BACKEND_HOSTED_URL}/api/speechData`,
      speechDataPayload,
    );

    console.log("speechDataResponse: ", speechDataResponse);

    // Delete the local file after processing
    fs.unlinkSync(audioFilePath);

    // Send the response back to the client
    res.status(200).json({
      message: "Speech data processed successfully",
      speechData: speechDataResponse.data,
      isOutsideThresholds: s3Url !== null,
    });
  } catch (error) {
    console.error("Error processing audio:", error.message);
    res.status(500).json({ error: "Failed to process audio file" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/speechData", speechDataRouter);
app.use("/api/thresholds", thresholdsRouter);
app.use("/api/access", accessRouter);

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
