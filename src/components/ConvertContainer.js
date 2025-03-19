import React, { useState } from 'react';

export default function ConvertContainer() {
  const [file, setFile] = useState(null);

  function handleFileChange(e) {
    setFile(e.target.files[0]); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a file to convert to .wav format');
      return;
    }

    const formData = new FormData();
    formData.append('uploaded_file', file);

    try {
      const response = await fetch('http://localhost:5000/convert', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json(); // Process response as JSON
        console.log('File uploaded successfully:', data);
        // setData(data);  // Update state with the correlation data
        // updateComputeState(); // Update state in the parent component
        console.log('Data in upload container:', data)
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
    <div>
      <form onSubmit={handleSubmit}>
        <div className="upload-buttons-container">
          <input type="file" onChange={handleFileChange} />
          <button type="submit">Convert to .wav format</button>
        </div>
      </form>
    </div>
  );
}
