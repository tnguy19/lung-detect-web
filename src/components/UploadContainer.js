import React, { useState } from "react";
import axios from "axios";
import MultiUploadContainer from "./MultiUploadContainer";

export default function UploadContainer({ updateComputeState, setData, setUploadedFileUrl }) {
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
      // Store file URL for audio playback
      const fileUrl = URL.createObjectURL(file);
      setUploadedFileUrl(fileUrl);
      
      const response = await axios.post("http://localhost:5000/compute", formData, {
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
      setData(response.data);
      updateComputeState();
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err.response?.data || "An error occurred during upload. Please try again."
      );
      // Clear the file URL if upload fails
      setUploadedFileUrl(null);
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
              for analysis.
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
          setUploadedFileUrl={setUploadedFileUrl}
        />
      )}
    </div>
  );
}