import LungImage from "../images/lungImage.jpg";
import { useState, useEffect, useRef, useCallback } from "react";
import HumanBack from "../images/human_back.jpg";
import DataTable from "./DataTable";

export default function LungVisualization({ data }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null); // Reference for the image element

  const [topLeftDetected, setTopLeftDetected] = useState(false);
  const [topRightDetected, setTopRightDetected] = useState(false);
  const [midLeftDetected, setMidLeftDetected] = useState(false);
  const [midRightDetected, setMidRightDetected] = useState(false);

  function analyze(data) {
    let delays = {
      midLeft: Infinity,
      midRight: Infinity,
      topLeft: Infinity,
      topRight: Infinity,
    };

    // Extract delays for each channel
    for (let i = 0; i < data[0].length; i++) {
      let dataPoint = data[0][i];

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

    // Set detected states based on the minimum delay
    setMidLeftDetected(Math.abs(delays.midLeft) === minDelay);
    setMidRightDetected(Math.abs(delays.midRight) === minDelay);
    setTopLeftDetected(Math.abs(delays.topLeft) === minDelay);
    setTopRightDetected(Math.abs(delays.topRight) === minDelay);
  }

  useEffect(() => {
    if (data && data.length > 0) {
      analyze(data);
    }
  }, [data]);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const image = imageRef.current;

    if (!canvas || !image) return;

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

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  return (
    <div className="visualization-container">
      <div className="lung-container">
        {/* Human Back Image */}
        <img
          ref={imageRef}
          src={HumanBack}
          alt="Human Back Diagram"
          className="lung-image"
        />

        {/* Canvas Overlay */}
        <canvas ref={canvasRef} className="lung-canvas" />

        {/* Detected Points as Buttons */}
        <button type="button" className={`btn ${topLeftDetected ? "btn-danger" : "btn-primary"} lung-point top-left`}>
          {topLeftDetected ? "Sound" : "No Sound"}
        </button>
        <button type="button" className={`btn ${topRightDetected ? "btn-danger" : "btn-primary"} lung-point top-right`}>
          {topRightDetected ? "Sound" : "No Sound"}
        </button>
        <button type="button" className={`btn ${midLeftDetected ? "btn-danger" : "btn-primary"} lung-point mid-left`}>
          {midLeftDetected ? "Sound" : "No Sound"}
        </button>
        <button type="button" className={`btn ${midRightDetected ? "btn-danger" : "btn-primary"} lung-point mid-right`}>
          {midRightDetected ? "Sound" : "No Sound"}
        </button>
      </div>

      <div className="table-container">
        <DataTable data={data[0]} />
      </div>
    </div>
  );
}
