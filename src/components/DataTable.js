import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function DataTable({ data }) {
  // Ensure delay values are absolute before setting state and limit to 2 decimal places
  const processedData = data.map(item => ({
    ...item,
    channel: item.channel,
    delay: Math.abs(item.delay).toFixed(2),
    transmission_coefficient: item.transmission_coefficient.toFixed(2),
  }));

  console.log('Data in DataTable:', processedData);
  const [rowData, setRowData] = useState(processedData);

  const [colDefs, setColDefs] = useState([
    { field: "channel", headerName: "Channel" },
    { field: "delay", headerName: "Delay" },
    { field: "transmission_coefficient", headerName: "Transmission Coefficient" },
  ]);

  return (
    <div style={{ height: 200, width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        domLayout='autoHeight' 
      />
    </div>
  );
}
