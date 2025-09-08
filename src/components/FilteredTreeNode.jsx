import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import '../panels/leftpaneltree.css';

const ItemTypes = {
  NODE: 'node',
};

function FilteredTreeNode({ node, onNodeClick, onDragStart, onDrop }) {
  const hasChildren = node.children && node.children.length > 0;
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

  const handleNameClick = (e) => {
    e.stopPropagation();
    onNodeClick(node.id);
  };

  drag(drop(ref));

  return (
    <li className={`tree-node ${hasChildren ? 'has-children' : 'leaf'} ${isDragging ? 'dragging' : ''} ${isOver ? 'drop-target' : ''}`}>
      <div ref={ref} className="node-container">
        <span className="node-name filtered-node" onClick={handleNameClick}>
          {node.name} (ID: {node.id})
        </span>
      </div>
      {hasChildren && (
        <ul className="tree-branch expanded">
          {node.children.map((child, idx) => (
            <FilteredTreeNode
              key={idx}
              node={child}
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

export default FilteredTreeNode;