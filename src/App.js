import './App.css';
import UploadContainer from './components/UploadContainer';
import LungVisualization from './components/LungVisualization';
import { useState } from 'react';

function App() {
  const [dataComputed, isDataComputed] = useState(false) //default == false !!!

  function updateComputeState(){
    isDataComputed(prevState =>!prevState);
  }

  return (
    <div className="App">
      <h1>Lung Detect</h1>
      {!dataComputed && <UploadContainer/>}
      {dataComputed &&  <LungVisualization leftDetected={false} rightDetected={false}/>}
    </div>
  );
}

export default App;
