import React, { useState } from "react";

export default function UploadContainer({ updateComputeState, setData }) {
  const [file, setFile] = useState(null);

  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("uploaded_file", file);

    try {
      const response = await fetch("http://localhost:5000/compute", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json(); // Process response as JSON
        console.log("File uploaded successfully:", data);
        setData(data); // Update state with the correlation data
        updateComputeState(); // Update state in the parent component
        console.log("Data in upload container:", data);
      } else {
        console.error("Error uploading file:", response.statusText);
        alert("Error uploading file");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while uploading the file");
    }
  };

  return (
    <div>
      <div class="card border-primary mb-3" >
        <div class="card-header">File upload</div>
        <div class="card-body">
          <p class="card-text">
            Upload your lung noises audio file here for processing
          </p>

          <form onSubmit={handleSubmit}>
        <div className="upload-buttons-container">
          <input type="file" onChange={handleFileChange} class="form-control" />
          <button type="submit" class="btn btn-primary">
            Compute
          </button>
        </div>
      </form>
        </div>
      </div>
      
    </div>
  );
}
