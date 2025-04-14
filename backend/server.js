const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

// Enable CORS for all routes to allow cross-origin requests
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'], // Allow only GET and POST methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
}));

app.use(express.json());

// Serve static files from the public folder
app.use(express.static('public'));

// Helper function to extract JSON from Python output
function extractJsonFromPythonOutput(stdout) {
    // Find the last occurrence of multiple consecutive JSON arrays
    // This looks for the pattern that matches our specific Python output format
    const jsonMatch = stdout.match(/\[\[.*\]\]/s);
    
    if (!jsonMatch) {
        throw new Error('Could not find valid JSON array in Python output');
    }
    
    let jsonString = jsonMatch[0];
    
    // Debug logging to identify potential issues
    console.log("Extracted JSON string starts with:", jsonString.substring(0, 50));
    console.log("First 10 characters as hex:", Array.from(jsonString.substring(0, 10)).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' '));
    
    // Remove any BOM or invisible characters at the beginning
    jsonString = jsonString.replace(/^\uFEFF/, '');
    
    // Try to clean up the JSON string
    jsonString = jsonString.trim();
    
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON parse error:", e.message);
        console.error("First 50 characters of attempted JSON:", jsonString.substring(0, 50));
        
        // Last resort: Try a more aggressive cleaning approach
        // Remove any non-standard whitespace characters
        jsonString = jsonString.replace(/[\s\uFEFF\xA0]+/g, ' ');
        
        // Ensure proper array format
        jsonString = jsonString.replace(/^\s*\[\s*\[/, '[[').replace(/\]\s*\]\s*$/, ']]');
        
        try {
            return JSON.parse(jsonString);
        } catch (finalError) {
            console.error("Final JSON parse attempt failed:", finalError.message);
            
            // If we still can't parse it, try a manual regex-based approach
            // This is a last resort method to handle potential malformed JSON
            const crackleRegex = /\[\[{"channel".*?\]\]/s;
            const lastResortMatch = stdout.match(crackleRegex);
            
            if (lastResortMatch) {
                console.log("Using regex-based JSON extraction as last resort");
                return JSON.parse(lastResortMatch[0]);
            }
            
            throw new Error('Failed to parse JSON after multiple attempts');
        }
    }
}

// Updated compute endpoint to properly extract JSON from Python output
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
    
        // Log the raw output from Python for debugging
        console.log("Raw Python output:", stdout);
        
        try {
            const jsonResponse = extractJsonFromPythonOutput(stdout);
            console.log("Parsed JSON response:", jsonResponse);
            res.json(jsonResponse);
        } catch (parseError) {
            console.error('Error parsing Python response:', parseError);
            return res.status(500).send(`Error parsing Python response: ${parseError.message}`);
        }
    });
});

// Updated compute-multi endpoint to properly extract JSON from Python output
app.post('/compute-multi', upload.array('uploaded_files', 6), (req, res) => {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded');
    }
    
    // Check if we have the right number of files (1-6 channels)
    if (req.files.length > 6) {
        return res.status(400).send('Too many files. Maximum 6 channels allowed.');
    }

    console.log(`${req.files.length} files uploaded`);
    req.files.forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.originalname}, Size: ${file.size} bytes`);
    });
    
    // Get paths for all uploaded files
    const filePaths = req.files.map(file => file.path);
    
    // Create a temporary output file path
    const outputFilePath = path.join('./public/data/uploads/', `combined-${Date.now()}.wav`);
    
    console.log('Files to combine:', filePaths);
    console.log('Output path:', outputFilePath);
    
    // First, combine the wav files using a Python script
    execFile('python3', ['./combine_wav.py', outputFilePath, ...filePaths], (error, stdout, stderr) => {
        if (error) {
            console.error(`Error combining wav files: ${stderr}`);
            console.error(`Python output: ${stdout}`);
            return res.status(500).send(`Error combining wav files: ${stderr}`);
        }
        
        console.log("Files combined successfully. Python output:", stdout);
        
        // Now process the combined file with the main audio_process.py script
        execFile('python3', ['./audio_process.py', outputFilePath], (error, stdout, stderr) => {
            if (error) {
                console.error(`Python script error: ${stderr}`);
                console.error(`Python output: ${stdout}`);
                
                // Cleanup the temp file
                fs.unlink(outputFilePath, (err) => {
                    if (err) console.error(`Error deleting temporary file: ${err}`);
                });
                
                return res.status(500).send(`Error executing Python script: ${stderr}`);
            }
            
            // Log the raw output from Python for debugging
            console.log("Raw Python output:", stdout);
            
            try {
                const jsonResponse = extractJsonFromPythonOutput(stdout);
                console.log("Parsed JSON response:", jsonResponse);
                
                // Cleanup the temp file
                fs.unlink(outputFilePath, (err) => {
                    if (err) console.error(`Error deleting temporary file: ${err}`);
                });
                
                res.json(jsonResponse);
            } catch (parseError) {
                console.error('Error parsing Python response:', parseError);
                
                // Cleanup the temp file
                fs.unlink(outputFilePath, (err) => {
                    if (err) console.error(`Error deleting temporary file: ${err}`);
                });
                
                return res.status(500).send(`Error parsing Python response: ${parseError.message}`);
            }
        });
    });
});

// To process data and convert them to .wav format
app.post('/convert', upload.single('uploaded_file'), (req, res) => {
    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    console.log(`File uploaded: ${req.file.originalname}`);
    console.log(`File path: ${req.file.path}`);
    console.log(`File size: ${req.file.size} bytes`);
    console.log(`File mime type: ${req.file.mimetype}`);

    const filePath = req.file.path; // Access the uploaded file path

    // Just return success for now since the conversion functionality is not implemented
    res.json({ success: true, message: 'File uploaded successfully', file: req.file.originalname });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    
    // Print all available network interfaces for easy access
    const networkInterfaces = os.networkInterfaces();
    console.log('Server is accessible at:');
    
    // Local access
    console.log(`- Local: http://localhost:${PORT}`);
    
    // Network access
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`- Network: http://${iface.address}:${PORT}`);
            }
        });
    });
});