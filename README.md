# LungDetect

A web application for lung sound analysis that processes multi-channel audio recordings to detect and visualize crackle families

## Features

- Upload and analyze multi-channel WAV files
- Upload individual channel WAV files that will be combined for analysis
- Visualize detected crackle families
- View detailed cross-correlation data
- Access the application from other devices on the local network

## Setup and Installation

### Prerequisites

- Node.js (v14+)
- Python 3.6+
- Required Python libraries: librosa, numpy, scipy, soundfile

### Backend Setup

1. Fork and Clone the repository on your local machine:
   ```
   git clone https://github.com/yourusername/lung-detect.git
   cd lung-detect
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Install Python dependencies:
   ```
   pip install librosa numpy scipy soundfile matplotlib
   ```

4. Create uploads directory if it doesn't exist:
   ```
   mkdir -p public/data/uploads
   ```

### Frontend Setup

1. Install dependencies:
   ```
   npm install
   ```

## Running the Application

### Development Mode

1. Start the backend server:
   ```
   node server
   ```

2. Start the frontend development server:
   ```
   npm start
   ```

3. Access the application:
   - Locally: `http://localhost:3000`
   - From other devices on the network: `http://YOUR_IP_ADDRESS:3000`

### Production Mode

1. Build the frontend:
   ```
   npm run build
   ```

2. Install a static file server:
   ```
   npm install -g serve
   ```

3. Serve the built files:
   ```
   serve -s build -l 3000
   ```

4. Start the backend server:
   ```
   node server
   ```

5. Access the application:
   - Locally: `http://localhost:3000`
   - From other devices on the network: `http://YOUR_IP_ADDRESS:3000`

## Network Access

To allow other computers on your local network to access the application:

1. Find your computer's IP address:
   - On macOS/Linux: `ifconfig` or `ip addr`
   - On Windows: `ipconfig`

2. Make sure your firewall allows incoming connections on ports 3000 (frontend) and 5000 (backend)

3. Other computers on the network can access your app at:
   `http://YOUR_IP_ADDRESS:3000`

## File Structure

```
lung-detect/
├── backend/
│   ├── audio_process.py  # Main audio processing script
│   ├── combine_wav.py    # Script to combine multiple WAV files
│   ├── server.js         # Express backend server
│   ├── public/data/
│   │   └── uploads/  # Upload directory (not tracked in git)
├── src/
│   ├── components/
│   │   ├── LungVisualization.js
│   │   ├── MultiUploadContainer.js
│   │   ├── UploadContainer.js
│   │   └── ...
│   ├── App.js
│   ├── config.js
│   └── ...


```

## Additional Notes

- The application defaults to using port 5000 for the backend API and port 3000 for the frontend
- All uploaded files are temporarily stored in `public/data/uploads/`
- Log files are not tracked in git but instead will be stored in `backend/public/data/uploads` in your local setup