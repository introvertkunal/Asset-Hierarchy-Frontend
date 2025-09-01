// components/FocusedNodeView.jsx
import React from 'react';

function FocusedNodeView({ node, parent }) {
  return (
    <div className="focused-node-view">
      <div className="focused-item current">
        <strong>ID:</strong> {node.id}<br />
        <strong>Asset Name:</strong> {node.name}
      </div>
      {parent && parent.name && (
        <div className="focused-item parent">
          <strong>Parent:</strong> {parent.name}
        </div>
      )}
      {node.children && node.children.length > 0 && (
        <div className="focused-item child">
          <strong>Child Asset:</strong>
          <ul>
            {node.children.map((child, idx) => (
              <li key={idx}>{child.name} (ID: {child.id})</li>
            ))}
          </ul>
        </div>
      )}
      {/* {node.signals && node.signals.length > 0 && (
        <div className="focused-item">
          <strong>Signals:</strong>
          <ul>
            {node.signals.map((signal, idx) => (
              <li key={idx}>
                {signal.signalName} (Type: {signal.signalType}, Description: {signal.description})
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  );
}

export default FocusedNodeView;