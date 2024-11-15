import React from 'react';

export default function UploadContainer() {
  return (
    <form action='http://localhost:5000/compute' encType="multipart/form-data" method="post">
      <div className="upload-buttons-container">
        <input type="file" name="uploaded_file_one" />
        <input type="file" name="uploaded_file_two" />
      </div>
      <input type="submit" value="Upload Files" className="btn btn-default" />
    </form>
  );
}
