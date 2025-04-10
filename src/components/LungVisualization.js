
import { useState, useEffect, useRef, useCallback } from "react";
import HumanBack from "../images/human_back.jpg";
import DataTable from "./DataTable";
import React from "react";
import audioService from "../services/AudioService";

export default function LungVisualization({ data, initialShowChannelNumbers }) {
  const [selectedFamily, setSelectedFamily] = useState(0);
  const [familyData, setFamilyData] = useState([]);
  const [showChannelNumbers, setShowChannelNumbers] = useState(initialShowChannelNumbers);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);

  const [leftDetected, setLeftDetected] = useState(false);
  const [rightDetected, setRightDetected] = useState(false);

  useEffect(() => {
    // Process the data when it changes
    if (data && data.length > 0) {
      setFamilyData(data);
      
      // Initialize detection states for each family
      const initialDetectionStates = data.map(() => ({
        topLeft: false,
        topRight: false,
        midLeft: false,
        midRight: false,
        bottomLeft: false,
        bottomRight: false,
        times: {
          topLeft: null,
          topRight: null,
          midLeft: null,
          midRight: null,
          bottomLeft: null,
          bottomRight: null
        }
      }));
      
      setDetectionStates(initialDetectionStates);
      
      // Analyze each family
      data.forEach((family, index) => {
        analyzeCrackleFamily(family, index);
      });
    }
    
    // Cleanup function to stop any audio playback when component unmounts
    return () => {
      audioService.stopAudio();
    };
  }, [data]);


    //if theres only one sound being picked up, then assign by location

    if (data.length === 1) {
      console.log("datapoint:", data[0][0]);
      let dataPoint = data[0][0];
      if (dataPoint.channel === 0) {
        leftFound = true;
      } else if (dataPoint.channel === 1) {
        rightFound = true;
      }
      setLeftDetected(leftFound);
      setRightDetected(rightFound);
      return;
    }

    //else compare and assign location based on delay
    let leftDelay = 0;
    let rightDelay = 0;

    for (let i = 0; i < data.length; i++) {
      console.log("datapoint:", data[i][0]);
      let dataPoint = data[i][0];
      if (dataPoint.channel === 0) {
        leftDelay = dataPoint.delay;
      } else if (dataPoint.channel === 1) {
        rightDelay = dataPoint.delay;
      }
    }
    
    //basically the one with the lower delay is nearer to the sign, so assign location based on that
    if (leftDelay < rightDelay) {
      leftFound = true;
    } else {
      rightFound = true;
    }
    setLeftDetected(leftFound);
    setRightDetected(rightFound);
  }

  useEffect(() => {
    if (data && data.length > 0) {
      analyze(data);
    }
    
  }, [familyData, drawGrid]);

  // Function to handle family selection
  const handleFamilyChange = (event) => {
    setSelectedFamily(parseInt(event.target.value));
  };
  
  // Check if a location has sound detection
  const hasSound = (position, index) => {
    if (!detectionStates[index]) return false;
    return detectionStates[index][position];
  };
  
  // Function to handle button clicks for audio playback
  const handlePlayButtonClick = async (channel, timeMs, position, index) => {
    // Check if this channel/position has sound detection
    // If not, don't play any audio and don't proceed further
    if (!hasSound(position, index)) {
      return;
    }
    
    // If this channel is already playing, stop it
    if (isPlaying && activeChannel === channel) {
      audioService.stopAudio();
      setIsPlaying(false);
      setActiveChannel(null);
      return;
    }
    
    // Stop any currently playing audio
    if (isPlaying) {
      audioService.stopAudio();
    }
    
    // Start playing the new channel
    setIsAudioLoading(true);
    setActiveChannel(channel);
    
    try {
      const success = await audioService.playChannelAtTime(channel, timeMs, 2000); // 2-second clip
      
      if (success) {
        setIsPlaying(true);
        
        // Set up a listener for when playback ends
        const originalSource = audioService.source;
        if (originalSource) {
          const originalOnEnded = originalSource.onended;
          originalSource.onended = () => {
            if (originalOnEnded) originalOnEnded();
            setIsPlaying(false);
            setActiveChannel(null);
          };
        }
      } else {
        // If playback failed, reset the state
        setActiveChannel(null);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setActiveChannel(null);
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <div className="visualization-container">
      <div className="left-column">
        {familyData.length > 1 && (
          <div className="family-selector">
            <label htmlFor="familySelect" className="form-label">
              Select Crackle Family:
            </label>
            <select 
              id="familySelect" 
              className="form-select" 
              value={selectedFamily} 
              onChange={handleFamilyChange}
            >
              {familyData.map((_, index) => (
                <option key={index} value={index}>
                  Family {index + 1}
                </option>
              ))}
            </select>
            
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="showChannelNumbers"
                checked={showChannelNumbers}
                onChange={() => setShowChannelNumbers(!showChannelNumbers)}
              />
              <label className="form-check-label" htmlFor="showChannelNumbers">
                Show Channel Numbers
              </label>
            </div>
          </div>
        )}
        
        {/* Info alert moved to the same column as family selector */}
        <div className="info-alert-inline">
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            Click on any red "Sound" button to play back the detected lung sound.
          </div>
        </div>
      </div>
      
      <div className="right-column">
        <div className="accordion" id="crackleFamiliesAccordion">
          {familyData.map((family, index) => (
            <div className="accordion-item" key={index}>
              <h2 className="accordion-header">
                <button 
                  className={`accordion-button ${index !== selectedFamily ? 'collapsed' : ''}`} 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target={`#family${index}`} 
                  aria-expanded={index === selectedFamily} 
                  aria-controls={`family${index}`}
                  onClick={() => setSelectedFamily(index)}
                >
                  Crackle Family {index + 1}
                </button>
              </h2>
              <div 
                id={`family${index}`} 
                className={`accordion-collapse collapse ${index === selectedFamily ? 'show' : ''}`}
                data-bs-parent="#crackleFamiliesAccordion"
              >
                <div className="accordion-body">
                  <div className="visualization-container" style={{padding: '0'}}>
                    <div className="lung-container">
                      {/* Human Back Image */}
                      <img
                        ref={createImageRef(index)}
                        src={HumanBack}
                        alt="Human Back Diagram"
                        className="lung-image"
                      />

                      {/* Canvas Overlay */}
                      <canvas ref={createCanvasRef(index)} className="lung-canvas" />

                      {/* Detected Points as Buttons with Time Information Tooltips */}
                      {detectionStates[index] && (
                        <>
                          {/* Top Row */}
                          <button 
                            type="button" 
                            className={`btn ${detectionStates[index].topLeft ? "btn-danger" : "btn-success"} lung-point top-left ${activeChannel === 0 && isPlaying ? "playing" : ""}`}
                            title={detectionStates[index].times?.topLeft ? 
                              `Channel 0 - Detection Time: ${detectionStates[index].times.topLeft.toFixed(2)} ms - ${detectionStates[index].topLeft ? "Click to play sound" : "No sound detected"}` : 
                              "Channel 0 - No time data available"}
                            onClick={() => detectionStates[index].times?.topLeft && handlePlayButtonClick(0, detectionStates[index].times.topLeft, "topLeft", index)}
                            disabled={!detectionStates[index].times?.topLeft || isAudioLoading}
                          >
                            {showChannelNumbers ? "Ch 0: " : ""}
                            {detectionStates[index].topLeft ? (
                              <>
                                {activeChannel === 0 && isPlaying ? "Playing..." : "Sound"}
                                <i className={`ms-2 fas ${activeChannel === 0 && isPlaying ? "fa-pause" : "fa-play"}`}></i>
                              </>
                            ) : "No Sound"}
                          </button>
                          <button 
                            type="button" 
                            className={`btn ${detectionStates[index].topRight ? "btn-danger" : "btn-success"} lung-point top-right ${activeChannel === 1 && isPlaying ? "playing" : ""}`}
                            title={detectionStates[index].times?.topRight ? 
                              `Channel 1 - Detection Time: ${detectionStates[index].times.topRight.toFixed(2)} ms - ${detectionStates[index].topRight ? "Click to play sound" : "No sound detected"}` : 
                              "Channel 1 - No time data available"}
                            onClick={() => detectionStates[index].times?.topRight && handlePlayButtonClick(1, detectionStates[index].times.topRight, "topRight", index)}
                            disabled={!detectionStates[index].times?.topRight || isAudioLoading}
                          >
                            {showChannelNumbers ? "Ch 1: " : ""}
                            {detectionStates[index].topRight ? (
                              <>
                                {activeChannel === 1 && isPlaying ? "Playing..." : "Sound"}
                                <i className={`ms-2 fas ${activeChannel === 1 && isPlaying ? "fa-pause" : "fa-play"}`}></i>
                              </>
                            ) : "No Sound"}
                          </button>
                          
                          {/* Middle Row */}
                          <button 
                            type="button" 
                            className={`btn ${detectionStates[index].midLeft ? "btn-danger" : "btn-success"} lung-point mid-left ${activeChannel === 2 && isPlaying ? "playing" : ""}`}
                            title={detectionStates[index].times?.midLeft ? 
                              `Channel 2 - Detection Time: ${detectionStates[index].times.midLeft.toFixed(2)} ms - ${detectionStates[index].midLeft ? "Click to play sound" : "No sound detected"}` : 
                              "Channel 2 - No time data available"}
                            onClick={() => detectionStates[index].times?.midLeft && handlePlayButtonClick(2, detectionStates[index].times.midLeft, "midLeft", index)}
                            disabled={!detectionStates[index].times?.midLeft || isAudioLoading}
                          >
                            {showChannelNumbers ? "Ch 2: " : ""}
                            {detectionStates[index].midLeft ? (
                              <>
                                {activeChannel === 2 && isPlaying ? "Playing..." : "Sound"}
                                <i className={`ms-2 fas ${activeChannel === 2 && isPlaying ? "fa-pause" : "fa-play"}`}></i>
                              </>
                            ) : "No Sound"}
                          </button>
                          <button 
                            type="button" 
                            className={`btn ${detectionStates[index].midRight ? "btn-danger" : "btn-success"} lung-point mid-right ${activeChannel === 3 && isPlaying ? "playing" : ""}`}
                            title={detectionStates[index].times?.midRight ? 
                              `Channel 3 - Detection Time: ${detectionStates[index].times.midRight.toFixed(2)} ms - ${detectionStates[index].midRight ? "Click to play sound" : "No sound detected"}` : 
                              "Channel 3 - No time data available"}
                            onClick={() => detectionStates[index].times?.midRight && handlePlayButtonClick(3, detectionStates[index].times.midRight, "midRight", index)}
                            disabled={!detectionStates[index].times?.midRight || isAudioLoading}
                          >
                            {showChannelNumbers ? "Ch 3: " : ""}
                            {detectionStates[index].midRight ? (
                              <>
                                {activeChannel === 3 && isPlaying ? "Playing..." : "Sound"}
                                <i className={`ms-2 fas ${activeChannel === 3 && isPlaying ? "fa-pause" : "fa-play"}`}></i>
                              </>
                            ) : "No Sound"}
                          </button>
                          
                          {/* Bottom Row */}
                          <button 
                            type="button" 
                            className={`btn ${detectionStates[index].bottomLeft ? "btn-danger" : "btn-success"} lung-point bottom-left ${activeChannel === 4 && isPlaying ? "playing" : ""}`}
                            title={detectionStates[index].times?.bottomLeft ? 
                              `Channel 4 - Detection Time: ${detectionStates[index].times.bottomLeft.toFixed(2)} ms - ${detectionStates[index].bottomLeft ? "Click to play sound" : "No sound detected"}` : 
                              "Channel 4 - No time data available"}
                            onClick={() => detectionStates[index].times?.bottomLeft && handlePlayButtonClick(4, detectionStates[index].times.bottomLeft, "bottomLeft", index)}
                            disabled={!detectionStates[index].times?.bottomLeft || isAudioLoading}
                          >
                            {showChannelNumbers ? "Ch 4: " : ""}
                            {detectionStates[index].bottomLeft ? (
                              <>
                                {activeChannel === 4 && isPlaying ? "Playing..." : "Sound"}
                                <i className={`ms-2 fas ${activeChannel === 4 && isPlaying ? "fa-pause" : "fa-play"}`}></i>
                              </>
                            ) : "No Sound"}
                          </button>
                          <button 
                            type="button" 
                            className={`btn ${detectionStates[index].bottomRight ? "btn-danger" : "btn-success"} lung-point bottom-right ${activeChannel === 5 && isPlaying ? "playing" : ""}`}
                            title={detectionStates[index].times?.bottomRight ? 
                              `Channel 5 - Detection Time: ${detectionStates[index].times.bottomRight.toFixed(2)} ms - ${detectionStates[index].bottomRight ? "Click to play sound" : "No sound detected"}` : 
                              "Channel 5 - No time data available"}
                            onClick={() => detectionStates[index].times?.bottomRight && handlePlayButtonClick(5, detectionStates[index].times.bottomRight, "bottomRight", index)}
                            disabled={!detectionStates[index].times?.bottomRight || isAudioLoading}
                          >
                            {showChannelNumbers ? "Ch 5: " : ""}
                            {detectionStates[index].bottomRight ? (
                              <>
                                {activeChannel === 5 && isPlaying ? "Playing..." : "Sound"}
                                <i className={`ms-2 fas ${activeChannel === 5 && isPlaying ? "fa-pause" : "fa-play"}`}></i>
                              </>
                            ) : "No Sound"}
                          </button>
                        </>
                      )}
                    </div>

                    <div className="table-container">
                      <h5>Family {index + 1} Data</h5>
                      <DataTable data={family} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Audio playback status messages */}
      {isAudioLoading && (
        <div className="alert alert-info mt-3">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          Loading audio...
        </div>
      )}
    </div>
  );
}
