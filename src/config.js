// src/config.js

// Function to get the backend URL from environment or window location
const getBackendUrl = () => {
    // For production, use the environment variable if available
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    // For development, use localhost with port 5000
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:5000';
    }
    
    // For production without env var, use the same host as the frontend with port 5000
    return `http://${window.location.hostname}:5000`;
  };
  
  // Export the API URL
  export const API_URL = getBackendUrl();