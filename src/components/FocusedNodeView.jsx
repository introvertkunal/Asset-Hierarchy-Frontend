 function FocusedNodeView({ node, parent }) {
    return (
      <div className="focused-node-view">
        {parent && (
          <div className="focused-parent">
            <h4>Parent</h4>
            <div className="focused-item parent">{parent.name}</div>
          </div>
        )}
        <div className="focused-current">
          <h4>Selected Asset</h4>
          <div className="focused-item current">{node.name}</div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="focused-children">
            <h4>Children</h4>
            {node.children.map((child, index) => (
              <div key={index} className="focused-item child">
                {child.name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  export default FocusedNodeView;