const BASE_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ---------------- ASSET APIs ----------------

// Get full hierarchy
export const fetchHierarchy = async () => {
  const response = await fetch(`${BASE_URL}/Asset/hierarchy`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch hierarchy");
  return await response.json();
};

// Add Root Asset
export const addRoot = async (name) => {
  const response = await fetch(
    `${BASE_URL}/Asset/add?name=${encodeURIComponent(name)}`,
    {
      method: "POST",
      headers: { ...getAuthHeaders() },
    }
  );
  if (!response.ok) throw new Error("Failed to add root asset");
  return await response.text();
};

// Add Child Asset
export const addChildNode = async (name, parentId) => {
  const response = await fetch(
    `${BASE_URL}/Asset/add?name=${encodeURIComponent(
      name
    )}&parentId=${parentId}`,
    {
      method: "POST",
      headers: { ...getAuthHeaders() },
    }
  );
  if (!response.ok) throw new Error("Failed to add child asset");
  return await response.text();
};

// Remove Asset
export const removeAsset = async (id) => {
  const response = await fetch(`${BASE_URL}/Asset/remove?id=${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to delete asset");
  return await response.text();
};

// Update Asset
export const updateAsset = async (id, newName) => {
  const response = await fetch(
    `${BASE_URL}/Asset/update?id=${id}&newName=${encodeURIComponent(newName)}`,
    {
      method: "PUT",
      headers: { ...getAuthHeaders() },
    }
  );
  if (!response.ok) throw new Error("Failed to update asset");
  return await response.text();
};

// Search Asset
export const searchAsset = async (name) => {
  const response = await fetch(
    `${BASE_URL}/Asset/search?name=${encodeURIComponent(name)}`,
    {
      headers: { ...getAuthHeaders() },
    }
  );
  if (!response.ok) throw new Error("Asset not found");
  return await response.json();
};

// Reorder Asset
export const reorderAsset = async (id, newParentId) => {
  const response = await fetch(
    `${BASE_URL}/Asset/reorder?id=${id}&newParentId=${newParentId ?? ""}`,
    {
      method: "PUT",
      headers: { ...getAuthHeaders() },
    }
  );
  if (!response.ok) throw new Error("Failed to reorder asset");
  return await response.text();
};

// Replace JSON/XML file
export const replaceFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/Asset/replace-file`, {
    method: "POST",
    headers: { ...getAuthHeaders() }, // no Content-Type for FormData
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to replace file");
  return await response.text();
};

// Download persistence file
export const downloadFile = async () => {
  const response = await fetch(`${BASE_URL}/Asset/downloadFile`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to download file");
  return await response.blob();
};

// ---------------- SIGNAL APIs ----------------

// Get signals under a node
export const fetchSignalsByAssetId = async (assetId) => {
  const response = await fetch(`${BASE_URL}/Signal/node/${assetId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch signals");
  return await response.json();
};

// Add Signal
export const addSignal = async (assetId, signal) => {
  const response = await fetch(`${BASE_URL}/Signal/${assetId}/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(signal),
  });
  if (!response.ok) throw new Error("Failed to add signal");
  return await response.text();
};

// Remove Signal
export const removeSignal = async (signalId) => {
  const response = await fetch(`${BASE_URL}/Signal/${signalId}/remove`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to delete signal");
  return await response.text();
};

// Update Signal
export const updateSignal = async (signalId, signal) => {
  const response = await fetch(`${BASE_URL}/Signal/${signalId}/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(signal),
  });
  if (!response.ok) throw new Error("Failed to update signal");
  return await response.text();
};
