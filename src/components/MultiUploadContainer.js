import React, { useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config";
import audioService from "../services/AudioService";

export default function MultiUploadContainer({ updateComputeState, setData }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Verify file type
    if (!selectedFile.name.toLowerCase().endsWith('.wav')) {
      setError("Only .wav files are supported. Please select valid files.");
      return;
    }
    
    // Verify file count
    if (files.length >= 6) {
      setError("Maximum 6 files can be uploaded (one for each channel).");
      return;
    }
    
    // Add the new file to the existing files array
    setFiles(prevFiles => [...prevFiles, selectedFile]);
    setError(null);
    
    // Reset the file input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("uploaded_files", file);
    });

    try {
      // Use the API_URL from config instead of hardcoded localhost
      const response = await axios.post(`${API_URL}/compute-multi`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      console.log("Upload successful:", response.data);
      
      // If we have a main file (first file), use it for audio playback
      if (files.length > 0) {
        // Store the first file for audio playback 
        audioService.setUploadedFile(files[0]);
        
        // Pre-load the audio buffer for playback
        try {
          await audioService.loadAudioFromUploadedFile();
          console.log("Audio loaded successfully for playback");
        } catch (error) {
          console.error("Failed to load audio for playback:", error);
          // Continue even if audio loading fails - we'll try again when user clicks play
        }
      }
      
      setData(response.data);
      updateComputeState();
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err.response?.data || "An error occurred during upload. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Function to get channel name based on index
  const getChannelName = (index) => {
    const channelMap = {
      0: "Top Left",
      1: "Top Right", 
      2: "Middle Left",
      3: "Middle Right",
      4: "Bottom Left",
      5: "Bottom Right"
    };
    return channelMap[index] || `Channel ${index + 1}`;
  };

  return (
    <div className="multi-upload-container">
      <h3>Upload Multiple Channel Files</h3>
      <p className="text-muted">
        Upload individual .wav files (one per channel) to be combined and processed.
        Each file will be assigned to a channel in the order they are added.
        After processing, you'll be able to play back sounds by clicking on the
        detection points.
      </p>
      
      <div className="upload-buttons-container">
        <div className="file-input-container">
          <input
            type="file"
            className="form-control"
            onChange={handleFileChange}
            disabled={isUploading || files.length >= 6}
            accept=".wav"
            ref={fileInputRef}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
        >
          {isUploading ? "Uploading..." : "Process Files"}
        </button>
      </div>
      
      {files.length > 0 && (
        <div className="selected-files mt-3">
          <h5>Selected Files:</h5>
          <div className="alert alert-info">
            <strong>Important:</strong> Files will be processed in the order listed below.
            Make sure to add files in the correct order for the appropriate channel assignment.
          </div>
          <ul className="list-group">
            {files.map((file, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                <span>
                  <strong>{getChannelName(index)}:</strong> {file.name}
                </span>
                <div>
                  <span className="badge bg-primary me-2">{(file.size / 1024).toFixed(2)} KB</span>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => removeFile(index)}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isUploading && (
        <div className="progress mt-3">
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${uploadProgress}%` }}
            aria-valuenow={uploadProgress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {uploadProgress}%
          </div>
        </div>
      )}
      
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      
      <div className="channel-map mt-4">
        <h5>Channel Map:</h5>
        <div className="row">
          <div className="col-md-6">
            <ul className="list-group">
              <li className="list-group-item">File 1 → Top Left (Channel 0)</li>
              <li className="list-group-item">File 2 → Top Right (Channel 1)</li>
              <li className="list-group-item">File 3 → Middle Left (Channel 2)</li>
            </ul>
          </div>
          <div className="col-md-6">
            <ul className="list-group">
              <li className="list-group-item">File 4 → Middle Right (Channel 3)</li>
              <li className="list-group-item">File 5 → Bottom Left (Channel 4)</li>
              <li className="list-group-item">File 6 → Bottom Right (Channel 5)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}