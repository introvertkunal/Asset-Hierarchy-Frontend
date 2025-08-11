import { useEffect, useState } from 'react';
import './App.css';

function TreeNode({ node, expanded = {}, onToggle }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded[node.name] || false;
  
  const handleClick = () => {
    if (hasChildren) {
      onToggle(node.name);
    }
  };

  return (
    <li className={`tree-node ${hasChildren ? 'has-children' : 'leaf'} ${isExpanded ? 'expanded' : ''}`}>
      <span className="node-name" onClick={handleClick}>
        {node.name}
      </span>
      {hasChildren && (
        <ul className={`tree-branch ${isExpanded ? 'expanded' : ''}`}>
          {node.children.map((child, idx) => (
            <TreeNode 
              key={idx} 
              node={child} 
              expanded={expanded}
              onToggle={onToggle}
            />
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
  const [searchName, setSearchName] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [expanded, setExpanded] = useState({});

  
  const validNameRegex = /^[a-zA-Z0-9 _]+$/;

  const handleToggle = (nodeName) => {
    setExpanded(prev => ({
      ...prev,
      [nodeName]: !prev[nodeName]
    }));
  };

  const handleAdd = async () => {
    const trimmedAddName = addName.trim();
    const trimmedAddParent = addParent.trim();

    if (!trimmedAddName) {
      setActionMessage('Please enter a name for the new asset.');
      return;
    }
    if (!validNameRegex.test(trimmedAddName)) {
      setActionMessage('Asset Name can only contain letters, digits, spaces, and underscores.');
      return;
    }
    if (trimmedAddParent && !validNameRegex.test(trimmedAddParent)) {
      setActionMessage('Parent Name can only contain letters, digits, spaces, and underscores.');
      return;
    }
    const res = await fetch(
      `http://localhost:5114/api/asset/add?name=${encodeURIComponent(trimmedAddName)}&parentName=${encodeURIComponent(trimmedAddParent)}`,
      { method: 'POST' }
    );
    const msg = await res.text();
    setActionMessage(msg);
    setAddName('');
    setAddParent('');
    fetch('http://localhost:5114/api/asset/hierarchy')
      .then(res => res.json())
      .then(data => setTreeData(data))
      .catch(() => setTreeData(null));
  };

  const handleRemove = async () => {
    const trimmedRemoveName = removeName.trim();

    if (!trimmedRemoveName) {
      setActionMessage('Please enter a name of the asset to remove.');
      return;
    }
    if (!validNameRegex.test(trimmedRemoveName)) {
      setActionMessage('Asset Name to remove can only contain letters, digits, spaces, and underscores.');
      return;
    }
    const res = await fetch(
      `http://localhost:5114/api/asset/remove?name=${encodeURIComponent(trimmedRemoveName)}`,
      { method: 'DELETE' }
    );
    const msg = await res.text();
    setActionMessage(msg);
    setRemoveName('');
    fetch('http://localhost:5114/api/asset/hierarchy')
      .then(res => res.json())
      .then(data => setTreeData(data))
      .catch(() => setTreeData(null));
  };

  const handleSearch = async () => {
    const trimmedSearchName = searchName.trim();

    if(!trimmedSearchName){
      setActionMessage('Please enter a name to search.');
      return;
    }
    if(!validNameRegex.test(trimmedSearchName)) {
      setActionMessage('Search Name can only contain letters, digits, spaces, and underscores.');
      return;
    }

    const res = await fetch(`http://localhost:5114/api/asset/search?name=${encodeURIComponent(trimmedSearchName)}`,
    { method: 'GET'});
    const data = await res.text();
    setActionMessage(data);
    setSearchName('');

  }

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
                treeData.map((node, idx) => (
                  <TreeNode 
                    key={idx} 
                    node={node} 
                    expanded={expanded}
                    onToggle={handleToggle}
                  />
                ))
              ) : (
                <TreeNode 
                  node={treeData} 
                  expanded={expanded}
                  onToggle={handleToggle}
                />
              )}
            </ul>
          ) : (
            <p className="loading-text">Loading Data.....</p>
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
            <div className="asset-action-container">
              <input type = "text" placeholder="Search Asset" className="asset-input" value={searchName}
              onChange= {(e) => setSearchName(e.target.value)} />
              <button onClick={handleSearch} className="asset-action-button search">SEARCH</button>
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