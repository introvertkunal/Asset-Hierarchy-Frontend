import React from "react";

function RemoveModal({ pendingRemoveName, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Confirm Removal</h3>
        <p>Do you really want to remove asset <b>{pendingRemoveName}</b>?</p>
        <div className="modal-actions">
          <button className="modal-btn confirm" onClick={onConfirm}>Yes, Remove</button>
          <button className="modal-btn cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default RemoveModal;
