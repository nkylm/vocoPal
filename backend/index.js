const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const FormData = require('form-data');

const app = express();
const connectDB = require('./db/db');
const authRouter = require ('./routes/auth')
const speechDataRouter = require('./routes/speechData');
const thresholdsRouter = require('./routes/thresholds'); 

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Endpoint to upload an audio file
app.post('/api/upload', upload.single('audio'), async (req, res) => {
    try {
        // Ensure file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const audioFilePath = req.file.path; // Local path to the uploaded file
        const audioFileName = req.file.originalname;

        console.log(audioFilePath)
        console.log(audioFileName)

        console.log(`Received file: ${audioFileName}`);

        // Send the file to the Python microservice
        const microserviceUrl = process.env.FLASK_HOSTED_URL || 'http://localhost:8001/process';
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(audioFilePath));

        const response = await axios.post(microserviceUrl, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        // Delete the local file after processing
        fs.unlinkSync(audioFilePath);

        // Send the response back to the client
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error processing audio:', error.message);
        res.status(500).json({ error: 'Failed to process audio file' });
    }
});

app.use('/api/auth', authRouter);
app.use('/api/speechData', speechDataRouter)
app.use('/api/thresholds', thresholdsRouter);

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
