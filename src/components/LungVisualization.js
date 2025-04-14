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

  // Initialize detection state arrays, one per family
  const [detectionStates, setDetectionStates] = useState([]);

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

  function analyzeCrackleFamily(family, familyIndex) {
    let delays = {
      topLeft: Infinity,
      topRight: Infinity,
      midLeft: Infinity,
      midRight: Infinity,
      bottomLeft: Infinity,
      bottomRight: Infinity
    };
    
    let times = {
      topLeft: null,
      topRight: null,
      midLeft: null,
      midRight: null,
      bottomLeft: null,
      bottomRight: null
    };

    // Extract delays and times for each channel in this family
    for (let i = 0; i < family.length; i++) {
      let dataPoint = family[i];

      // Map channels 0-5 to specific positions
      if (dataPoint.channel === 0) {
        delays.topLeft = dataPoint.delay;
        times.topLeft = dataPoint.raw_time || dataPoint.time;
      } else if (dataPoint.channel === 1) {
        delays.topRight = dataPoint.delay;
        times.topRight = dataPoint.raw_time || dataPoint.time;
      } else if (dataPoint.channel === 2) {
        delays.midLeft = dataPoint.delay;
        times.midLeft = dataPoint.raw_time || dataPoint.time;
      } else if (dataPoint.channel === 3) {
        delays.midRight = dataPoint.delay;
        times.midRight = dataPoint.raw_time || dataPoint.time;
      } else if (dataPoint.channel === 4) {
        delays.bottomLeft = dataPoint.delay;
        times.bottomLeft = dataPoint.raw_time || dataPoint.time;
      } else if (dataPoint.channel === 5) {
        delays.bottomRight = dataPoint.delay;
        times.bottomRight = dataPoint.raw_time || dataPoint.time;
      }
    }

    // Find the minimum delay
    let minDelay = Math.min(
      Math.abs(delays.topLeft),
      Math.abs(delays.topRight),
      Math.abs(delays.midLeft),
      Math.abs(delays.midRight),
      Math.abs(delays.bottomLeft),
      Math.abs(delays.bottomRight)
    );

    // Update detection states for this family
    setDetectionStates(prevStates => {
      const newStates = [...prevStates];
      newStates[familyIndex] = {
        topLeft: Math.abs(delays.topLeft) === minDelay,
        topRight: Math.abs(delays.topRight) === minDelay,
        midLeft: Math.abs(delays.midLeft) === minDelay,
        midRight: Math.abs(delays.midRight) === minDelay,
        bottomLeft: Math.abs(delays.bottomLeft) === minDelay,
        bottomRight: Math.abs(delays.bottomRight) === minDelay,
        times: times
      };
      return newStates;
    });
  }

  // Create a ref for each family's canvas
  const canvasRefs = useRef([]);
  const imageRefs = useRef([]);

  // Function to create refs for multiple canvases
  const createCanvasRef = (index) => {
    if (!canvasRefs.current[index]) {
      canvasRefs.current[index] = React.createRef();
    }
    return canvasRefs.current[index];
  };

  // Function to create refs for multiple images
  const createImageRef = (index) => {
    if (!imageRefs.current[index]) {
      imageRefs.current[index] = React.createRef();
    }
    return imageRefs.current[index];
  };

  // Draw grid on a specific canvas
  const drawGrid = useCallback((canvasIndex) => {
    const canvas = canvasRefs.current[canvasIndex]?.current;
    const image = imageRefs.current[canvasIndex]?.current;

    if (!canvas || !image) return;

    const context = canvas.getContext("2d");
    
    // Calculate grid size based on image dimensions
    // We'll create a consistent grid with 8 columns and 10 rows
    const numCols = 8;
    const numRows = 10;
    const colWidth = image.width / numCols;
    const rowHeight = image.height / numRows;

    // Set the canvas size to match the image size
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw grid lines
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(0, 0, 0, 0.3)";
    context.lineWidth = 0.8;

    // Draw vertical grid lines
    for (let i = 0; i <= numCols; i++) {
      const x = i * colWidth;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }

    // Draw horizontal grid lines
    for (let j = 0; j <= numRows; j++) {
      const y = j * rowHeight;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
  }, []);

  // Draw grids for all canvases when component mounts or canvases change
  useEffect(() => {
    if (familyData.length > 0) {
      familyData.forEach((_, index) => {
        setTimeout(() => drawGrid(index), 100); // Delay to ensure refs are set
      });
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