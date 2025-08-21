
const BASE_URL = import.meta.env.VITE_API_URL;

export const fetchHierarchy = async () =>{
    const res = await fetch(`${BASE_URL}/asset/hierarchy`);
    if(!res.ok) throw new Error("Failed to fetch hierarchy");
    return res.json();

};

export const addAsset = async (name,parent) => {
     const res = await fetch(`${BASE_URL}/asset/add?name=${encodeURIComponent(name)}&parentName=${encodeURIComponent(parent)}`,
      {method:"POST"});
      if(!res.ok) throw new Error("Failed to add asset");
      return res.text();

};

export const removeAsset = async (name) => {
    const res = await fetch(`${BASE_URL}/asset/remove?name=${encodeURIComponent(name)}`,
    {method:"DELETE"}
    );
    if(!res.ok) throw new Error("Failed to remove asset");
    return res.text();

};

export const uploadFile = async (file) => {
 const formData = new FormData();   
 formData.append("file",file)
 const res = await fetch(`${BASE_URL}/asset/replace-json`,
    {method:"POST", body: formData}
 );
 if(!res.ok) throw new Error("Failed to Upload JSON");
 return res.text();
};

export const downloadFile = async () => {
    const res = await fetch(`${BASE_URL}/asset/downloadFile`);
    if(!res.ok) throw new Error("Failed to download JSON");
    return res.blob();
};