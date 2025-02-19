import LungImage from "../images/lungImage.jpg";
import { useState, useEffect } from "react";

export default function LungVisualization({ data }) {
  console.log("correlation data in lung visualization:", data[0]);

  const [leftDetected, setLeftDetected] = useState(false);
  const [rightDetected, setRightDetected] = useState(false);

  function analyze(data) {
    let leftFound = false;
    let rightFound = false;
    let leftDelay = Infinity;
    let rightDelay = Infinity;
  
    for (let i = 0; i < data[0].length; i++) {
      console.log("datapoint:", data[0][i]); 
      let dataPoint = data[0][i]; 
  
      if (dataPoint.channel === 0) {
        leftDelay = dataPoint.delay;
      } else if (dataPoint.channel === 1) {
        rightDelay = dataPoint.delay;
      }
    }
  
    console.log("leftDelay:", leftDelay, "rightDelay:", rightDelay);
    console.log("Math.abs(leftDelay):", Math.abs(leftDelay), "Math.abs(rightDelay):", Math.abs(rightDelay));
  
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
