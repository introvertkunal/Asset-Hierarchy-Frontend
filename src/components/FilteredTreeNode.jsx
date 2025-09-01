import React from 'react';


function FilteredTreeNode({ node, onNodeClick }) {
  const hasChildren = node.children && node.children.length > 0;

  const handleNameClick = () => {
    onNodeClick(node.id);
  };

  return (
    <li className={`tree-node ${hasChildren ? 'has-children' : 'leaf'}`}>
      <span className="node-name filtered-node" onClick={handleNameClick}>
        {node.name} (ID: {node.id})
      </span>
      {hasChildren && (
        <ul className="tree-branch expanded">
          {node.children.map((child, idx) => (
            <FilteredTreeNode
              key={idx}
              node={child}
              onNodeClick={onNodeClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default FilteredTreeNode;