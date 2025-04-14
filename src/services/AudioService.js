// src/services/AudioService.js

class AudioService {
  constructor() {
    // Initialize audio context when service is created
    this.audioContext = null;
    this.audioBuffer = null;
    this.source = null;
    this.isPlaying = false;
    this.uploadedFile = null;
    this.loadPromise = null;
    this.availableChannels = 0;
  }

  // Initialize or get the audio context
  getAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.error("Failed to create audio context:", error);
        throw new Error("Could not create audio context. Your browser may not support Web Audio API.");
      }
    }
    return this.audioContext;
  }

  // Set the uploaded file
  setUploadedFile(file) {
    this.uploadedFile = file;
    // Reset buffer when a new file is uploaded
    this.audioBuffer = null;
    this.loadPromise = null;
    this.availableChannels = 0;
  }

  // Load uploaded file into audio buffer
  async loadAudioFromUploadedFile() {
    if (!this.uploadedFile) {
      throw new Error("No file has been uploaded");
    }

    // If we already have a load in progress, return that promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Create a new promise for loading
    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await this.uploadedFile.arrayBuffer();
        const audioContext = this.getAudioContext();
        
        console.log("Decoding audio data with size:", arrayBuffer.byteLength);
        
        try {
          this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          this.availableChannels = this.audioBuffer.numberOfChannels;
          
          console.log("Audio loaded successfully:", {
            duration: this.audioBuffer.duration,
            numberOfChannels: this.audioBuffer.numberOfChannels,
            sampleRate: this.audioBuffer.sampleRate
          });
          resolve(this.audioBuffer);
        } catch (decodeError) {
          console.error("Error decoding audio data:", decodeError);
          reject(new Error("Failed to decode audio file. The file may be corrupted or in an unsupported format."));
        }
      } catch (error) {
        console.error("Error loading audio from uploaded file:", error);
        reject(error);
      }
    });

    return this.loadPromise;
  }

  // Load audio from a URL
  async loadAudioFromURL(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = this.getAudioContext();
      
      try {
        this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        this.availableChannels = this.audioBuffer.numberOfChannels;
        
        console.log("Audio loaded successfully from URL:", {
          duration: this.audioBuffer.duration,
          numberOfChannels: this.audioBuffer.numberOfChannels,
          sampleRate: this.audioBuffer.sampleRate
        });
        return this.audioBuffer;
      } catch (decodeError) {
        console.error("Error decoding audio data from URL:", decodeError);
        throw new Error("Failed to decode audio file from URL. The file may be corrupted or in an unsupported format.");
      }
    } catch (error) {
      console.error("Error loading audio from URL:", error);
      throw error;
    }
  }

  // Check if a specific channel is available
  isChannelAvailable(channel) {
    if (!this.audioBuffer) {
      return false;
    }
    return channel < this.audioBuffer.numberOfChannels;
  }
  
  // Get the number of available channels
  getNumberOfChannels() {
    if (!this.audioBuffer) {
      return 0;
    }
    return this.audioBuffer.numberOfChannels;
  }
  
  // Validate parameters before playing
  validatePlaybackParams(channel, timeMs) {
    if (!this.audioBuffer) {
      throw new Error("No audio buffer loaded. Please load audio first.");
    }

    if (channel >= this.audioBuffer.numberOfChannels) {
      throw new Error(`Channel ${channel} does not exist. Available channels: 0-${this.audioBuffer.numberOfChannels - 1}`);
    }

    const timeSec = timeMs / 1000;
    if (timeSec >= this.audioBuffer.duration) {
      throw new Error(`Time ${timeMs}ms (${timeSec.toFixed(2)}s) exceeds audio duration ${this.audioBuffer.duration.toFixed(2)}s`);
    }

    return true;
  }

  // Play a specific channel at a specific time
  async playChannelAtTime(channel, timeMs, duration = 1000) {
    // Stop any current playback
    this.stopAudio();

    // Load audio if not already loaded
    if (!this.audioBuffer) {
      try {
        await this.loadAudioFromUploadedFile();
      } catch (error) {
        console.error("Could not load audio:", error);
        return false;
      }
    }

    // Check if the requested channel exists
    if (!this.isChannelAvailable(channel)) {
      console.error(`Channel ${channel} is not available. Only ${this.getNumberOfChannels()} channels exist.`);
      return false;
    }

    try {
      // Validate parameters
      this.validatePlaybackParams(channel, timeMs);

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
      
      console.log(`Playing channel ${channel} at time ${startTimeSec.toFixed(2)}s (offset: ${startOffset.toFixed(2)}s, length: ${playbackLength.toFixed(2)}s)`);
      
      // Start playback
      this.source.start(0, startOffset, playbackLength);
      this.isPlaying = true;
      
      // Set up event for when playback ends
      this.source.onended = () => {
        console.log("Playback ended");
        this.isPlaying = false;
        this.source = null;
      };
      
      return true;
    } catch (error) {
      console.error("Error in playChannelAtTime:", error);
      return false;
    }
  }

  // Stop audio playback
  stopAudio() {
    if (this.source && this.isPlaying) {
      try {
        this.source.stop();
        console.log("Playback stopped manually");
      } catch (error) {
        // Ignore errors when stopping (might already be stopped)
        console.log("Error stopping audio (might already be stopped):", error);
      }
      this.source = null;
      this.isPlaying = false;
    }
  }

  // Close the audio context when done
  closeAudio() {
    this.stopAudio();
    if (this.audioContext) {
      this.audioContext.close().then(() => {
        console.log("Audio context closed");
      }).catch(error => {
        console.error("Error closing audio context:", error);
      });
      this.audioContext = null;
    }
    this.audioBuffer = null;
    this.loadPromise = null;
  }

  // Get audio information (for debugging)
  getAudioInfo() {
    if (!this.audioBuffer) {
      return { loaded: false, message: "No audio buffer loaded" };
    }

    return {
      loaded: true,
      numberOfChannels: this.audioBuffer.numberOfChannels,
      sampleRate: this.audioBuffer.sampleRate,
      duration: this.audioBuffer.duration,
      length: this.audioBuffer.length
    };
  }
}

// Create singleton instance
const audioService = new AudioService();
export default audioService;