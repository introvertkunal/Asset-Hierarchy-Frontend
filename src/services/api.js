const BASE_URL = import.meta.env.VITE_API_URL;

export const fetchHierarchy = async () =>{
    const res = await fetch(`${BASE_URL}/asset/hierarchy`);
   
    if(!res.ok) throw new Error("Failed to fetch hierarchy");
    return res.json();

};

export const addRoot = async (name) => {
  const response = await fetch(`${BASE_URL}/asset/add?name=${encodeURIComponent(name)}`, {
    method: 'POST'
  });
  return response.text();
};

export const addChildNode = async (name, parentId) => {
  if (!parentId) {
    throw new Error('Parent name is required for adding a child node');
  }
  const response = await fetch(`${BASE_URL}/asset/add?name=${encodeURIComponent(name)}&parentId=${encodeURIComponent(parentId)}`, {
    method: 'POST'
  });
  return response.text();
};

export const removeAsset = async (id) => {
    const res = await fetch(`${BASE_URL}/asset/remove?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to remove asset");
    return res.text();
};

export const searchAsset = async (name) => {
    const res = await fetch(`${BASE_URL}/asset/search?name=${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error("Failed to search asset");
    return res.json();
};

export const updateAsset = async (id, newName) => {
    const res = await fetch(`${BASE_URL}/asset/update?id=${encodeURIComponent(id)}&newName=${encodeURIComponent(newName)}`, {
        method: "PUT"
    });
    if (!res.ok) throw new Error("Failed to update asset");
    return res.text();
};

export const reorderAsset = async (id, newParentId) => {
    const res = await fetch(`${BASE_URL}/asset/reorder`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id, newParentId })
    });
    if (!res.ok) throw new Error("Failed to reorder asset");
    return res.text();
};

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/asset/replace-file`, {
        method: "POST",
        header: { "Content-Type" : "application/json"},
        body: formData
    });
    if (!res.ok) throw new Error("Failed to Upload JSON");
    return res.text();
};

export const downloadFile = async () => {
    const res = await fetch(`${BASE_URL}/asset/downloadFile`);
    if (!res.ok) throw new Error("Failed to download JSON");
    return res.blob();
};


export async function fetchSignalsByAssetId(assetId) {
  const response = await fetch(`${BASE_URL}/signal/node/${encodeURIComponent(assetId)}`);
  if (!response.ok) {
    throw new Error("Asset not have Signals");
  }
  return response.json();
}

export async function addSignal(assetId, signal) {
  const response = await fetch(`${BASE_URL}/signal/${encodeURIComponent(assetId)}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(signal),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to add signal');
  }

  return response.text();
}

export async function removeSignal(signalId) {
  const response = await fetch(`${BASE_URL}/signal/${encodeURIComponent(signalId)}/remove`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to remove signal');
  }

  return response.text();
}

export async function updateSignal(signalId, signal) {
  const response = await fetch(`${BASE_URL}/signal/${encodeURIComponent(signalId)}/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(signal),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to update signal');
  }

  return response.text();
}