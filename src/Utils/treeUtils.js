// Utils/treeUtils.js
export const buildAssetMap = (tree) => {
  const map = new Map();
  const traverse = (nodes) => {
    if (!nodes) return;
    if (Array.isArray(nodes)) {
      nodes.forEach((node) => {
        map.set(node.id, node.name);
        traverse(node.children);
      });
    } else {
      map.set(nodes.id, nodes.name);
      traverse(nodes.children);
    }
  };
  traverse(tree);
  return map;
};

export const filterTree = (tree, searchTerm) => {
  const lowerTerm = searchTerm.toLowerCase();
  const filterNode = (node) => {
    const matches = node.name.toLowerCase().includes(lowerTerm);
    const filteredChildren = node.children ? node.children.map(filterNode).filter(Boolean) : [];
    if (matches || filteredChildren.length > 0) {
      return {
        id: node.id,
        name: node.name,
        children: filteredChildren,
      };
    }
    return null;
  };

  if (Array.isArray(tree)) {
    return tree.map(filterNode).filter(Boolean);
  }
  return filterNode(tree);
};

export const findNodeAndParent = (tree, id) => {
  const findNode = (nodes, parent = null) => {
    if (!nodes) return null;
    if (Array.isArray(nodes)) {
      for (const node of nodes) {
        if (node.id === id) {
          return { node, parent };
        }
        const result = findNode(node.children, node);
        if (result) return result;
      }
    } else {
      if (nodes.id === id) {
        return { node: nodes, parent };
      }
      return findNode(nodes.children, nodes);
    }
    return null;
  };
  return findNode(tree);
};


export const countAssets = (treeData) => {
  if (!treeData) return 0;

  let count = 0;


  const countNodes = (node) => {
    count += 1; 
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => countNodes(child));
    }
  };

  if (Array.isArray(treeData)) {
    treeData.forEach((node) => countNodes(node));
  } else {
    countNodes(treeData);
  }

  return count;
};