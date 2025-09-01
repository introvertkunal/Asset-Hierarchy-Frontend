import React from 'react';


function TreeNode({ node, expanded, onToggle, onNodeClick }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded[node.id] || false;

  const handleToggleClick = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.id);
    }
  };

  const handleNameClick = (e) => {
    e.stopPropagation();
    onNodeClick(node.id);
  };

  return (
    <li className={`tree-node ${hasChildren ? 'has-children' : 'leaf'} ${isExpanded ? 'expanded' : ''}`}>
      <div className="node-container">
        {hasChildren && (
          <span className="toggle-icon" onClick={handleToggleClick}>
            {isExpanded ? '−' : '+'}
          </span>
        )}
        <span className="node-name" onClick={handleNameClick}>
          {node.name} (ID: {node.id})
        </span>
      </div>
      {hasChildren && isExpanded && (
        <ul className="tree-branch expanded">
          {node.children.map((child, idx) => (
            <TreeNode
              key={idx}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onNodeClick={onNodeClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default TreeNode;