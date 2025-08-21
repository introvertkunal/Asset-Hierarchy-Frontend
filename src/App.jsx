import { useEffect, useState, useRef, useCallback } from 'react';
import './App.css';
import SuggestionInput from './components/SuggestionInput.jsx';
import TreeNode from './components/TreeNode.jsx';
import FilteredTreeNode from './components/FilteredTreeNode.jsx';
import FocusedNodeView from './components/FocusedNodeView.jsx';
import RemoveModal  from './components/RemoveModal.jsx';
import useMessageTimeout from './hooks/useMessageTimeout.js';
import {filterTree, findNodeAndParent, buildAssetMap } from './Utils/treeUtils.js';  
import { addAsset, downloadFile, fetchHierarchy, removeAsset, uploadFile } from './services/api.js';




function App() {

  const [refreshKey, setRefreshKey] = useState(0);
  const [treeData, setTreeData] = useState(null);
  const [addName, setAddName] = useState('');
  const [addParent, setAddParent] = useState('');
  const [removeName, setRemoveName] = useState('');
  const [searchName, setSearchName] = useState('');
  const [actionMessage, setActionMessage] = useMessageTimeout('');
  const [expanded, setExpanded] = useState({});
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [pendingRemoveName, setPendingRemoveName] = useState('');
  const [assetMap, setAssetMap] = useState(new Map());
  const [suggestions, setSuggestions] = useState([]);
  const [focusedNode, setFocusedNode] = useState(null);
  const [showFocusedView, setShowFocusedView] = useState(false);
  const [parentSuggestions, setParentSuggestions] = useState([]);
  const [removeSuggestions, setRemoveSuggestions] = useState([]);
  const [filteredTreeData, setFilteredTreeData] = useState(null);

  
 const loadData = async () =>{
        try{
           const data = await fetchHierarchy();
           setTreeData(data);
           setAssetMap(buildAssetMap(data));
        }catch(err){
           setActionMessage(err.message);
        }
    }
     
  //  Initial Data loaded
  useEffect(()=> {
    loadData();
  }
    ,[refreshKey]);

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
   
    const msg = await addAsset(trimmedAddName, trimmedAddParent);
    setActionMessage(msg);
    setAddName('');
    setAddParent('');
    setRefreshKey(prev=> prev+1);
  };

  const handleRemoveClick = () => {
    const trimmedRemoveName = removeName.trim();
    if (!trimmedRemoveName) {
      setActionMessage('Please enter a name of the asset to remove.');
      return;
    }
    if (!validNameRegex.test(trimmedRemoveName)) {
      setActionMessage('Asset Name to remove can only contain letters, digits, spaces, and underscores.');
      return;
    }
    setPendingRemoveName(trimmedRemoveName);
    setShowRemoveModal(true);
  };

  const handleRemoveConfirm = async () => {
    setShowRemoveModal(false);
    
    const msg = await removeAsset(pendingRemoveName);
    setActionMessage(msg);
    setRemoveName('');
    setPendingRemoveName('');
    setRefreshKey(prev=> prev+1);
  };

  const handleRemoveCancel = () => {
    setShowRemoveModal(false);
    setPendingRemoveName('');
    setActionMessage('Asset removal cancelled.');
  };

  const handleSearch = async (searchTerm) => {
    const trimmedSearchName = searchTerm.trim();

    if(!trimmedSearchName) {
      setActionMessage('Please enter a name to search.');
      return;
    }
    if(!validNameRegex.test(trimmedSearchName)) {
      setActionMessage('Search Name can only contain letters, digits, spaces, and underscores.');
      return;
    }

    const result = findNodeAndParent(treeData, trimmedSearchName);
    if (result) {
      setFocusedNode(result);
      setShowFocusedView(true);
      setActionMessage('');
    } else {
      setFocusedNode(null);
      setShowFocusedView(false);
      setActionMessage('Asset not found.');
    }
    setSearchName('');
    setSuggestions([]);
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try{
    const msg = await uploadFile(file);
    setActionMessage(msg);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }catch(err){
    setActionMessage(err.message);
  }
  };

  const handleDownload = async () => {
    
    const blob = await downloadFile();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset_hierarchy.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSearchInput = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchName(value);
    
    if (value.trim() === '') {
      setSuggestions([]);
      setFilteredTreeData(null);
      return;
    }

    // Filter tree based on search input
    const filteredTree = filterTree(treeData, value);
    setFilteredTreeData(filteredTree);

    // Get suggestions from assetMap
    const matches = Array.from(assetMap.entries())
      .filter(([key]) => key.includes(value))
      .map(([_, originalName]) => originalName)
      .slice(0, 5);
    setSuggestions(matches);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchName(suggestion);
    setSuggestions([]);
    // Perform the search
    handleSearch(suggestion);
  };

  const handleParentInput = (e) => {
    const value = e.target.value.toLowerCase();
    setAddParent(e.target.value);
    
    if (value.trim() === '') {
      setParentSuggestions([]);
      return;
    }

    const matches = Array.from(assetMap.entries())
      .filter(([key]) => key.includes(value))
      .map(([_, originalName]) => originalName)
      .slice(0, 5); // Limit to 5 suggestions
    
    setParentSuggestions(matches);
  };

  const handleRemoveInput = (e) => {
    const value = e.target.value.toLowerCase();
    setRemoveName(e.target.value);
    
    if (value.trim() === '') {
      setRemoveSuggestions([]);
      return;
    }

    const matches = Array.from(assetMap.entries())
      .filter(([key]) => key.includes(value))
      .map(([_, originalName]) => originalName)
      .slice(0, 5); // Limit to 5 suggestions
    
    setRemoveSuggestions(matches);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Asset Hierarchy</h1>
      
      {/* Search Section */}
      <div className="search-container">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search Asset..." 
            className="search-input"
            value={searchName}
            onChange={handleSearchInput}
          />
          <button onClick={() => handleSearch(searchName)} className="search-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul className="search-suggestions">
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-item"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        {actionMessage && (
          <div className="search-message">{actionMessage}</div>
        )}
      </div>
      
      {/* Left Panel */}
      <div className="main-content">
        <div className="left-panel">
          <h2 className="panel-title">
            {showFocusedView ? (
              <div className="title-with-back">
                <button className="back-button" onClick={() => setShowFocusedView(false)}>
                  ← Back
                </button>
                Focused View
              </div>
            ) : searchName.trim() ? (
              <div className="title-with-back">
                <button className="back-button" onClick={() => setSearchName('')}>
                  ← Back
                </button>
                Filtered View
              </div>
            ) : (
              "Hierarchy of Assets"
            )}
          </h2>
          {showFocusedView && focusedNode ? (
            <FocusedNodeView node={focusedNode.node} parent={focusedNode.parent} />
          ) : searchName.trim() && filteredTreeData ? (
            <ul className="tree filtered-tree">
              {Array.isArray(filteredTreeData) ? (
                filteredTreeData.map((node, idx) => (
                  <FilteredTreeNode 
                    key={idx} 
                    node={node}
                  />
                ))
              ) : (
                <FilteredTreeNode node={filteredTreeData} />
              )}
            </ul>
          ) : (
            treeData ? (
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
            )
          )}
        </div>
        {/* Right panel */}
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
              <input 
                type="text" 
                placeholder="Asset Name" 
                className="asset-input" 
                value={addName}
                onChange={(e) => setAddName(e.target.value)} 
              />
              <SuggestionInput
                placeholder="Parent Name"
                value={addParent}
                onChange={handleParentInput}
                suggestions={parentSuggestions}
                onSuggestionClick={(suggestion) => {
                  setAddParent(suggestion);
                  setParentSuggestions([]);
                }}
                className="asset-input"
              />
              <button onClick={handleAdd} className="asset-action-button">ADD</button>
            </div>
            <div className="asset-action-container">
              <SuggestionInput
                placeholder="Asset Name to remove"
                value={removeName}
                onChange={handleRemoveInput}
                suggestions={removeSuggestions}
                onSuggestionClick={(suggestion) => {
                  setRemoveName(suggestion);
                  setRemoveSuggestions([]);
                }}
                className="asset-input"
              />
              <button onClick={handleRemoveClick} className="asset-action-button remove">REMOVE</button>
            </div>
          </div>
        </div>
      </div>
       {showRemoveModal && (
        <RemoveModal 
          pendingRemoveName={pendingRemoveName} 
          onConfirm={handleRemoveConfirm} 
          onCancel={handleRemoveCancel} 
        />
      )}
    </div>
  );
}

export default App;