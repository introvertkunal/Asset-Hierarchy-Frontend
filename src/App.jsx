import { useEffect, useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import * as signalR from '@microsoft/signalr';
import { useSelector, useDispatch } from 'react-redux';
import { clearUser } from './store/authSlice';
import './App.css';
import TreeNode from './components/TreeNode.jsx';
import FilteredTreeNode from './components/FilteredTreeNode.jsx';
import FocusedNodeView from './components/FocusedNodeView.jsx';
import { filterTree, findNodeAndParent, buildAssetMap, countAssets } from './Utils/treeUtils.js';
import './panels/searchbar.css';
import './panels/leftpaneltree.css';
import './panels/signals.css';
import { addChildNode, addRoot, downloadFile, fetchHierarchy, removeAsset, searchAsset, updateAsset, reorderAsset, replaceFile } from './services/api.js';
import { fetchSignalsByAssetId, addSignal, removeSignal, updateSignal, AverageSignal } from './services/api.js';
import Fuse from 'fuse.js';
import infoIcon from "./info.png";
import Average from "./average.png";
import { ToastContainer, toast } from 'react-toastify'; // Import react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS

function App() {
  const dispatch = useDispatch();
  const { userName, roles } = useSelector((state) => state.auth);

  // Essential states (removed actionMessage and useMessageTimeout)
  const [refreshKey, setRefreshKey] = useState(0);
  const [treeData, setTreeData] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [expanded, setExpanded] = useState({});
  const [assetMap, setAssetMap] = useState(new Map());
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [focusedNode, setFocusedNode] = useState(null);
  const [showFocusedView, setShowFocusedView] = useState(false);
  const [filteredTreeData, setFilteredTreeData] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [addError, setAddError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAddError, setChildAddError] = useState('');
  const [signals, setSignals] = useState([]);
  const [showSignals, setShowSignals] = useState(true);
  const [showAddSignalModal, setShowAddSignalModal] = useState(false);
  const [signalForm, setSignalForm] = useState({ signalName: '', signalType: 'Integer', description: '' });
  const [signalError, setSignalError] = useState('');
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [editSignal, setEditSignal] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDeleteSignalModal, setShowDeleteSignalModal] = useState(false);
  const [signalToDelete, setSignalToDelete] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Validation regex
  const validNameRegex = /^[a-zA-Z][a-zA-Z0-9 _]*$/;

  // Check if user is Admin
  const isAdmin = roles.includes('Admin');

  // SignalR connection setup
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7036/notificationHub', {
        withCredentials: true,
      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveNotification', (id, message) => {
      setNotifications((prev) => [
        ...prev,
        { id, message, timestamp: new Date().toLocaleTimeString() },
      ]);
      if(message.trim().startsWith('Average')){
      toast.info(message); // Show notification as toast
      }
    });

    connection.start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => toast.error('SignalR Connection Error: ' + err.message));

    return () => {
      connection.stop();
    };
  }, []);

  // Load initial data
  const loadData = async () => {
    try {
      const data = await fetchHierarchy();
      setTreeData(data);
      setAssetMap(buildAssetMap(data));
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('https://localhost:7036/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      console.log('Logout response:', response.json());
      dispatch(clearUser());
      window.location.href = '/login';
    } catch (err) {
      toast.error(err.message);
    }
  };

  const loadSignals = useCallback(async () => {
    if (!focusedNode || !focusedNode.node?.id) {
      setSignals([]);
      return;
    }
    setLoadingSignals(true);
    try {
      const data = await fetchSignalsByAssetId(focusedNode.node.id);
      setSignals(data);
    } catch (err) {
      setSignals([]);
      
    }
    setLoadingSignals(false);
  }, [focusedNode]);

  useEffect(() => {
    loadSignals();
  }, [loadSignals]);

  // Toggle show/hide signals
  const toggleShowSignals = () => {
    setShowSignals((prev) => !prev);
  };

  // Handle input change in add/edit signal modal
  const handleSignalInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'signalName' && value.length > 30) {
      setSignalError('Signal name must not exceed 30 characters.');
      return;
    }
    if (name === 'description' && value.length > 200) {
      setSignalError('Description must not exceed 200 characters.');
      return;
    }
    setSignalForm((prev) => ({ ...prev, [name]: value }));
    setSignalError('');
  };

  // Validate Signal form
  const validateSignalForm = () => {
    const trimmedName = signalForm.signalName.trim();
    if (!trimmedName) {
      setSignalError('Please enter a signal name.');
      return false;
    }
    if (trimmedName.length > 30) {
      setSignalError('Signal name must not exceed 30 characters.');
      return false;
    }
    if (!validNameRegex.test(trimmedName)) {
      setSignalError('Signal name must start with a letter and contain only letters, digits, spaces, or underscores.');
      return false;
    }
    if (signalForm.description.length > 200) {
      setSignalError('Description must not exceed 200 characters.');
      return false;
    }
    setSignalError('');
    return true;
  };

  const handleAverageClick = async (signalId) => {
    if (!isAdmin) {
      toast.error('Only Admins can set average values');
      return;
    }
    try {
      const msg = await AverageSignal(signalId);
      toast.success(msg);
    } catch (err) {
      toast.error(err.message || 'Failed to calculate average');
    }
  };

  // Submit new signal
  const handleAddSignal = async () => {
    if (!isAdmin) {
      setSignalError('Only Admins can add signals');
      return;
    }
    if (!validateSignalForm()) return;

    try {
      const newSignal = {
        SignalName: signalForm.signalName.trim(),
        SignalType: signalForm.signalType,
        Description: signalForm.description.trim(),
      };
      const msg = await addSignal(focusedNode.node.id, newSignal);
      toast.success(msg);
      setShowAddSignalModal(false);
      setSignalForm({ signalName: '', signalType: 'Integer', description: '' });
      loadSignals();
    } catch (err) {
      setSignalError(err.message || 'Failed to add signal.');
      console.log(err.message);
    }
  };

  // Cancel add signal modal
  const handleAddSignalCancel = () => {
    setShowAddSignalModal(false);
    setSignalForm({ signalName: '', signalType: 'Integer', description: '' });
    setSignalError('');
  };

  // Remove signal with modal confirmation
  const handleRemoveSignal = (signalId) => {
    if (!isAdmin) {
      toast.error('Only Admins can delete signals');
      return;
    }
    setSignalToDelete(signalId);
    setShowDeleteSignalModal(true);
  };

  const handleDeleteSignalConfirm = async () => {
    if (!isAdmin || !signalToDelete) return;
    try {
      const msg = await removeSignal(signalToDelete);
      toast.success(msg);
      setShowDeleteSignalModal(false);
      setSignalToDelete(null);
      loadSignals();
    } catch (err) {
      toast.error(err.message);
      setShowDeleteSignalModal(false);
      setSignalToDelete(null);
    }
  };

  const handleDeleteSignalCancel = () => {
    setShowDeleteSignalModal(false);
    setSignalToDelete(null);
    toast.info('Signal deletion cancelled.');
  };

  const handleEditSignalClick = (signal) => {
    if (!isAdmin) {
      toast.error('Only Admins can edit signals');
      return;
    }
    setEditSignal(signal);
    setSignalForm({
      signalName: signal.signalName || signal.SignalName,
      signalType: signal.signalType || signal.SignalType,
      description: signal.description || signal.Description || '',
    });
    setShowAddSignalModal(true);
  };

  const handleUpdateSignal = async () => {
    if (!isAdmin) {
      setSignalError('Only Admins can update signals');
      return;
    }
    if (!editSignal) return;
    if (!validateSignalForm()) return;

    try {
      const updatedSignal = {
        signalId: editSignal.id || editSignal.signalId || editSignal.SignalId,
        signalName: signalForm.signalName.trim(),
        signalType: signalForm.signalType,
        description: signalForm.description.trim(),
        assetId: focusedNode.node.id,
      };

      const msg = await updateSignal(
        editSignal.id || editSignal.signalId || editSignal.SignalId,
        updatedSignal
      );

      toast.success(msg);
      setShowAddSignalModal(false);
      setEditSignal(null);
      setSignalForm({ signalName: '', signalType: 'Integer', description: '' });
      loadSignals();
    } catch (err) {
      setSignalError(err.message || 'Failed to update signal.');
    }
  };

  const handleModalCancel = () => {
    setShowAddSignalModal(false);
    setEditSignal(null);
    setSignalForm({ signalName: '', signalType: 'Integer', description: '' });
    setSignalError('');
  };

  // Tree handling functions
  const handleToggle = (nodeId) => {
    setExpanded((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleNodeClick = (nodeId) => {
    const result = findNodeAndParent(treeData, nodeId);
    if (result) {
      setFocusedNode(result);
      setShowFocusedView(true);
      setEditMode(false);
      setEditName(result.node.name);
    } else {
      setFocusedNode(null);
      setShowFocusedView(false);
      toast.error('Asset not found.');
    }
  };

  // Drag-and-drop handling
  const isDescendant = (parent, child, treeData) => {
    if (!parent || !child) return false;
    let current = child;

    while (current) {
      if (current.id === parent.id) return true;
      const parentNode = current.parentId
        ? findNodeAndParent(treeData, current.parentId)?.node
        : null;
      current = parentNode;
    }

    return false;
  };

  const handleDragStart = (node) => {
    if (!node) {
      toast.error('Invalid node selected for dragging.');
      return;
    }
    setDraggedNode(node);
  };

  const handleDrop = (targetNode) => {
    if (!isAdmin) {
      toast.error('Only Admins can reorder assets.');
      setDraggedNode(null);
      return;
    }

    if (draggedNode.parentId === targetNode.id) {
      toast.error('Node already exists under this parent.');
      setDraggedNode(null);
      return;
    }

    if (!draggedNode || !targetNode) {
      toast.error('Invalid drag or drop target.');
      setDraggedNode(null);
      return;
    }

    if (draggedNode.id === targetNode.id) {
      toast.error('Cannot drop a node onto itself.');
      setDraggedNode(null);
      return;
    }

    if (isDescendant(draggedNode, targetNode, treeData)) {
      toast.error('Not allowed - Cannot make a parent a child of its descendant.');
      setDraggedNode(null);
      return;
    }

    if (isDescendant(targetNode, draggedNode, treeData)) {
      toast.error('Not allowed - Cannot make a child a parent of its ancestor.');
      setDraggedNode(null);
      return;
    }

    setDropTarget(targetNode);
    setShowReorderModal(true);
  };

  const handleReorderConfirm = async () => {
    if (!isAdmin) {
      toast.error('Only Admins can reorder assets');
      setShowReorderModal(false);
      return;
    }
    try {
      const msg = await reorderAsset(draggedNode.id, dropTarget.id);
      toast.success(msg);
      setShowReorderModal(false);
      setDraggedNode(null);
      setDropTarget(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message);
      setShowReorderModal(false);
      setDraggedNode(null);
      setDropTarget(null);
    }
  };

  const handleReorderCancel = () => {
    setShowReorderModal(false);
    setDraggedNode(null);
    setDropTarget(null);
    toast.info('Reorder cancelled.');
  };

  // Root asset handling
  const handleRootAdd = async () => {
    if (!isAdmin) {
      setAddError('Only Admins can add root assets');
      return;
    }
    const trimmedNewAssetName = newAssetName.trim();
    if (!trimmedNewAssetName) {
      setAddError('Please enter a name for the new asset.');
      return;
    }
    if (trimmedNewAssetName.length > 30) {
      setAddError('Asset name must not exceed 30 characters.');
      return;
    }
    if (!validNameRegex.test(trimmedNewAssetName)) {
      setAddError('Asset name must start with a letter and contain only letters, digits, spaces, or underscores.');
      return;
    }
    setAddError('');

    try {
      const msg = await addRoot(trimmedNewAssetName, null);
      toast.success(msg);
      setNewAssetName('');
      setShowAddModal(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      setAddError(err.message || 'Failed to add asset.');
    }
  };

  // Modal handling
  const handleAddModalCancel = () => {
    setShowAddModal(false);
    setNewAssetName('');
    setAddError('');
  };

  // Child asset handling
  const handleAddChild = async () => {
    if (!isAdmin) {
      setChildAddError('Only Admins can add child assets');
      return;
    }
    const trimmedChildName = childName.trim();
    if (!trimmedChildName) {
      setChildAddError('Please enter a name for the new child asset.');
      return;
    }
    if (trimmedChildName.length > 30) {
      setChildAddError('Asset name must not exceed 30 characters.');
      return;
    }
    if (!validNameRegex.test(trimmedChildName)) {
      setChildAddError('Asset name must start with a letter and contain only letters, digits, spaces, or underscores.');
      return;
    }
    setChildAddError('');

    if (focusedNode) {
      try {
        const msg = await addChildNode(trimmedChildName, focusedNode.node.id);
        toast.success(msg);
        setChildName('');
        setShowAddChildModal(false);
        const updatedTreeData = await fetchHierarchy();
        setTreeData(updatedTreeData);
        setAssetMap(buildAssetMap(updatedTreeData));
        const updatedNode = findNodeAndParent(updatedTreeData, focusedNode.node.id);
        if (updatedNode) {
          setFocusedNode(updatedNode);
        } else {
          toast.error('Failed to refresh focused node.');
        }
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        setChildAddError(err.message || 'Failed to add child asset.');
      }
    }
  };

  const handleAddChildModalCancel = () => {
    setShowAddChildModal(false);
    setChildName('');
    setChildAddError('');
  };

  // Delete handling
  const handleDeleteClick = () => {
    if (!isAdmin) {
      toast.error('Only Admins can delete assets');
      return;
    }
    if (focusedNode) {
      setShowDeleteModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!isAdmin) {
      toast.error('Only Admins can delete assets');
      return;
    }
    setShowDeleteModal(false);
    if (focusedNode) {
      try {
        const msg = await removeAsset(focusedNode.node.id);
        toast.success(msg);
        setFocusedNode(null);
        setShowFocusedView(false);
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    toast.info('Asset deletion cancelled.');
  };

  // Edit handling
  const handleEditClick = () => {
    if (!isAdmin) {
      toast.error('Only Admins can edit assets');
      return;
    }
    if (focusedNode) {
      setEditMode(true);
      setEditName(focusedNode.node.name);
    }
  };

  const handleEditSave = async () => {
    if (!isAdmin) {
      toast.error('Only Admins can edit assets');
      return;
    }
    if (focusedNode) {
      const trimmedEditName = editName.trim();
      if (!trimmedEditName) {
        toast.error('Please enter a name for the asset.');
        return;
      }
      if (trimmedEditName.length > 30) {
        toast.error('Asset name must not exceed 30 characters.');
        return;
      }
      if (!validNameRegex.test(trimmedEditName)) {
        toast.error('Asset name must start with a letter and contain only letters, digits, spaces, or underscores.');
        return;
      }

      try {
        const msg = await updateAsset(focusedNode.node.id, trimmedEditName);
        toast.success(msg);
        setEditMode(false);
        setFocusedNode((prev) => ({
          node: { ...prev.node, name: trimmedEditName },
          parent: prev.parent,
        }));
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditName(focusedNode?.node.name || '');
    toast.info('Edit cancelled.');
  };

  // Search handling
  const handleSearch = async (searchTerm) => {
    const trimmedSearchName = searchTerm.trim();

    if (!trimmedSearchName) {
      toast.error('Please enter a name to search.');
      return;
    }
    if (!validNameRegex.test(trimmedSearchName)) {
      toast.error('Search name must start with a letter and contain only letters, digits, spaces, or underscores.');
      return;
    }

    try {
      const result = await searchAsset(trimmedSearchName);
      setFocusedNode({
        node: {
          id: result.id,
          name: result.name,
          children: result.children,
          signals: result.signals,
        },
        parent: { name: result.parentName },
      });
      setShowFocusedView(true);
    } catch (err) {
      setFocusedNode(null);
      setShowFocusedView(false);
      toast.error(err.message);
    }
    setSearchName('');
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
  };

  // File handling
  const handleUpload = async (e) => {
    if (!isAdmin) {
      toast.error('Only Admins can upload files');
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      if (!text.trim()) {
        toast.error('File is empty');
        setTimeout(() => { window.location.reload(); }, 1000);
        return;
      }
      const msg = await replaceFile(file);
      toast.success(msg);
      setTimeout(() => { window.location.reload(); }, 1000);
    } catch (err) {
      toast.error(err.message);
      setTimeout(() => { window.location.reload(); }, 1000);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadFile();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'asset_hierarchy.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Search suggestions
  const fuse = new Fuse(
    Array.from(assetMap.entries()).map(([id, name]) => ({ id, name })),
    {
      keys: ['name'],
      includeScore: true,
      threshold: 0.4,
    }
  );

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setSelectedSuggestionIndex(-1);

    if (value.trim() === '') {
      setSuggestions([]);
      setFilteredTreeData(null);
      return;
    }

    const filteredTree = filterTree(treeData, value);
    setFilteredTreeData(filteredTree);

    const results = fuse.search(value).slice(0, 5);
    setSuggestions(results.map((r) => r.item));
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => {
        const nextIndex = Math.min(prev + 1, suggestions.length - 1);
        setSearchName(suggestions[nextIndex].name);
        return nextIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => {
        const nextIndex = Math.max(prev - 1, -1);
        setSearchName(nextIndex === -1 ? '' : suggestions[nextIndex].name);
        return nextIndex;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
        const selectedSuggestion = suggestions[selectedSuggestionIndex];
        setSearchName(selectedSuggestion.name);
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
        handleNodeClick(selectedSuggestion.id);
      } else {
        handleSearch(searchName);
      }
    }
  };

  const handleSuggestionClick = (suggestion, index) => {
    setSearchName(suggestion.name);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    handleNodeClick(suggestion.id);
  };

  // Info modal handling
  const handleInfoClick = () => {
    setShowInfoModal(true);
  };

  const handleInfoModalClose = () => {
    setShowInfoModal(false);
  };

  // Example JSON for the modal
  const exampleJson = `[
  {
    "Id": 1,
    "Name": "SteelPlant",
    "ParentId": null,
    "Children": [
      {
        "Id": 2,
        "Name": "BlastFurnace",
        "ParentId": 1,
        "Children": [],
        "Signals": [
          {
            "SignalId": 3,
            "SignalName": "FurnaceStatus",
            "SignalType": "Integer",
            "Description": "Indicates furnace operational status"
          }
        ]
      }
    ],
    "Signals": [
      {
        "SignalId": 7,
        "SignalName": "PlantPowerConsumption",
        "SignalType": "Real",
        "Description": "Overall power usage of steel plant"
      }
    ]
  }
]`;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <div className="header-container">
          <div className="header-left">
            <button onClick={handleLogout} className="logout-button">Logout</button>
            <p className="userName">{userName || 'Unknown User'}</p>
          </div>
          <div className="json-buttons">
            {isAdmin && (
              <>
                <img
                  src={infoIcon}
                  alt="Info"
                  className="info-icon"
                  onClick={handleInfoClick}
                  title='JSON Format Info'
                  style={{ width: '25px', height: '25px', cursor: 'pointer', color: 'white' }}
                />
                <label htmlFor="upload-input" className="json-button import-button">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" fill="none" />
                    <path d="M12 16V8m0 0l-4 4m4-4l4 4" />
                  </svg>
                  Import JSON
                </label>
                <input
                  type="file"
                  accept="application/json"
                  id="upload-input"
                  onChange={handleUpload}
                  className="upload-input"
                />
              </>
            )}
            <button onClick={handleDownload} className="json-button export-button">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                stroke="white"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2" fill="none" />
                <path d="M12 8v8m0 0l-4-4m4 4l4-4" />
              </svg>
              Export JSON
            </button>
          </div>
        </div>
        <h1 className="app-title">Asset Hierarchy</h1>

        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search Asset by Name..."
              className="search-input"
              value={searchName}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
            />
            <button onClick={() => handleSearch(searchName)} className="search-button">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            {suggestions.length > 0 && (
              <ul className="search-suggestions">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => handleSuggestionClick(s, i)}
                    className={`suggestion-item ${i === selectedSuggestionIndex ? 'selected' : ''}`}
                  >
                    {s.name} (ID: {s.id})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="main-content">
          <div className="left-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                {searchName.trim() ? (
                  <div className="title-with-back">
                    <button className="back-button" onClick={() => setSearchName('')}>
                      ← Back
                    </button>
                    Filtered View
                  </div>
                ) : (
                  <div className="title-with-count">
                    <span>Hierarchy of Assets</span>
                    <span className="assets-count">{treeData ? countAssets(treeData) : '0'}</span>
                  </div>
                )}
              </h2>
              {isAdmin && (
                <button className="Btn" onClick={() => setShowAddModal(true)}>
                  <div className="sign">+</div>
                  <div className="text">Add</div>
                </button>
              )}
            </div>

            {searchName.trim() && filteredTreeData ? (
              <ul className="tree filtered-tree">
                {Array.isArray(filteredTreeData) ? (
                  filteredTreeData.map((node, idx) => (
                    <FilteredTreeNode
                      key={idx}
                      node={node}
                      onNodeClick={handleNodeClick}
                      onDragStart={handleDragStart}
                      onDrop={handleDrop}
                    />
                  ))
                ) : (
                  <FilteredTreeNode
                    node={filteredTreeData}
                    onNodeClick={handleNodeClick}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                  />
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
                        onNodeClick={handleNodeClick}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                      />
                    ))
                  ) : (
                    <TreeNode
                      node={treeData}
                      expanded={expanded}
                      onToggle={handleToggle}
                      onNodeClick={handleNodeClick}
                      onDragStart={handleDragStart}
                      onDrop={handleDrop}
                    />
                  )}
                </ul>
              ) : (
                <p className="loading-text">Loading Data.....</p>
              )
            )}
          </div>

          <div className="right-panel">
            <div className="panel-header">
              <h3 className="panel-title">Selected Asset</h3>
              {showFocusedView && focusedNode && isAdmin && (
                <div className="asset-actions">
                  <button
                    className="Btn"
                    onClick={() => setShowAddChildModal(true)}
                  >
                    <div className="sign">+</div>
                    <div className="text">Add</div>
                  </button>
                  <button
                    className="action-button edit edit-button"
                    onClick={handleEditClick}
                    aria-label="Edit item"
                  >
                    <svg className="edit-svgIcon" viewBox="0 0 512 512">
                      <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                    </svg>
                  </button>
                  <button
                    className="action-button delete delete-button"
                    onClick={handleDeleteClick}
                    aria-label="Delete item"
                  >
                    <svg className="trash-svg" viewBox="0 -10 64 74" xmlns="http://www.w3.org/2000/svg">
                      <g id="trash-can">
                        <rect x="16" y="24" width="32" height="30" rx="3" ry="3" fill="#e74c3c"></rect>
                        <g transform-origin="12 18" id="lid-group">
                          <rect x="12" y="12" width="40" height="6" rx="2" ry="2" fill="#c0392b"></rect>
                          <rect x="26" y="8" width="12" height="4" rx="2" ry="2" fill="#c0392b"></rect>
                        </g>
                      </g>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="selected-asset">
              {showFocusedView && focusedNode ? (
                editMode ? (
                  <div className="edit-container">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 30) {
                          setEditName(value);
                        } else {
                          toast.error('Asset name must not exceed 30 characters.');
                        }
                      }}
                      className="edit-input"
                      autoFocus
                      placeholder="Enter asset name..."
                    />
                    <div className="edit-actions">
                      <button className="modal-btn confirm" onClick={handleEditSave}>
                        Save
                      </button>
                      <button className="modal-btn cancel" onClick={handleEditCancel}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <FocusedNodeView node={focusedNode.node} parent={focusedNode.parent} />
                )
              ) : (
                <p className="no-selection">No asset selected</p>
              )}
            </div>
            {showFocusedView && focusedNode && (
              <div className="signals-container">
                <div className="signals-header">
                  <div>
                    <span>⚡ Signals</span>
                    <span className="signals-count">{signals.length}</span>
                  </div>
                  <div className="signals-actions">
                    <button onClick={toggleShowSignals}>
                      {showSignals ? 'Hide Signals' : 'Show Signals'}
                    </button>
                    {isAdmin && (
                      <button onClick={() => setShowAddSignalModal(true)}>+ Add Signal</button>
                    )}
                  </div>
                </div>
                {loadingSignals ? (
                  <p>Loading signals...</p>
                ) : showSignals && signals.length > 0 ? (
                  signals.map((signal) => (
                    <div key={signal.id || signal.signalId || signal.SignalId} className="signal-item">
                      <div className="signal-title">
                        {signal.signalName || signal.SignalName}
                        <span className="signal-type">{signal.signalType || signal.SignalType}</span>
                      </div>
                      <div className="signal-description">
                        {signal.description || signal.Description || 'No description'}
                      </div>
                      {isAdmin && (
                        <div className="signal-actions">
                          <button className="signal-button average" title="Average Value">
                            <img
                              src={Average}
                              alt="Average"
                              width={20}
                              height={20}
                              onClick={() => handleAverageClick(signal.signalId)}
                            />
                          </button>
                          <button
                            className="signal-button edit"
                            aria-label="Edit Signal"
                            title="Edit Signal"
                            onClick={() => handleEditSignalClick(signal)}
                          >
                            <svg height="16" viewBox="0 0 24 24" width="16" fill="currentColor">
                              <path d="M14.06 9.02l.92.92L12 13.92 11.08 13 14.06 9.02zM17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.04 0-1.43L18.36 3.28c-.19-.19-.45-.28-.7-.28zM2 17.25V21h3.75l11.06-11.06-3.75-3.75L2 17.25z"/>
                            </svg>
                          </button>
                          <button
                            className="signal-button delete"
                            aria-label="Delete Signal"
                            title="Delete Signal"
                            onClick={() => handleRemoveSignal(signal.id || signal.signalId || signal.SignalId)}
                          >
                            <svg className="trash-svg" viewBox="0 -10 64 74" xmlns="http://www.w3.org/2000/svg">
                              <g id="trash-can">
                                <rect x="16" y="24" width="32" height="30" rx="3" ry="3" fill="#e74c3c"></rect>
                                <g transform-origin="12 18" id="lid-group">
                                  <rect x="12" y="12" width="40" height="6" rx="2" ry="2" fill="#c0392b"></rect>
                                  <rect x="26" y="8" width="12" height="4" rx="2" ry="2" fill="#c0392b"></rect>
                                </g>
                              </g>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No signals available.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notification Bell and Panel */}
        <div className="notification-bell-container">
          <button
            className="notification-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Toggle Notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>
          {showNotifications && (
            <div className="notification-panel">
              <div className="notification-header">
                <h3>Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    className="clear-all-button"
                    onClick={() => setNotifications([])}
                    aria-label="Clear All Notifications"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="notification">
                      <p>{notification.message}</p>
                      <span className="notification-timestamp">{notification.timestamp}</span>
                      <button
                        className="notification-close"
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.filter((n) => n.id !== notification.id)
                          )
                        }
                        aria-label="Close Notification"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="no-notifications">No notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Modal */}
        {showInfoModal && (
          <div className="modal-overlay">
            <div className="info-modal" role="dialog" aria-modal="true" aria-labelledby="infoModalTitle">
              <div className="info-modal-header">
                <h2 id="infoModalTitle" className="text-2xl font-bold">JSON Upload Instructions</h2>
                <button
                  className="modal-close-button"
                  onClick={handleInfoModalClose}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              <div className="info-modal-content">
                <div className="card shadow-lg p-4 space-y-3">
                  <h3 className="text-xl font-semibold">⚠️ Guidelines</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>All keys (<code>Id</code>, <code>Name</code>, <code>ParentId</code>, <code>Children</code>, <code>Signals</code>, etc.) <b>must be present</b>.</li>
                    <li>Names must start with a letter, contain only letters, numbers, spaces, or underscores, and be up to 30 characters.</li>
                    <li>Signal descriptions must not exceed 200 characters.</li>
                    <li>Duplicate keys are <b>not allowed</b>.</li>
                  </ul>
                </div>
                <div className="card shadow-lg p-4 space-y-3 mt-4">
                  <h3 className="text-xl font-semibold">📄 Example JSON</h3>
                  <div className="scroll-area h-64 rounded-md border p-3 bg-gray-900 text-green-400 text-sm font-mono">
                    <pre>{exampleJson}</pre>
                  </div>
                </div>
              </div>
              <div className="info-modal-footer">
                <div className="left-buttons">
                  <button
                    className="modal-btn copy"
                    onClick={() => navigator.clipboard.writeText(exampleJson)}
                    aria-label="Copy example JSON"
                  >
                    Copy
                  </button>
                  <button
                    className="modal-btn download"
                    onClick={() => {
                      const blob = new Blob([exampleJson], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'example.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    aria-label="Download example JSON"
                  >
                    Download
                  </button>
                </div>
                <button
                  className="modal-btn confirm"
                  onClick={handleInfoModalClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Signal Modal */}
        {showAddSignalModal && isAdmin && (
          <div className="signal-modal-overlay">
            <div className="signal-modal" role="dialog" aria-modal="true" aria-labelledby="addSignalTitle">
              <h3 id="addSignalTitle">{editSignal ? 'Edit Signal' : 'Add New Signal'}</h3>
              <label htmlFor="signalName">Signal Name</label>
              <input
                type="text"
                id="signalName"
                name="signalName"
                placeholder="Enter signal name"
                value={signalForm.signalName}
                onChange={handleSignalInputChange}
                autoFocus
                maxLength={30}
              />
              <label htmlFor="signalType">Signal Type</label>
              <select
                id="signalType"
                name="signalType"
                value={signalForm.signalType}
                onChange={handleSignalInputChange}
              >
                <option value="Integer">Integer</option>
                <option value="Real">Real</option>
              </select>
              <label htmlFor="signalDescription">Description</label>
              <textarea
                id="signalDescription"
                name="description"
                placeholder="Enter signal description (optional)"
                value={signalForm.description}
                onChange={handleSignalInputChange}
                maxLength={200}
              />
              {signalError && <div className="modal-error">{signalError}</div>}
              <div className="modal-actions">
                <button
                  className="modal-btn confirm"
                  onClick={editSignal ? handleUpdateSignal : handleAddSignal}
                >
                  {editSignal ? 'Update Signal' : 'Add Signal'}
                </button>
                <button className="modal-btn cancel" onClick={handleModalCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Root Asset Modal */}
        {showAddModal && isAdmin && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Add New Root Asset</h3>
              <input
                type="text"
                placeholder="Enter asset name..."
                value={newAssetName}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 30) {
                    setNewAssetName(value);
                    setAddError('');
                  } else {
                    setAddError('Asset name must not exceed 30 characters.');
                  }
                }}
                className="modal-input"
                maxLength={30}
              />
              {addError && <div className="modal-error">{addError}</div>}
              <div className="modal-actions">
                <button className="modal-btn confirm" onClick={handleRootAdd}>
                  Add
                </button>
                <button className="modal-btn cancel" onClick={handleAddModalCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Child Asset Modal */}
        {showAddChildModal && isAdmin && focusedNode && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Add Child to {focusedNode.node.name}</h3>
              <input
                type="text"
                placeholder="Enter child asset name..."
                value={childName}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 30) {
                    setChildName(value);
                    setChildAddError('');
                  } else {
                    setChildAddError('Asset name must not exceed 30 characters.');
                  }
                }}
                className="modal-input"
                maxLength={30}
              />
              {childAddError && <div className="modal-error">{childAddError}</div>}
              <div className="modal-actions">
                <button className="modal-btn confirm" onClick={handleAddChild}>
                  Add
                </button>
                <button className="modal-btn cancel" onClick={handleAddChildModalCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Asset Modal */}
        {showDeleteModal && isAdmin && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Confirm Deletion</h3>
              <p>Do you really want to delete Asset {focusedNode?.node.name || ''}?</p>
              <div className="modal-actions">
                <button className="modal-btn confirm" onClick={handleDeleteConfirm}>
                  Delete
                </button>
                <button className="modal-btn cancel" onClick={handleDeleteCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Signal Modal */}
        {showDeleteSignalModal && isAdmin && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Confirm Signal Deletion</h3>
              <p>Do you really want to delete this signal?</p>
              <div className="modal-actions">
                <button className="modal-btn confirm" onClick={handleDeleteSignalConfirm}>
                  Delete
                </button>
                <button className="modal-btn cancel" onClick={handleDeleteSignalCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reorder Modal */}
        {showReorderModal && isAdmin && draggedNode && dropTarget && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Confirm Reorder</h3>
              <p>
                Do you really want to move Asset "{draggedNode.name}" to be a child of "{dropTarget.name}"?
              </p>
              <div className="modal-actions">
                <button className="modal-btn confirm" onClick={handleReorderConfirm}>
                  Move
                </button>
                <button className="modal-btn cancel" onClick={handleReorderCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

export default App;