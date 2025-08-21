import React from 'react';

const SuggestionInput = ({ 
  placeholder, 
  value, 
  onChange, 
  suggestions, 
  onSuggestionClick,
  className 
}) => {
  return (
    <div className="suggestion-input-container">
      <input
        type="text"
        placeholder={placeholder}
        className={className}
        value={value}
        onChange={onChange}
      />
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="suggestion-item"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SuggestionInput;