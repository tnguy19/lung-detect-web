import React, { useState, useEffect } from 'react';
import audioService from '../services/AudioService'; // Make sure this path is correct

export default function AudioPlayback({ 
  audioFile, 
  timeMs, 
  channel = 0, 
  playbackDuration = 2000, 
  onPlaybackStart,
  onPlaybackComplete 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  
  // Prepare the audio service when the component mounts or when audioFile changes
  useEffect(() => {
    if (audioFile) {
      // Create a fetch request to get the audio file as a blob
      fetch(audioFile)
        .then(response => response.blob())
        .then(blob => {
          // Create a File object from the blob
          const file = new File([blob], 'audio.wav', { type: 'audio/wav' });
          // Set the file in the audio service
          audioService.setUploadedFile(file);
        })
        .catch(error => {
          console.error('Error loading audio file:', error);
          setError('Failed to load audio file');
        });
    }
    
    // Clean up when the component unmounts
    return () => {
      if (isPlaying) {
        audioService.stopAudio();
        setIsPlaying(false);
      }
    };
  }, [audioFile]);
  
  // Handle playback
  const handlePlay = async () => {
    try {
      setError(null);
      
      // Make sure the audio file is loaded
      if (!audioService.audioBuffer) {
        try {
          await audioService.loadAudioFromUploadedFile();
        } catch (err) {
          console.error('Error loading audio buffer:', err);
          setError('Failed to load audio buffer');
          return;
        }
      }
      
      // Validate channel number against available channels
      if (audioService.audioBuffer && channel >= audioService.audioBuffer.numberOfChannels) {
        console.error(`Channel ${channel} does not exist in audio buffer with ${audioService.audioBuffer.numberOfChannels} channels`);
        setError(`Channel ${channel} not available`);
        return;
      }
      
      // Validate time against audio duration
      if (audioService.audioBuffer && (timeMs/1000) > audioService.audioBuffer.duration) {
        console.error(`Time ${timeMs}ms exceeds audio duration ${audioService.audioBuffer.duration*1000}ms`);
        setError('Time out of bounds');
        return;
      }
      
      // Set isPlaying state before attempting to play
      setIsPlaying(true);
      
      // Notify parent component
      if (onPlaybackStart) {
        onPlaybackStart(channel);
      }
      
      // Play the specific channel at the specified time
      const success = await audioService.playChannelAtTime(channel, timeMs, playbackDuration);
      
      if (!success) {
        console.error('Failed to play audio');
        setIsPlaying(false);
        setError('Playback failed');
        
        // Notify parent component of playback failure
        if (onPlaybackComplete) {
          onPlaybackComplete(channel);
        }
        return;
      }
      
      // Set up a timeout to update UI when playback is complete
      setTimeout(() => {
        setIsPlaying(false);
        if (onPlaybackComplete) {
          onPlaybackComplete(channel);
        }
      }, playbackDuration);
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setError('Playback error');
      
      // Notify parent component of playback failure
      if (onPlaybackComplete) {
        onPlaybackComplete(channel);
      }
    }
  };
  
  // Pause playback
  const handlePause = () => {
    audioService.stopAudio();
    setIsPlaying(false);
    
    // Notify parent component of playback end
    if (onPlaybackComplete) {
      onPlaybackComplete(channel);
    }
  };

  // Format time in seconds nicely
  const formatTime = (ms) => {
    const seconds = ms / 1000;
    return seconds.toFixed(2) + 's';
  };
  
  return (
    <div className="audio-playback-container">
      {error && <div className="playback-error">{error}</div>}
      <div className="playback-controls">
        {!isPlaying ? (
          <button 
            className="btn btn-primary play-button" 
            onClick={handlePlay}
            disabled={!audioFile}
            title={`Play channel ${channel} at time ${formatTime(timeMs)}`}
          >
            <i className="fas fa-play me-1"></i>
            Play at {formatTime(timeMs)}
          </button>
        ) : (
          <button 
            className="btn btn-danger stop-button" 
            onClick={handlePause}
            title="Stop playback"
          >
            <i className="fas fa-stop me-1"></i>
            Stop
          </button>
        )}
      </div>
    </div>
  );
}