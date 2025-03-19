import "./App.css";
import UploadContainer from "./components/UploadContainer";
import LungVisualization from "./components/LungVisualization";
import { useState } from "react";
import ConvertContainer from "./components/ConvertContainer";

function App() {
  const [dataComputed, isDataComputed] = useState(false); // default == false!
  const [data, isData] = useState(null); // default == true

  function updateComputeState() {
    isDataComputed((prevState) => !prevState);
  }

  function setData(newData) {
    isData((prevState) => newData);
  }

  return (
    <div className="App">
      <h1>Lung Detect</h1>
      <div className={!dataComputed && "analysis-container"}>
        {!dataComputed && (
          <UploadContainer
            updateComputeState={updateComputeState}
            setData={setData}
          />
        )}
        {dataComputed && data && <LungVisualization data={data} />}
      </div>
      <div className={!dataComputed && "convert-container"}>
      {!dataComputed && (
          <ConvertContainer/>
        )}
      </div>
    </div>
  );
}

export default App;
