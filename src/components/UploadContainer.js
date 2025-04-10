import React, { useState } from "react";
import axios from "axios";
import MultiUploadContainer from "./MultiUploadContainer";
import { API_URL } from "../config";
import audioService from "../services/AudioService";

export default function UploadContainer({ updateComputeState, setData }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("single"); // 'single' or 'multi'

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Verify file type
      if (!selectedFile.name.toLowerCase().endsWith('.wav')) {
        setError("Only .wav files are supported. Please select a valid file.");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      
      // Save the file to the audio service for later playback
      audioService.setUploadedFile(selectedFile);
      
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("uploaded_file", file);

    try {
      // Use the API_URL from config instead of hardcoded localhost
      const response = await axios.post(`${API_URL}/compute`, formData, {
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
      
      // Pre-load the audio buffer for playback
      try {
        await audioService.loadAudioFromUploadedFile();
        console.log("Audio loaded successfully for playback");
      } catch (error) {
        console.error("Failed to load audio for playback:", error);
        // Continue even if audio loading fails - we'll try again when user clicks play
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
  
  // Toggle between single file and multi-file upload
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
  };

  return (
    <div className="upload-container">
      <h2>Lung Sound Analysis</h2>
      
      {/* Tab navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'single' ? 'active' : ''}`} 
            onClick={() => handleTabChange('single')}
          >
            Single Multi-Channel File
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'multi' ? 'active' : ''}`} 
            onClick={() => handleTabChange('multi')}
          >
            Multiple Single-Channel Files
          </button>
        </li>
      </ul>
      
      {/* Tab content */}
      {activeTab === 'single' ? (
        <>
          <div className="upload-instructions">
            <p>
              Upload a multi-channel .wav file containing lung sound recordings
              for analysis. You'll be able to play back sounds by clicking on the
              detection points after analysis.
            </p>
          </div>
          
          <div className="upload-buttons-container">
            <div className="file-input-container">
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
                disabled={isUploading}
                accept=".wav"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={isUploading || !file}
            >
              {isUploading ? "Uploading..." : "Process File"}
            </button>
          </div>
          
          {file && (
            <div className="selected-file mt-3">
              <h5>Selected File:</h5>
              <div className="card">
                <div className="card-body">
                  <h6 className="card-title">{file.name}</h6>
                  <p className="card-text">Size: {(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
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
        </>
      ) : (
        <MultiUploadContainer 
          updateComputeState={updateComputeState} 
          setData={setData} 
        />
      )}
    </div>
  );
}