import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

/* Template to pass in data
const GridExample = () => {
  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState([
      { make: "Tesla", model: "Model Y", price: 64950, electric: true },
      { make: "Ford", model: "F-Series", price: 33850, electric: false },
      { make: "Toyota", model: "Corolla", price: 29600, electric: false },
  ]);

  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState([
      { field: "make" },
      { field: "model" },
      { field: "price" },
      { field: "electric" }
  ]);

  // ...
}
*/

export default function DataTable({ data }) {
  // Ensure delay values are absolute before setting state and at most 2 decimals place only 
  const processedData = data.map(item => ({
    ...item,
    channel: item.channel,
    delay: Math.abs(item.delay).toFixed(2),
    transmission_coefficient: item.transmission_coefficient.toFixed(2),
  }));

  console.log('Data in DataTable:', processedData);
  const [rowData, setRowData] = useState(processedData);

  const [colDefs, setColDefs] = useState([
    { field: "channel"},
    { field: "delay"},
    { field: "transmission_coefficient" },
  ]);

  return (
    // Data Grid will fill the size of the parent container
    <div style={{ height: 500, width: '100%' }}>
        <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
            domLayout='autoHeight' 
        />
    </div>
  );
}
