import React from "react"; 

function TreeNode({ node, expanded = {}, onToggle }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded[node.name] || false;
  
  const handleClick = () => {
    if (hasChildren) {
      onToggle(node.name);
    }
  };

  return (
    <li className={`tree-node ${hasChildren ? 'has-children' : 'leaf'} ${isExpanded ? 'expanded' : ''}`}>
      <span className="node-name" onClick={handleClick}>
        {node.name}
      </span>
      {hasChildren && (
        <ul className={`tree-branch ${isExpanded ? 'expanded' : ''}`}>
          {node.children.map((child, idx) => (
            <TreeNode 
              key={idx} 
              node={child} 
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default TreeNode;