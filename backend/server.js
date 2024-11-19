const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { execFile } = require('child_process');
const path = require('path');

const app = express();
const PORT = 5000;

// Configure multer storage to save files as .wav
const storage = multer.diskStorage({
    destination: './public/data/uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.wav');  // Save with .wav extension
    }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());

app.post('/compute', upload.single('uploaded_file'), (req, res) => {
    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    console.log(`File uploaded: ${req.file.originalname}`);
    console.log(`File path: ${req.file.path}`);
    console.log(`File size: ${req.file.size} bytes`);
    console.log(`File mime type: ${req.file.mimetype}`);

    const filePath = req.file.path; // Access the uploaded file path

    // Run the Python script with the uploaded file as an argument
    execFile('python3', ['./audio_process.py', filePath], (error, stdout, stderr) => {
        if (error) {
            console.error(`Python script error: ${stderr}`);
            return res.status(500).send(`Error executing Python script: ${stderr}`);
        }

        console.log(`Python script output: ${stdout}`);
        res.send(`Python script executed successfully: ${stdout}`);
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
