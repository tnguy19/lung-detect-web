import LungImage from "../images/lungImage.jpg";
import { useState, useEffect, useRef, useCallback } from "react";
import HumanBack from "../images/human_back.jpg";

export default function LungVisualization({ data }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null); // Reference for the image element
  const [leftDetected, setLeftDetected] = useState(false);
  const [rightDetected, setRightDetected] = useState(false);

  function analyze(data) {
    let leftFound = false;
    let rightFound = false;
    let leftDelay = Infinity;
    let rightDelay = Infinity;

    for (let i = 0; i < data[0].length; i++) {
      let dataPoint = data[0][i];

      if (dataPoint.channel === 0) {
        leftDelay = dataPoint.delay;
      } else if (dataPoint.channel === 1) {
        rightDelay = dataPoint.delay;
      }
    }

    if (Math.abs(leftDelay) < Math.abs(rightDelay)) {
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
  }, [data]);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const image = imageRef.current;

    if (!canvas || !image) return;

    const gridSize = 100; // Grid size in pixels
    const canvasWidth = image.width;
    const canvasHeight = image.height;

    // Set the canvas size to match the image size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw grid lines
    context.clearRect(0, 0, canvasWidth, canvasHeight); 
    context.strokeStyle = 'black'; 
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

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  return (
    <div className="visualization-container" style={{ position: 'relative' }}>
      <div className="lung-container" style={{ position: 'relative' }}>
        {/* human back image to overlay over */}
        <img
          ref={imageRef}
          src={HumanBack}
          alt="Human Back Diagram"
          className="lung-image"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Canvas overlay*/}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none', // Allow interaction with underlying elements
          }}
        />

        {/* Detected points */}
        <div
          className={`lung-point left ${leftDetected ? "detected" : "not-detected"}`}
        >
          {leftDetected ? "Sound" : "No Sound"}
        </div>
        <div
          className={`lung-point right ${rightDetected ? "detected" : "not-detected"}`}
        >
          {rightDetected ? "Sound" : "No Sound"}
        </div>
      </div>
    </div>
  );
}
