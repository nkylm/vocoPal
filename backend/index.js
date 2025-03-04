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

// Endpoint to upload an audio file
app.post("/api/upload", upload.single("audio"), async (req, res) => {
  try {
    // Ensure file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const audioFilePath = req.file.path; // Local path to the uploaded file
    const audioFileName = req.file.originalname;
    const s3Key = `recordings/${uuidv4()}${audioFileName}`;

    console.log(audioFilePath);
    console.log(audioFileName);

    console.log(`Received file: ${audioFileName}`);

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: fs.createReadStream(audioFilePath),
      ContentType: req.file.mimetype,
    };

    console.log("uploadParams: ", uploadParams);

    // Upload file to S3
    await s3.send(new PutObjectCommand(uploadParams));

    // Generate the S3 URL
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    console.log("s3url", s3Url);

    // Send the file to the Python microservice
    const microserviceUrl = "http://localhost:8001/process";
    const formData = new FormData();
    formData.append("audio", fs.createReadStream(audioFilePath));

    const response = await axios.post(microserviceUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log(response);

    const speechDataPayload = {
      user_id: "67b401b7550a00da2009bc32", // hard coded for now
      date_recorded: new Date(),
      metrics:
        {
          volume: 65, // hard coded for now
          pitch: response.data.f0_mean,
          speed: response.data.rate_of_speech,
        } || {}, // Ensure metrics are included
      audio_notes: response.data.audio_notes || "normal", // Optional notes
      recording_url: s3Url, // Store S3 URL in speechData
    };

    console.log("speechDataPayload: ", speechDataPayload);

    const speechDataResponse = await axios.post(
      "http://localhost:8000/api/speechData",
      speechDataPayload,
    );

    console.log("speechDataResponse: ", speechDataResponse.data);

    // Delete the local file after processing
    fs.unlinkSync(audioFilePath);

    // Send the response back to the client
    res.status(200).json({
      message: "File uploaded and speech data saved successfully",
      speechData: speechDataResponse.data,
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
