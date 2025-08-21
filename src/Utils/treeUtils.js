export const filterTree = (tree, searchText) => {
  if (!tree) return null;
  
  if (Array.isArray(tree)) {
    const filteredNodes = tree
      .map(node => filterTree(node, searchText))
      .filter(node => node !== null);
    return filteredNodes.length > 0 ? filteredNodes : null;
  }

  const newNode = { ...tree };
  const matches = newNode.name.toLowerCase().includes(searchText.toLowerCase());
  
  if (matches) {
    return newNode;
  }
  
  if (newNode.children) {
    const filteredChildren = newNode.children
      .map(child => filterTree(child, searchText))
      .filter(child => child !== null);
      
    if (filteredChildren.length > 0) {
      // If any children match, return node with matching children
      newNode.children = filteredChildren;
      return newNode;
    }
  }
  
  return null;
};

  export const buildAssetMap = (node, map = new Map()) => {
    if (!node) return map;
    
    if (Array.isArray(node)) {
      node.forEach(n => buildAssetMap(n, map));
      return map;
    }

    map.set(node.name.toLowerCase(), node.name);
    if (node.children) {
      node.children.forEach(child => buildAssetMap(child, map));
    }
    return map;
  };

export const findNodeAndParent = (tree, nodeName, parent = null) => {
    if (Array.isArray(tree)) {
      for (const node of tree) {
        const result = findNodeAndParent(node, nodeName, null);
        if (result) return result;
      }
      return null;
    }

    if (tree.name === nodeName) {
      return { node: tree, parent };
    }

    if (tree.children) {
      for (const child of tree.children) {
        const result = findNodeAndParent(child, nodeName, tree);
        if (result) return result;
      }
    }

    return null;
  };

