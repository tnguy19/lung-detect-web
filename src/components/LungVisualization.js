import LungImage from "../images/lungImage.jpg";
import { useState, useEffect } from "react";

export default function LungVisualization({ data }) {
  console.log("correlation data:", data);

  const [leftDetected, setLeftDetected] = useState(false);
  const [rightDetected, setRightDetected] = useState(false);

  function analyze(data) {
    let leftFound = false;
    let rightFound = false;

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
    if (leftDelay <= rightDelay) {
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
