import LungImage from "../images/lungImage.jpg";

export default function LungVisualization({ leftDetected, rightDetected }) {
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
