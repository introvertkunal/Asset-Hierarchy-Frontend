const BASE_URL = import.meta.env.VITE_API_URL;

// ---------------- ASSET APIs ----------------

export const fetchHierarchy = async () => {
  const response = await fetch(`${BASE_URL}/Asset/hierarchy`, {
    credentials: 'include', // Include cookies
  });
  if (!response.ok) throw new Error("Failed to fetch hierarchy");
  return await response.json();
};

export const addRoot = async (name) => {
  const response = await fetch(
    `${BASE_URL}/Asset/add?name=${encodeURIComponent(name)}`,
    {
      method: "POST",
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error("Failed to add root asset");
  
  return await response.text();
};

export const addChildNode = async (name, parentId) => {
  const response = await fetch(
    `${BASE_URL}/Asset/add?name=${encodeURIComponent(name)}&parentId=${parentId}`,
    {
      method: "POST",
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error("Failed to add child asset");
  return await response.text();
};

export const removeAsset = async (id) => {
  const response = await fetch(`${BASE_URL}/Asset/remove?id=${id}`, {
    method: "DELETE",
    credentials: 'include',
  });
  if (!response.ok) throw new Error("Failed to delete asset");
  return await response.text();
};

export const updateAsset = async (id, newName) => {
  const response = await fetch(
    `${BASE_URL}/Asset/update?id=${id}&newName=${encodeURIComponent(newName)}`,
    {
      method: "PUT",
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error("Failed to update asset");
  return await response.text();
};

export const searchAsset = async (name) => {
  const response = await fetch(
    `${BASE_URL}/Asset/search?name=${encodeURIComponent(name)}`,
    {
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error("Asset not found");
  return await response.json();
};

export const reorderAsset = async (id, newParentId) => {
  const response = await fetch(
    `${BASE_URL}/Asset/reorder?id=${id}&newParentId=${newParentId ?? ""}`,
    {
      method: "PUT",
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error("Failed to reorder asset");
  return await response.text();
};

export const replaceFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/Asset/replace-file`, {
    method: "POST",
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) throw new Error("Failed to replace file");
  return await response.text();
};

export const downloadFile = async () => {
  const response = await fetch(`${BASE_URL}/Asset/downloadFile`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error("Failed to download file");
  return await response.blob();
};

// ---------------- SIGNAL APIs ----------------

export const fetchSignalsByAssetId = async (assetId) => {
  const response = await fetch(`${BASE_URL}/Signal/node/${assetId}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error("Failed to fetch signals");
  return await response.json();
};

export const addSignal = async (assetId, signal) => {
  const response = await fetch(`${BASE_URL}/Signal/${assetId}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signal),
    credentials: 'include',
  });
  if (!response.ok) throw new Error("Failed to add signal");
  return await response.text();
};

export const removeSignal = async (signalId) => {
  const response = await fetch(`${BASE_URL}/Signal/${signalId}/remove`, {
    method: "DELETE",
    credentials: 'include',
  });
  if (!response.ok) throw new Error("Failed to delete signal");
  return await response.text();
};

export const updateSignal = async (signalId, signal) => {
  const response = await fetch(`${BASE_URL}/Signal/${signalId}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signal),
    credentials: 'include',
  });
  if (!response.ok) throw new Error("Failed to update signal");
  return await response.text();
};
