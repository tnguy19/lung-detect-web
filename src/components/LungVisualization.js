import LungImage from "../images/lungImage.jpg";
import { useState, useEffect } from "react";

export default function LungVisualization({ data }) {
  console.log('correlation data:', data);
  
  const [leftDetected, setLeftDetected] = useState(false);
  const [rightDetected, setRightDetected] = useState(false);


  function analyze(data) {
    let leftFound = false;
    let rightFound = false;

    for (let i = 0; i < data.length; i++) {
      if (data[i].channel === '0') {
        leftFound = true;
      } else if (data[i].channel === '1') {
        rightFound = true;
      }
    }

    setLeftDetected(leftFound);
    setRightDetected(rightFound);
  }

  useEffect(() => {
    if (data && data.length > 0) {
      analyze(data);
    }
  }, [data]);  

  return (
    <div className="visualization-container">
      <div className="lung-container">
        <img src={LungImage} alt="Lung Diagram" className="lung-image" />
        <div
          className={`lung-point left ${
            leftDetected ? "detected" : "not-detected"
          }`}
        >
          {leftDetected ? "Sound" : "No Sound"}
        </div>
        <div
          className={`lung-point right ${
            rightDetected ? "detected" : "not-detected"
          }`}
        >
          {rightDetected ? "Sound" : "No Sound"}
        </div>
      </div>
    </div>
  );
}
