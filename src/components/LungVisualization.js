import { useState, useEffect, useRef, useCallback } from "react";
import HumanBack from "../images/human_back.jpg";
import DataTable from "./DataTable";
import React from "react";

export default function LungVisualization({ data }) {
  const [selectedFamily, setSelectedFamily] = useState(0);
  const [familyData, setFamilyData] = useState([]);

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
        midRight: false
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
      midLeft: Infinity,
      midRight: Infinity,
      topLeft: Infinity,
      topRight: Infinity,
    };

    // Extract delays for each channel in this family
    for (let i = 0; i < family.length; i++) {
      let dataPoint = family[i];

      if (dataPoint.channel === 0) {
        delays.midLeft = dataPoint.delay;
      } else if (dataPoint.channel === 1) {
        delays.midRight = dataPoint.delay;
      } else if (dataPoint.channel === 2) {
        delays.topLeft = dataPoint.delay;
      } else if (dataPoint.channel === 3) {
        delays.topRight = dataPoint.delay;
      }
    }

    // Find the minimum delay
    let minDelay = Math.min(
      Math.abs(delays.midLeft),
      Math.abs(delays.midRight),
      Math.abs(delays.topLeft),
      Math.abs(delays.topRight)
    );

    // Update detection states for this family
    setDetectionStates(prevStates => {
      const newStates = [...prevStates];
      newStates[familyIndex] = {
        midLeft: Math.abs(delays.midLeft) === minDelay,
        midRight: Math.abs(delays.midRight) === minDelay,
        topLeft: Math.abs(delays.topLeft) === minDelay,
        topRight: Math.abs(delays.topRight) === minDelay
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
    const gridSize = 98; // Grid size in pixels
    const canvasWidth = image.width;
    const canvasHeight = image.height;

    // Set the canvas size to match the image size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw grid lines
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.strokeStyle = "black";
    context.lineWidth = 0.8;

    // Draw vertical grid lines
    for (let x = 0; x < canvasWidth; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvasHeight);
      context.stroke();
    }

    // Draw horizontal grid lines
    for (let y = 0; y < canvasHeight; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvasWidth, y);
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

                    {/* Detected Points as Buttons */}
                    {detectionStates[index] && (
                      <>
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[index].topLeft ? "btn-danger" : "btn-primary"} lung-point top-left`}
                        >
                          {detectionStates[index].topLeft ? "Sound" : "No Sound"}
                        </button>
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[index].topRight ? "btn-danger" : "btn-primary"} lung-point top-right`}
                        >
                          {detectionStates[index].topRight ? "Sound" : "No Sound"}
                        </button>
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[index].midLeft ? "btn-danger" : "btn-primary"} lung-point mid-left`}
                        >
                          {detectionStates[index].midLeft ? "Sound" : "No Sound"}
                        </button>
                        <button 
                          type="button" 
                          className={`btn ${detectionStates[index].midRight ? "btn-danger" : "btn-primary"} lung-point mid-right`}
                        >
                          {detectionStates[index].midRight ? "Sound" : "No Sound"}
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