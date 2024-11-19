import React, { useState } from 'react';

export default function UploadContainer({ updateComputeState }) {
  const [file, setFile] = useState(null);

  function handleFileChange(e) {
    setFile(e.target.files[0]); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('uploaded_file', file);

    try {
      const response = await fetch('http://localhost:5000/compute', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.text(); // Process response data if needed
        console.log('File uploaded successfully:', data);
        updateComputeState(); // Update state in the parent component
      } else {
        console.error('Error uploading file:', response.statusText);
        alert('Error uploading file');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while uploading the file');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="upload-buttons-container">
        <input type="file" name="uploaded_file" onChange={handleFileChange} />
      </div>
      <input type="submit" value="Upload File" className="btn btn-default" />
    </form>
  );
}
