
import { useState, useEffect, useRef, useCallback } from "react";
import HumanBack from "../images/human_back.jpg";
import AudioPlayback from "../services/AudioPlayback";
import DataTable from "./DataTable";
import React from "react";
import "../LungVisualization.css";

export default function LungVisualization({ data, audioFile, initialShowChannelNumbers = false }) {
  const [selectedFamily, setSelectedFamily] = useState(0);
  const [familyData, setFamilyData] = useState([]);
  const [showChannelNumbers, setShowChannelNumbers] = useState(initialShowChannelNumbers);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [playingChannel, setPlayingChannel] = useState(null);

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
    setSelectedChannel(null);
    setPlayingChannel(null);
  };

  // Function to handle channel button click
  const handleChannelButtonClick = (channel) => {
    // Find the data point for this channel in the current family
    const channelData = familyData[selectedFamily]?.find(item => item.channel === channel);
    setSelectedChannel(channelData);
  };

  // Function to handle audio playback start
  const handlePlaybackStart = (channel) => {
    setPlayingChannel(channel);
  };

  // Function to handle audio playback end
  const handlePlaybackEnd = () => {
    setPlayingChannel(null);
  };

  // Get the channel mapping
  const getChannelFromPosition = (position) => {
    const channelMap = {
      'topLeft': 0,
      'topRight': 1,
      'midLeft': 2,
      'midRight': 3,
      'bottomLeft': 4,
      'bottomRight': 5
    };
    return channelMap[position];
  };

  // Get channel label
  const getChannelLabel = (channel, isDetected) => {
    const baseLabel = showChannelNumbers ? `Ch ${channel}: ` : '';
    return `${baseLabel}${isDetected ? 'Sound' : 'No Sound'}`;
  };

  // Get position name for a channel
  const getPositionName = (channel) => {
    const positionMap = {
      0: 'Top Left',
      1: 'Top Right',
      2: 'Middle Left',
      3: 'Middle Right',
      4: 'Bottom Left',
      5: 'Bottom Right'
    };
    return positionMap[channel] || `Channel ${channel}`;
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

        <div className="info-alert-inline">
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            Click on a channel button to view details and play audio.
          </div>
        </div>
      </div>

      <div className="right-column">
        <div className="accordion" id="crackleFamiliesAccordion">
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button 
                className="accordion-button" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#family1" 
                aria-expanded="true" 
                aria-controls="family1"
              >
                Crackle Family {selectedFamily + 1}
              </button>
            </h2>
            <div 
              id="family1" 
              className="accordion-collapse collapse show"
              data-bs-parent="#crackleFamiliesAccordion"
            >
              <div className="accordion-body">
                <div className="visualization-container" style={{padding: '0'}}>
                  <div className="lung-container">
                    {/* Human Back Image */}
                    <img
                      ref={createImageRef(selectedFamily)}
                      src={HumanBack}
                      alt="Human Back Diagram"
                      className="lung-image"
                    />

                    {/* Canvas Overlay */}
                    <canvas ref={createCanvasRef(selectedFamily)} className="lung-canvas" />

                    {/* Detected Points as Buttons with Time Information Tooltips */}
                    {detectionStates[selectedFamily] && (
                      <>
                        {/* Top Row */}
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[selectedFamily].topLeft ? "btn-danger" : "btn-success"} 
                                    lung-point top-left ${playingChannel === 0 ? 'playing' : ''}`}
                          title={detectionStates[selectedFamily].times?.topLeft ? 
                            `Channel 0 - Detection Time: ${detectionStates[selectedFamily].times.topLeft.toFixed(2)} ms` : 
                            "Channel 0 - No time data available"}
                          onClick={() => handleChannelButtonClick(0)}
                        >
                          {getChannelLabel(0, detectionStates[selectedFamily].topLeft)}
                        </button>
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[selectedFamily].topRight ? "btn-danger" : "btn-success"} 
                                    lung-point top-right ${playingChannel === 1 ? 'playing' : ''}`}
                          title={detectionStates[selectedFamily].times?.topRight ? 
                            `Channel 1 - Detection Time: ${detectionStates[selectedFamily].times.topRight.toFixed(2)} ms` : 
                            "Channel 1 - No time data available"}
                          onClick={() => handleChannelButtonClick(1)}
                        >
                          {getChannelLabel(1, detectionStates[selectedFamily].topRight)}
                        </button>
                        
                        {/* Middle Row */}
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[selectedFamily].midLeft ? "btn-danger" : "btn-success"} 
                                    lung-point mid-left ${playingChannel === 2 ? 'playing' : ''}`}
                          title={detectionStates[selectedFamily].times?.midLeft ? 
                            `Channel 2 - Detection Time: ${detectionStates[selectedFamily].times.midLeft.toFixed(2)} ms` : 
                            "Channel 2 - No time data available"}
                          onClick={() => handleChannelButtonClick(2)}
                        >
                          {getChannelLabel(2, detectionStates[selectedFamily].midLeft)}
                        </button>
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[selectedFamily].midRight ? "btn-danger" : "btn-success"} 
                                    lung-point mid-right ${playingChannel === 3 ? 'playing' : ''}`}
                          title={detectionStates[selectedFamily].times?.midRight ? 
                            `Channel 3 - Detection Time: ${detectionStates[selectedFamily].times.midRight.toFixed(2)} ms` : 
                            "Channel 3 - No time data available"}
                          onClick={() => handleChannelButtonClick(3)}
                        >
                          {getChannelLabel(3, detectionStates[selectedFamily].midRight)}
                        </button>
                        
                        {/* Bottom Row */}
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[selectedFamily].bottomLeft ? "btn-danger" : "btn-success"} 
                                    lung-point bottom-left ${playingChannel === 4 ? 'playing' : ''}`}
                          title={detectionStates[selectedFamily].times?.bottomLeft ? 
                            `Channel 4 - Detection Time: ${detectionStates[selectedFamily].times.bottomLeft.toFixed(2)} ms` : 
                            "Channel 4 - No time data available"}
                          onClick={() => handleChannelButtonClick(4)}
                        >
                          {getChannelLabel(4, detectionStates[selectedFamily].bottomLeft)}
                        </button>
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[selectedFamily].bottomRight ? "btn-danger" : "btn-success"} 
                                    lung-point bottom-right ${playingChannel === 5 ? 'playing' : ''}`}
                          title={detectionStates[selectedFamily].times?.bottomRight ? 
                            `Channel 5 - Detection Time: ${detectionStates[selectedFamily].times.bottomRight.toFixed(2)} ms` : 
                            "Channel 5 - No time data available"}
                          onClick={() => handleChannelButtonClick(5)}
                        >
                          {getChannelLabel(5, detectionStates[selectedFamily].bottomRight)}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Selected Channel Details and Audio Playback */}
                  {selectedChannel && (
                    <div className="selected-channel-card">
                      <div className="card">
                        <div className="card-header">
                          <h5>Channel {selectedChannel.channel} - {getPositionName(selectedChannel.channel)}</h5>
                        </div>
                        <div className="card-body">
                          <div className="channel-details">
                            <div className="detail-row">
                              <div className="detail-label">Time:</div>
                              <div className="detail-value">{(selectedChannel.raw_time || selectedChannel.time).toFixed(2)} ms</div>
                            </div>
                            <div className="detail-row">
                              <div className="detail-label">Delay:</div>
                              <div className="detail-value">{selectedChannel.delay.toFixed(2)} ms</div>
                            </div>
                            <div className="detail-row">
                              <div className="detail-label">Transmission:</div>
                              <div className="detail-value">{selectedChannel.transmission_coefficient.toFixed(3)}</div>
                            </div>
                            {selectedChannel.adjusted_time && (
                              <div className="detail-row">
                                <div className="detail-label">Adjusted Time:</div>
                                <div className="detail-value">{selectedChannel.adjusted_time.toFixed(2)} ms</div>
                              </div>
                            )}
                          </div>
                          
                          {audioFile && (
                            <div className="audio-playback mt-3">
                              <AudioPlayback 
                                audioFile={audioFile} 
                                timeMs={selectedChannel.raw_time || selectedChannel.time}
                                channel={selectedChannel.channel}
                                playbackDuration={2000}
                                onPlaybackStart={() => handlePlaybackStart(selectedChannel.channel)}
                                onPlaybackComplete={handlePlaybackEnd}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="table-container">
                    <h5>Family {selectedFamily + 1} Data</h5>
                    <DataTable 
                      data={familyData[selectedFamily] || []} 
                      audioFile={audioFile}
                      onPlaybackStart={handlePlaybackStart}
                      onPlaybackComplete={handlePlaybackEnd}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
