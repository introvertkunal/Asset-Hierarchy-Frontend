import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import '../panels/leftpaneltree.css';

const ItemTypes = {
  NODE: 'node',
};

function TreeNode({ node, expanded, onToggle, onNodeClick, onDragStart, onDrop }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded[node.id] || false;
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.NODE,
    item: () => {
      onDragStart(node);
      return { id: node.id, name: node.name };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.NODE,
    drop: (item) => {
      if (item.id !== node.id) {
        onDrop(node);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

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

  drag(drop(ref));

  return (
    <li className={`tree-node ${hasChildren ? 'has-children' : 'leaf'} ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''} ${isOver ? 'drop-target' : ''}`}>
      <div ref={ref} className="node-container">
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
              onDragStart={onDragStart}
              onDrop={onDrop}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default TreeNode;