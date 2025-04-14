import React, { useState } from 'react';
import AudioPlayback from '../services/AudioPlayback';

export default function DataTable({ data, audioFile, onPlaybackStart, onPlaybackComplete }) {
  const [expandedRow, setExpandedRow] = useState(null);

  // Toggle expanded row
  const toggleExpandRow = (index) => {
    if (expandedRow === index) {
      setExpandedRow(null);
    } else {
      setExpandedRow(index);
    }
  };

  // Check if we have adjusted time data
  const hasAdjustedTime = data.length > 0 && 'adjusted_time' in data[0];

  return (
    <div className="data-table-container">
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr className="table-header">
              <th>Channel</th>
              <th>Delay (ms)</th>
              <th>Transmission</th>
              <th>Display (ms)</th>
              {audioFile && <th>Audio</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <React.Fragment key={index}>
                <tr 
                  className={expandedRow === index ? 'selected-row' : ''}
                  onClick={() => toggleExpandRow(index)}
                >
                  <td>{item.channel}</td>
                  <td>{item.delay.toFixed(2)}</td>
                  <td>{item.transmission_coefficient.toFixed(3)}</td>
                  <td>{(item.adjusted_time || item.time).toFixed(2)}</td>
                  {audioFile && (
                    <td>
                      <AudioPlayback 
                        audioFile={audioFile} 
                        timeMs={item.raw_time || item.time} // Using raw_time for playback
                        channel={item.channel}
                        playbackDuration={2000}
                        onPlaybackStart={() => onPlaybackStart && onPlaybackStart(item.channel)}
                        onPlaybackComplete={() => onPlaybackComplete && onPlaybackComplete()}
                      />
                    </td>
                  )}
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-info expand-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandRow(index);
                      }}
                    >
                      <i className={`fas fa-chevron-${expandedRow === index ? 'up' : 'down'}`}></i>
                    </button>
                  </td>
                </tr>
                {expandedRow === index && (
                  <tr className="expanded-row">
                    <td colSpan={audioFile ? 6 : 5}>
                      <div className="expanded-content">
                        <div className="expanded-details">
                          <h6>Channel {item.channel} Details</h6>
                          <div className="detail-grid">
                            <div className="detail-group">
                              <div className="detail-label">Detection Time:</div>
                              <div className="detail-value">{(item.adjusted_time || item.time).toFixed(2)} ms</div>
                            </div>
                            <div className="detail-group">
                              <div className="detail-label">Playback Time:</div>
                              <div className="detail-value">{(item.raw_time || item.time).toFixed(2)} ms</div>
                            </div>
                            <div className="detail-group">
                              <div className="detail-label">Delay:</div>
                              <div className="detail-value">{item.delay.toFixed(2)} ms</div>
                            </div>
                            <div className="detail-group">
                              <div className="detail-label">Transmission Coefficient:</div>
                              <div className="detail-value">{item.transmission_coefficient.toFixed(3)}</div>
                            </div>
                            {item.adjusted_delay && (
                              <div className="detail-group">
                                <div className="detail-label">Adjusted Delay:</div>
                                <div className="detail-value">{item.adjusted_delay.toFixed(2)} ms</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}