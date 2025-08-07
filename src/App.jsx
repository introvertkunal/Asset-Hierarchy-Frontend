import { useEffect, useState } from 'react';
import './App.css';

function TreeNode({ node }) {
  return (
    <li className="tree-node">
      <span className="node-name">{node.name}</span>
      {node.children && node.children.length > 0 && (
        <ul className="tree-branch">
          {node.children.map((child, idx) => (
            <TreeNode key={idx} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

function App() {
  const [treeData, setTreeData] = useState(null);
  const [addName, setAddName] = useState('');
  const [addParent, setAddParent] = useState('');
  const [removeName, setRemoveName] = useState('');
  const [actionMessage, setActionMessage] = useState(''); // <-- Add this

  const handleAdd = async () => {
    if(!addName) {
      setActionMessage('Please enter a name for the new asset.');
      return;
    }
    const res = await fetch(`http://localhost:5114/api/asset/add?name=${encodeURIComponent(addName)}&parentName=${encodeURIComponent(addParent)}`,{
      method: 'POST'
    });
    const msg = await res.text();
    setActionMessage(msg);
    setAddName('');
    setAddParent('');
    // Optionally refresh tree:
    fetch('http://localhost:5114/api/asset/hierarchy')
      .then(res => res.json())
      .then(data => setTreeData(data))
      .catch(() => setTreeData(null));
  };

  const handleRemove = async () => {
    if(!removeName) {
      setActionMessage('Please enter a name of the asset to remove.');
      return;
    }
    const res = await fetch(`http://localhost:5114/api/asset/remove?name=${encodeURIComponent(removeName)}`, {
      method: 'DELETE'
    });
    const msg = await res.text();
    setActionMessage(msg);
    setRemoveName('');
    // Optionally refresh tree:
    fetch('http://localhost:5114/api/asset/hierarchy')
      .then(res => res.json())
      .then(data => setTreeData(data))
      .catch(() => setTreeData(null));
  };

  useEffect(() => {
    fetch('http://localhost:5114/api/asset/hierarchy')
      .then(res => res.json())
      .then(data => setTreeData(data))
      .catch(() => setTreeData(null));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    await fetch('http://localhost:5114/api/asset/replace-json', {
      method: 'POST',
      body: formData,
    });
    window.location.reload();
  };

  const handleDownload = async () => {
    const response = await fetch('http://localhost:5114/api/asset/downloadFile');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset_hierarchy.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Asset Hierarchy</h1>
      <div className="main-content">
        <div className="left-panel">
          <h2 className="panel-title">Hierarchy of Assets</h2>
          {treeData ? (
            <ul className="tree">
              {Array.isArray(treeData) ? (
                treeData.map((node, idx) => <TreeNode key={idx} node={node} />)
              ) : (
                <TreeNode node={treeData} />
              )}
            </ul>
          ) : (
            <p className="loading-text">Loading tree...</p>
          )}
        </div>
        <div className="right-panel">
          <h2 className="panel-title">Menu</h2>
          <div className="menu-actions">
            <div className="upload-container">
              <label htmlFor="upload-input" className="upload-label">
                Upload JSON
              </label>
              <input
                type="file"
                accept="application/json"
                id="upload-input"
                onChange={handleUpload}
                className="upload-input"
              />
            </div>
            <button onClick={handleDownload} className="download-button">
              <b>Download JSON</b>
            </button>
            <div className="asset-action-container">
              <input type="text" placeholder="Asset Name" className="asset-input" value={addName}
              onChange={(e) => setAddName(e.target.value)} />

              <input type="text" placeholder="Parent Name" className="asset-input" value={addParent}
              onChange={(e) => setAddParent(e.target.value)} />
              <button onClick={handleAdd} className="asset-action-button">ADD</button>
            </div>
            <div className="asset-action-container">
              <input type="text" placeholder="Asset Name to remove" className="asset-input" value={removeName}
              onChange={(e) => setRemoveName(e.target.value)} />
              <button onClick={handleRemove} className="asset-action-button remove">REMOVE</button>
            </div>
            {actionMessage && (
              <div className="action-message">{actionMessage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;