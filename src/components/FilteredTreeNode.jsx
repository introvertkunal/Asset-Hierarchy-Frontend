import React from "react";

function FilteredTreeNode({ node }) {
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <li className={`tree-node ${hasChildren ? 'has-children' : 'leaf'}`}>
      <span className="node-name filtered-node">
        {node.name}
      </span>
      {hasChildren && (
        <ul className="tree-branch expanded">
          {node.children.map((child, idx) => (
            <FilteredTreeNode 
              key={idx} 
              node={child}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default FilteredTreeNode;