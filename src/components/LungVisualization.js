import { useState, useEffect, useRef, useCallback } from "react";
import HumanBack from "../images/human_back.jpg";
import DataTable from "./DataTable";
import React from "react";

export default function LungVisualization({ data, initialShowChannelNumbers }) {
  const [selectedFamily, setSelectedFamily] = useState(0);
  const [familyData, setFamilyData] = useState([]);
  const [showChannelNumbers, setShowChannelNumbers] = useState(initialShowChannelNumbers);

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
        times.topLeft = dataPoint.time;
      } else if (dataPoint.channel === 1) {
        delays.topRight = dataPoint.delay;
        times.topRight = dataPoint.time;
      } else if (dataPoint.channel === 2) {
        delays.midLeft = dataPoint.delay;
        times.midLeft = dataPoint.time;
      } else if (dataPoint.channel === 3) {
        delays.midRight = dataPoint.delay;
        times.midRight = dataPoint.time;
      } else if (dataPoint.channel === 4) {
        delays.bottomLeft = dataPoint.delay;
        times.bottomLeft = dataPoint.time;
      } else if (dataPoint.channel === 5) {
        delays.bottomRight = dataPoint.delay;
        times.bottomRight = dataPoint.time;
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
    context.strokeStyle = "black";
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
  };

  return (
    <div className="visualization-container">
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
                          className={`btn ${detectionStates[index].topLeft ? "btn-danger" : "btn-success"} lung-point top-left`}
                          title={detectionStates[index].times?.topLeft ? 
                            `Channel 0 - Detection Time: ${detectionStates[index].times.topLeft.toFixed(2)} ms` : 
                            "Channel 0 - No time data available"}
                        >
                          {showChannelNumbers ? "Ch 0: " : ""}
                          {detectionStates[index].topLeft ? "Sound" : "No Sound"}
                        </button>
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[index].topRight ? "btn-danger" : "btn-success"} lung-point top-right`}
                          title={detectionStates[index].times?.topRight ? 
                            `Channel 1 - Detection Time: ${detectionStates[index].times.topRight.toFixed(2)} ms` : 
                            "Channel 1 - No time data available"}
                        >
                          {showChannelNumbers ? "Ch 1: " : ""}
                          {detectionStates[index].topRight ? "Sound" : "No Sound"}
                        </button>
                        
                        {/* Middle Row */}
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[index].midLeft ? "btn-danger" : "btn-success"} lung-point mid-left`}
                          title={detectionStates[index].times?.midLeft ? 
                            `Channel 2 - Detection Time: ${detectionStates[index].times.midLeft.toFixed(2)} ms` : 
                            "Channel 2 - No time data available"}
                        >
                          {showChannelNumbers ? "Ch 2: " : ""}
                          {detectionStates[index].midLeft ? "Sound" : "No Sound"}
                        </button>
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[index].midRight ? "btn-danger" : "btn-success"} lung-point mid-right`}
                          title={detectionStates[index].times?.midRight ? 
                            `Channel 3 - Detection Time: ${detectionStates[index].times.midRight.toFixed(2)} ms` : 
                            "Channel 3 - No time data available"}
                        >
                          {showChannelNumbers ? "Ch 3: " : ""}
                          {detectionStates[index].midRight ? "Sound" : "No Sound"}
                        </button>
                        
                        {/* Bottom Row */}
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[index].bottomLeft ? "btn-danger" : "btn-success"} lung-point bottom-left`}
                          title={detectionStates[index].times?.bottomLeft ? 
                            `Channel 4 - Detection Time: ${detectionStates[index].times.bottomLeft.toFixed(2)} ms` : 
                            "Channel 4 - No time data available"}
                        >
                          {showChannelNumbers ? "Ch 4: " : ""}
                          {detectionStates[index].bottomLeft ? "Sound" : "No Sound"}
                        </button>
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[index].bottomRight ? "btn-danger" : "btn-success"} lung-point bottom-right`}
                          title={detectionStates[index].times?.bottomRight ? 
                            `Channel 5 - Detection Time: ${detectionStates[index].times.bottomRight.toFixed(2)} ms` : 
                            "Channel 5 - No time data available"}
                        >
                          {showChannelNumbers ? "Ch 5: " : ""}
                          {detectionStates[index].bottomRight ? "Sound" : "No Sound"}
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
  );
}