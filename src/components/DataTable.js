import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function DataTable({ data }) {
  const processedData = data.map(item => ({
    ...item,
    channel: item.channel,
    delay: Math.abs(item.delay).toFixed(2),
    transmission_coefficient: item.transmission_coefficient.toFixed(2),
    time: item.time ? item.time.toFixed(2) : "N/A" 
  }));

  console.log('Data in DataTable:', processedData);
  const [rowData, setRowData] = useState(processedData);

  const [colDefs, setColDefs] = useState([
    { field: "channel", headerName: "Channel" },
    { field: "delay", headerName: "Delay (ms)" },
    { field: "transmission_coefficient", headerName: "Transmission Coefficient" },
    { field: "time", headerName: "Detection Time (ms)" } 
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