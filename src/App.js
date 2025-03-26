import "./App.css";
// We'll use the dynamic theme loader instead of a static import
// import "./bootstrap.css";
import UploadContainer from "./components/UploadContainer";
import LungVisualization from "./components/LungVisualization";
import { useState } from "react";
import ConvertContainer from "./components/ConvertContainer";
import NavBar from "./components/NavBar";

function App() {
  const [dataComputed, isDataComputed] = useState(false); // default == false!
  const [data, isData] = useState(null); // default == true
  const [activePage, setActivePage] = useState("home"); // Track active page

  function updateComputeState() {
    isDataComputed((prevState) => !prevState);
  }

  function setData(newData) {
    isData((prevState) => newData);
  }
  
  // Function to handle navbar navigation
  function handleNavigation(page) {
    setActivePage(page);
  }

  return (
    <div className="App">
      <NavBar onNavigate={handleNavigation} activePage={activePage} />
      
      {activePage === "home" && (
        <>
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
            {!dataComputed && <ConvertContainer />}
          </div>
        </>
      )}
      
      {activePage === "features" && (
        <div className="container mt-4">
          <h2>Features</h2>
        </div>
      )}
      
      {activePage === "about" && (
        <div className="container mt-4">
          <h2>About</h2>
        </div>
      )}
    </div>
  );
}

export default App;