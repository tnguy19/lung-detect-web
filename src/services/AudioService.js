// src/services/AudioService.js

class AudioService {
    constructor() {
      // Initialize audio context when service is created
      this.audioContext = null;
      this.audioBuffer = null;
      this.source = null;
      this.isPlaying = false;
      this.uploadedFile = null;
    }
  
    // Initialize or get the audio context
    getAudioContext() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      return this.audioContext;
    }
  
    // Set the uploaded file
    setUploadedFile(file) {
      this.uploadedFile = file;
    }
  
    // Load uploaded file into audio buffer
    async loadAudioFromUploadedFile() {
      if (!this.uploadedFile) {
        throw new Error("No file has been uploaded");
      }
  
      try {
        const arrayBuffer = await this.uploadedFile.arrayBuffer();
        const audioContext = this.getAudioContext();
        this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return this.audioBuffer;
      } catch (error) {
        console.error("Error loading audio from uploaded file:", error);
        throw error;
      }
    }
  
    // Load audio from a URL
    async loadAudioFromURL(url) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = this.getAudioContext();
        this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return this.audioBuffer;
      } catch (error) {
        console.error("Error loading audio from URL:", error);
        throw error;
      }
    }
  
    // Play a specific channel at a specific time
    async playChannelAtTime(channel, timeMs, duration = 1000) {
      // Stop any current playback
      this.stopAudio();
  
      if (!this.audioBuffer) {
        // Try to load from uploaded file if buffer isn't loaded yet
        try {
          await this.loadAudioFromUploadedFile();
        } catch (error) {
          console.error("Could not load audio:", error);
          return false;
        }
      }
  
      // Check if the channel exists in the audio buffer
      if (channel >= this.audioBuffer.numberOfChannels) {
        console.error(`Channel ${channel} does not exist in the audio buffer`);
        return false;
      }
  
      const audioContext = this.getAudioContext();
      
      // Create source
      this.source = audioContext.createBufferSource();
      this.source.buffer = this.audioBuffer;
      
      // Create gain node
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;
      
      // Create splitter for channel isolation
      const splitter = audioContext.createChannelSplitter(this.audioBuffer.numberOfChannels);
      
      // Create merger for stereo output
      const merger = audioContext.createChannelMerger(2);
      
      // Connect source to splitter
      this.source.connect(splitter);
      
      // Connect only the specific channel to both stereo outputs
      splitter.connect(merger, channel, 0); // Left output
      splitter.connect(merger, channel, 1); // Right output
      
      // Connect merger to gain node and gain node to destination
      merger.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Calculate start time in seconds
      const startTimeSec = timeMs / 1000;
      const durationSec = duration / 1000;
      
      // Calculate playback window (centered on the detection time)
      const startOffset = Math.max(0, startTimeSec - (durationSec / 2));
      const endTime = Math.min(this.audioBuffer.duration, startTimeSec + (durationSec / 2));
      const playbackLength = endTime - startOffset;
      
      // Start playback
      this.source.start(0, startOffset, playbackLength);
      this.isPlaying = true;
      
      // Set up event for when playback ends
      this.source.onended = () => {
        this.isPlaying = false;
        this.source = null;
      };
      
      return true;
    }
  
    // Stop audio playback
    stopAudio() {
      if (this.source && this.isPlaying) {
        try {
          this.source.stop();
        } catch (error) {
          // Ignore errors when stopping (might already be stopped)
        }
        this.source = null;
        this.isPlaying = false;
      }
    }
  
    // Close the audio context when done
    closeAudio() {
      this.stopAudio();
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      this.audioBuffer = null;
    }
  }
  
  // Create singleton instance
  const audioService = new AudioService();
  export default audioService;